import { createProxyMiddleware, fixRequestBody } from 'http-proxy-middleware';
import config from '../config/envConfig.js';

export function createServiceProxy(
  serviceName,
  primaryTarget,
  pathRewritePrimary,
  fallbackTarget,
  pathRewriteFallback,
  transactionDetails
) {
  const primaryProxyOptions = {
    target: primaryTarget,
    changeOrigin: true,
    pathRewrite: pathRewritePrimary,
    selfHandleResponse: true,
    on: {
      proxyReq: (proxyReq, req, res) => {
        if (req.body && (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH')) {
          fixRequestBody(proxyReq, req);
        }
      },
      proxyRes: (proxyRes, req, res) => {
        let originalBodyNode = Buffer.from('');
        proxyRes.on('data', (chunk) => {
          originalBodyNode = Buffer.concat([originalBodyNode, chunk]);
        });

        proxyRes.on('end', async () => {
          if (!req.isFallbackAttempt) {
            if (proxyRes.statusCode >= 200 && proxyRes.statusCode < 300) {
              try {
                const nodeResponseData = JSON.parse(originalBodyNode.toString());
                let newBalanceFromNodeForGo = nodeResponseData.data?.newBalance;
                if (typeof newBalanceFromNodeForGo === 'string') {
                  newBalanceFromNodeForGo = parseFloat(newBalanceFromNodeForGo);
                }

                const syncPayloadMongoToPg = {
                  source_user_system_id: req.currentUser.mongoId?.toString(),
                  auth0_id: req.currentUser.auth0Id,
                  source_account_number: req.body?.accountNumber || nodeResponseData.data?.accountNumber,
                  transaction_type: transactionDetails?.type,
                  amount: transactionDetails?.amount || req.body?.amount,
                  currency: transactionDetails?.currency || req.body?.currency || nodeResponseData.data?.currency || "USD",
                  new_balance_source_system: newBalanceFromNodeForGo,
                  transaction_timestamp_source_system: nodeResponseData.data?.transactionTimestamp || new Date().toISOString(),
                  source_transaction_id: nodeResponseData.data?.transactionId,
                };

                if (!syncPayloadMongoToPg.source_user_system_id ||
                  !syncPayloadMongoToPg.transaction_type ||
                  syncPayloadMongoToPg.amount == null ||
                  syncPayloadMongoToPg.new_balance_source_system == null ||
                  isNaN(syncPayloadMongoToPg.new_balance_source_system)
                ) {
                  console.error(`[API Gateway - SYNC PREP FAIL (M->P) - ${serviceName}] Datos insuficientes o new_balance inválido para la sincronización. Payload:`, JSON.stringify(syncPayloadMongoToPg, null, 2));
                } else {
                  const syncServiceUrl = `${config.goSyncServiceUrl}/sync/mongo-to-postgres`;
                  fetch(syncServiceUrl, {
                    method: 'POST',
                    body: JSON.stringify(syncPayloadMongoToPg),
                    headers: { 'Content-Type': 'application/json' },
                  })
                    .then(async syncRes => {
                      const responseBodyText = await syncRes.text();
                      if (!syncRes.ok) {
                        console.error(
                          `[API Gateway - SYNC ERROR (M->P) - ${serviceName}] Go Sync Service respondió con error ${syncRes.status}: ${responseBodyText}`
                        );
                      } else {
                        console.log(
                          `[API Gateway - SYNC SUCCESS (M->P) - ${serviceName}] Go Sync Service respondió ${syncRes.status}: ${responseBodyText}`
                        );
                      }
                    })
                    .catch(syncErr => {
                      console.error(
                        `[API Gateway - SYNC FAILURE (M->P) - ${serviceName}] Error llamando al Go Sync Service:`,
                        syncErr.message
                      );
                    });
                }
              } catch (parseOrSyncError) {
                console.error(
                  `[API Gateway - SYNC EXCEPTION (M->P) - ${serviceName}] Error procesando respuesta de Node o llamando a Go Sync:`,
                  parseOrSyncError
                );
              }
            }
          }
          if (!res.headersSent) {
            res.writeHead(proxyRes.statusCode, proxyRes.headers);
          }
          res.end(originalBodyNode);
        });
        proxyRes.on('error', (proxyErr) => {
          if (!res.headersSent) {
            res.status(500).json({ status: 'error', message: 'Error procesando la respuesta del servicio primario.' });
          } else if (!res.writableEnded) {
            res.end();
          }
        });
      },
      error: (err, req, res, target) => {
        if (res.headersSent) {
          if (!res.writableEnded) {
            res.end();
          }
          return;
        }

        if (fallbackTarget && !req.isFallbackAttempt) {
          req.isFallbackAttempt = true;
          if (req.currentUser && req.currentUser.postgresId) {
            req.headers['X-User-ID'] = req.currentUser.postgresId.toString();
          } else {
            return res.status(503).json({
              status: 'error',
              message: `Servicio primario no disponible y no se pudo determinar el ID de usuario para el servicio de respaldo (${serviceName}).`,
            });
          }

          const fallbackProxy = createProxyMiddleware({
            target: fallbackTarget,
            changeOrigin: true,
            pathRewrite: pathRewriteFallback,
            selfHandleResponse: true,
            on: {
              proxyReq: (fbProxyReq, fbReq, fbRes) => {
                if (fbReq.body && (fbReq.method === 'POST' || fbReq.method === 'PUT' || fbReq.method === 'PATCH')) {
                  fixRequestBody(fbProxyReq, fbReq);
                }
              },
              proxyRes: (fbProxyRes, fbReq, fbRes) => {
                let originalBodyFallback = Buffer.from('');
                fbProxyRes.on('data', (chunk) => {
                  originalBodyFallback = Buffer.concat([originalBodyFallback, chunk]);
                });
                fbProxyRes.on('end', async () => {
                  if (fbProxyRes.statusCode >= 200 && fbProxyRes.statusCode < 300) {
                    try {
                      const javaResponseData = JSON.parse(originalBodyFallback.toString());
                      let newBalanceFromJavaForGo = javaResponseData.data?.newBalance;
                      if (typeof newBalanceFromJavaForGo === 'string') {
                        newBalanceFromJavaForGo = parseFloat(newBalanceFromJavaForGo);
                      }

                      const syncPayloadPgToMongo = {
                        source_user_system_id: fbReq.currentUser.postgresId?.toString(),
                        auth0_id: fbReq.currentUser.auth0Id,
                        source_account_number: fbReq.body?.accountNumber || javaResponseData.data?.accountNumber,
                        transaction_type: transactionDetails?.type,
                        amount: transactionDetails?.amount || fbReq.body?.amount || javaResponseData.data?.amountProcessed,
                        currency: transactionDetails?.currency || fbReq.body?.currency || javaResponseData.data?.currency || "USD",
                        new_balance_source_system: newBalanceFromJavaForGo,
                        transaction_timestamp_source_system: javaResponseData.data?.transactionTimestamp || new Date().toISOString(),
                        source_transaction_id: javaResponseData.data?.transactionId,
                      };

                      if (!syncPayloadPgToMongo.source_user_system_id ||
                        !syncPayloadPgToMongo.transaction_type ||
                        syncPayloadPgToMongo.amount == null ||
                        syncPayloadPgToMongo.new_balance_source_system == null ||
                        isNaN(syncPayloadPgToMongo.new_balance_source_system)
                      ) {
                        console.error(`[API Gateway - SYNC PREP FAIL (P->M) - ${serviceName}] Datos insuficientes o new_balance inválido para la sincronización. Payload:`, JSON.stringify(syncPayloadPgToMongo, null, 2));
                      } else {
                        const syncServiceUrl = `${config.goSyncServiceUrl}/sync/postgres-to-mongo`;
                        fetch(syncServiceUrl, {
                          method: 'POST',
                          body: JSON.stringify(syncPayloadPgToMongo),
                          headers: { 'Content-Type': 'application/json' },
                        })
                          .then(async syncRes => {
                            const responseBodyText = await syncRes.text();
                            if (!syncRes.ok) {
                              console.error(`[API Gateway - SYNC ERROR (P->M) - ${serviceName}] Go Sync Service respondió con error ${syncRes.status}: ${responseBodyText}`);
                            } else {
                              console.log(`[API Gateway - SYNC SUCCESS (P->M) - ${serviceName}] Go Sync Service respondió ${syncRes.status}: ${responseBodyText}`);
                            }
                          })
                          .catch(syncErr => {
                            console.error(`[API Gateway - SYNC FAILURE (P->M) - ${serviceName}] Error llamando al Go Sync Service:`, syncErr.message);
                          });
                      }
                    } catch (parseOrSyncError) {
                      console.error(`[API Gateway - SYNC EXCEPTION (P->M) - ${serviceName}] Error procesando respuesta de Java o llamando a Go Sync:`, parseOrSyncError);
                    }
                  }
                  if (!fbRes.headersSent) {
                    fbRes.writeHead(fbProxyRes.statusCode, fbProxyRes.headers);
                  }
                  fbRes.end(originalBodyFallback);
                });
                fbProxyRes.on('error', (proxyErr) => {
                  if (!fbRes.headersSent) {
                    fbRes.status(500).json({ status: 'error', message: 'Error procesando la respuesta del servicio de respaldo.' });
                  } else if (!fbRes.writableEnded) {
                    fbRes.end();
                  }
                });
              },
              error: (fallbackErr, fbReq, fbRes, fbTarget) => {
                if (!fbRes.headersSent) {
                  fbRes.status(502).json({
                    status: 'error',
                    message: `Error de comunicación con el servicio ${serviceName} y su respaldo. Por favor, intente más tarde.`,
                  });
                } else if (!fbRes.writableEnded) {
                  fbRes.end();
                }
              },
            },
          });
          return fallbackProxy(req, res, (finalErr) => {
            if (finalErr) {
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
    },
  };

  return createProxyMiddleware(primaryProxyOptions);
}