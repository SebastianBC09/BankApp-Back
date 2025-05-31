import { createProxyMiddleware, fixRequestBody } from 'http-proxy-middleware';

export function createServiceProxy(
  serviceName,
  primaryTarget,
  pathRewritePrimary,
  fallbackTarget,
  pathRewriteFallback
) {
  const primaryProxyOptions = {
    target: primaryTarget,
    changeOrigin: true,
    pathRewrite: pathRewritePrimary,
    selfHandleResponse: false,
    on: {
      proxyReq: (proxyReq, req, res) => {
        console.log(
          `[API Gateway - Proxy DEBUG - ${serviceName} (Primary)] Evento proxyReq disparado para: ${req.method} ${req.originalUrl}`
        );
        console.log(
          `[API Gateway - Proxy DEBUG - ${serviceName} (Primary)] Using X-User-ID: ${req.headers['x-user-id'] || req.headers['X-User-ID']}`
        );

        if (req.body && (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH')) {
          console.log(
            `[API Gateway - Proxy DEBUG - ${serviceName} (Primary)] Aplicando fixRequestBody para método ${req.method}.`
          );
          fixRequestBody(proxyReq, req);
        }
        console.log(
          `[API Gateway - Proxy DEBUG - ${serviceName} (Primary)] Redirigiendo '${req.method} ${req.originalUrl}' A: '${proxyReq.protocol}//${proxyReq.host}${proxyReq.path}'`
        );
      },
      error: (err, req, res, target) => {
        console.error(
          `[API Gateway - Proxy ERROR - ${serviceName} (Primary)] Error con target ${target?.href || primaryTarget}:`,
          err.message
        );
        if (err.stack && process.env.NODE_ENV === 'development') {
          console.error(`[API Gateway - Proxy ERROR - ${serviceName} (Primary)] Stack:`, err.stack);
        }

        if (res.headersSent) {
          console.warn(`[API Gateway - Proxy ERROR - ${serviceName} (Primary)] Headers already sent, cannot attempt fallback.`);
          if (!res.writableEnded) {
            res.end();
          }
          return;
        }

        if (fallbackTarget && !req.isFallbackAttempt) {
          req.isFallbackAttempt = true;
          console.warn(
            `[API Gateway - Proxy FALLBACK - ${serviceName}] Primary service failed. Attempting fallback to ${fallbackTarget}`
          );
          if (req.currentUser && req.currentUser.postgresId) {
            req.headers['X-User-ID'] = req.currentUser.postgresId.toString();
            console.log(
              `[API Gateway - Proxy FALLBACK - ${serviceName}] Switched X-User-ID to PostgreSQL ID: ${req.headers['X-User-ID']}`
            );
          } else {
            console.error(
              `[API Gateway - Proxy FALLBACK - ${serviceName}] PostgreSQL User ID (postgresId) no encontrado en req.currentUser. No se puede establecer X-User-ID para el servicio Java.`
            );
            return res.status(503).json({
              status: 'error',
              message: `Servicio primario no disponible y no se pudo determinar el ID de usuario para el servicio de respaldo (${serviceName}).`,
            });
          }

          const fallbackProxy = createProxyMiddleware({
            target: fallbackTarget,
            changeOrigin: true,
            pathRewrite: pathRewriteFallback,
            selfHandleResponse: false,
            on: {
              proxyReq: (fbProxyReq, fbReq, fbRes) => {
                console.log(
                  `[API Gateway - Proxy DEBUG - ${serviceName} (Fallback)] Evento proxyReq disparado para: ${fbReq.method} ${fbReq.originalUrl}`
                );
                console.log(
                  `[API Gateway - Proxy DEBUG - ${serviceName} (Fallback)] Using X-User-ID: ${fbReq.headers['X-User-ID']}`
                );
                if (fbReq.body && (fbReq.method === 'POST' || fbReq.method === 'PUT' || fbReq.method === 'PATCH')) {
                  console.log(
                    `[API Gateway - Proxy DEBUG - ${serviceName} (Fallback)] Aplicando fixRequestBody para método ${fbReq.method}.`
                  );
                  fixRequestBody(fbProxyReq, fbReq);
                }
                console.log(
                  `[API Gateway - Proxy DEBUG - ${serviceName} (Fallback)] Redirigiendo '${fbReq.method} ${fbReq.originalUrl}' A: '${fbProxyReq.protocol}//${fbProxyReq.host}${fbProxyReq.path}'`
                );
              },
              error: (fallbackErr, fbReq, fbRes, fbTarget) => {
                console.error(
                  `[API Gateway - Proxy ERROR - ${serviceName} (Fallback)] Error con target de respaldo ${fbTarget?.href || fallbackTarget}:`,
                  fallbackErr.message
                );
                if (!fbRes.headersSent) {
                  fbRes.status(502).json({
                    status: 'error',
                    message: `Error de comunicación con el servicio ${serviceName} y su respaldo. Por favor, intente más tarde.`,
                  });
                } else if (!fbRes.writableEnded) {
                  fbRes.end();
                }
              },
              proxyRes: (fbProxyRes, fbReq, fbRes) => {
                console.log(
                  `[API Gateway - Proxy DEBUG - ${serviceName} (Fallback)] Respuesta recibida del backend de respaldo con estado: ${fbProxyRes.statusCode}`
                );
              },
            },
          });
          return fallbackProxy(req, res, (finalErr) => {
            if (finalErr) {
              console.error(`[API Gateway - Proxy FALLBACK - ${serviceName}] Error no manejado por el proxy de respaldo:`, finalErr);
              if (!res.headersSent) {
                res.status(500).json({ status: 'error', message: 'Error inesperado durante el fallback.' });
              } else if (!res.writableEnded) {
                res.end();
              }
            }
          });
        } else {
          if (!res.headersSent) {
            return res.status(502).json({
              status: 'error',
              message: `Error de comunicación con el servicio ${serviceName}. ${fallbackTarget ? 'El servicio de respaldo también falló o no está configurado.' : 'No hay servicio de respaldo configurado.'} Por favor, intente más tarde.`,
            });
          } else if (!res.writableEnded) {
            res.end();
          }
        }
      },
      proxyRes: (proxyRes, req, res) => {
        if (!req.isFallbackAttempt) {
          console.log(
            `[API Gateway - Proxy DEBUG - ${serviceName} (Primary)] Respuesta recibida del backend primario con estado: ${proxyRes.statusCode}`
          );
        }
      },
    },
  };

  return createProxyMiddleware(primaryProxyOptions);
}
