import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { createProxyMiddleware, fixRequestBody } from 'http-proxy-middleware';
import config from './config/envConfig.js';
import { checkJwt } from './middlewares/authMiddleware.js';
import { provisionUser } from './middlewares/userProvisioningMiddleware.js';
import AppError from './utils/appError.js';

const app = express();

app.use(cors({ origin: config.cors.origin }));
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

if (config.nodeEnv === 'development') {
  app.use(morgan('dev'));
}

const addUserHeaderToProxyReq = (proxyReq, req) => {
  if (req.currentUser && req.currentUser._id) {
    proxyReq.setHeader('x-user-id', req.currentUser._id.toString());
  }
  fixRequestBody(proxyReq, req);
};

const handleProxyError = (err, _req, res, originalUrl) => {
  console.error(`Error en el proxy para ${originalUrl}:`, err);
  if (!res.headersSent) {
    res.status(502).json({ status: 'error', message: 'Error al contactar el servicio downstream.' });
  }
};


const createAccountProxyOptions = (targetServiceUrl, microserviceBasePath) => ({
  target: targetServiceUrl,
  changeOrigin: true,
  pathRewrite: (path, _req) => `${microserviceBasePath}${path.replace('/api/v1/accounts', '')}`,
  onProxyReq: addUserHeaderToProxyReq,
  onError: (err, req, res) => handleProxyError(err, req, res, req.originalUrl), // onError se usa aquí
});


app.use('/api/v1/accounts/balance/:accountId',checkJwt, provisionUser, createProxyMiddleware(createAccountProxyOptions(config.services.balance, '/balance')));

app.use('/api/v1/accounts/deposit/:accountId', checkJwt, provisionUser, createProxyMiddleware(createAccountProxyOptions(config.services.deposit, '/deposit')));

app.use('/api/v1/accounts/withdraw/:accountId', checkJwt, provisionUser, createProxyMiddleware(createAccountProxyOptions(config.services.withdrawal, '/withdraw')));

// Rutas de Usuario (ej. completar perfil)
// Asumamos que hay un UserProfileService o que el Gateway maneja esto si es simple,
// o que uno de los servicios existentes se encarga (menos ideal para separación).
// Por ahora, si la lógica de completar perfil (userController, userService)
// la quieres en el Gateway porque maneja el UserModel:
// import userRouter from './routes/userRoutes.js'; // Necesitarías crear este router en el Gateway
// app.use('/api/v1/users', checkJwt, provisionUser, addUserHeader, userRouter);


app.get('/', (_req, res) => {
  res.send(`API Gateway (Modo: ${config.nodeEnv}) funcionando! Hora Bogotá: ${new Date().toLocaleTimeString('es-CO', { timeZone: 'America/Bogota' })}`);
});

app.all('*', (req, _res, next) => {
  next(new AppError(`La ruta ${req.originalUrl} no se encontró en el API Gateway.`, 404));
});

app.use((err, req, res, _next) => {
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
    message: isOperationalError || config.nodeEnv === 'development' ? err.message : 'Ocurrió un error inesperado en el servidor.',
  };

  if (config.nodeEnv === 'development' && err.stack) {
    errorResponse.stack = err.stack;
  }

  if (!res.headersSent) {
    res.status(err.statusCode).json(errorResponse);
  }
});

export default app;
