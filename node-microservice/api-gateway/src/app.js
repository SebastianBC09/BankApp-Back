import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { createProxyMiddleware, fixRequestBody } from 'http-proxy-middleware';
import config from './config/envConfig.js';
import { checkJwt } from './middlewares/authMiddleware.js';
import { provisionUser } from './middlewares/userProvisioningMiddleware.js';

const app = express();

app.use(cors({ origin: config.cors.origin }));
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

if (config.nodeEnv === 'development') {
  app.use(morgan('dev'));
}

const addUserHeaderAndFixBody = (proxyReq, req) => {
  if (req.currentUser && req.currentUser._id) {
    proxyReq.setHeader('X-User-ID', req.currentUser._id.toString());
  }
  if (req.body && (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH')) {
    fixRequestBody(proxyReq, req);
  }
};

const handleProxyError = (err, req, res, serviceName) => {
  console.error(`Error en proxy hacia ${serviceName} para ${req.originalUrl}:`, err);
  if (!res.headersSent) {
    res
      .status(502)
      .json({ status: 'error', message: `Error al contactar el servicio de ${serviceName}.` });
  }
};

const createServiceProxyOptions = (
  targetUrl,
  microserviceInternalBasePath,
  serviceNameForLog,
  isJavaService = false
) => ({
  target: targetUrl,
  changeOrigin: true,
  pathRewrite: (path, req) => {
    let newPath = '';
    if (isJavaService) {
      const pathParts = path.split('/');
      const accountId = pathParts[5];
      newPath = `${microserviceInternalBasePath}/${accountId}`;
    } else {
      const baseApiPrefixToRemove = '/api/v1/node/accounts';
      const remainingPath = path.startsWith(baseApiPrefixToRemove)
        ? path.substring(baseApiPrefixToRemove.length)
        : path;
      newPath = `${microserviceInternalBasePath}${remainingPath}`;
    }
    return newPath;
  },
  onProxyReq: addUserHeaderAndFixBody,
  onError: (err, req, res) => handleProxyError(err, req, res, serviceNameForLog),
});

const protectedRouteMiddlewares = [checkJwt, provisionUser];

app.use(
  '/api/v1/node/accounts/balance/:accountId',
  ...protectedRouteMiddlewares,
  createProxyMiddleware(createServiceProxyOptions(config.services.balance, '/balance'))
);
app.use(
  '/api/v1/node/accounts/deposit/:accountId',
  checkJwt,
  provisionUser,
  createProxyMiddleware(createServiceProxyOptions(config.services.deposit, '/deposit'))
);
app.use(
  '/api/v1/node/accounts/withdraw/:accountId',
  checkJwt,
  provisionUser,
  createProxyMiddleware(createServiceProxyOptions(config.services.withdrawal, '/withdraw'))
);

app.use(
  '/api/v1/java/accounts/balance/:accountId',
  ...protectedRouteMiddlewares,
  createProxyMiddleware(createServiceProxyOptions(config.services.balance, '/balance'))
);

app.use(
  '/api/v1/java/accounts/deposit/:accountId',
  ...protectedRouteMiddlewares,
  createProxyMiddleware(createServiceProxyOptions(config.services.deposit, '/deposit'))
);

app.use(
  '/api/v1/java/accounts/withdraw/:accountId',
  ...protectedRouteMiddlewares,
  createProxyMiddleware(createServiceProxyOptions(config.services.withdrawal, '/withdraw'))
);

// Rutas de Usuario (ej. completar perfil)
// Asumamos que hay un UserProfileService o que el Gateway maneja esto si es simple,
// o que uno de los servicios existentes se encarga (menos ideal para separación).
// Por ahora, si la lógica de completar perfil (userController, userService)
// la quieres en el Gateway porque maneja el UserModel:
// import userRouter from './routes/userRoutes.js'; // Necesitarías crear este router en el Gateway
// app.use('/api/v1/users', checkJwt, provisionUser, addUserHeader, userRouter);

app.get('/', (_req, res) => {
  res.send(
    `API Gateway (Modo: ${config.nodeEnv}) funcionando! Hora Bogotá: ${new Date().toLocaleTimeString('es-CO', { timeZone: 'America/Bogota' })}`
  );
});

app.use((err, _req, res, _next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';
  const isOperationalError = err.isOperational || false;

  if (config.nodeEnv !== 'test') {
    console.error('ERROR EN API GATEWAY 💥:', {
      name: err.name,
      message: err.message,
      statusCode: err.statusCode,
      status: err.status,
      isOperational: isOperationalError,
      stack: config.nodeEnv === 'development' ? err.stack : undefined,
    });
  }

  const errorResponse = {
    status: err.status,
    message:
      isOperationalError || config.nodeEnv === 'development'
        ? err.message
        : 'Ocurrió un error inesperado en el servidor.',
  };
  if (config.nodeEnv === 'development' && err.stack) errorResponse.stack = err.stack;

  if (!res.headersSent) res.status(err.statusCode).json(errorResponse);
});

export default app;
