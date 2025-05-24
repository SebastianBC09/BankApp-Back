import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { createProxyMiddleware, fixRequestBody } from 'http-proxy-middleware';
import config from './config/envConfig.js';
import { checkJwt } from './middlewares/authMiddleware.js';
import { provisionUser } from './middlewares/userProvisioningMiddleware.js';
import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import swaggerOptions from './config/swaggerConfig.js';

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

const createNodeServiceProxyOptions = (targetUrl, serviceNameForLog) => ({
  target: targetUrl,
  changeOrigin: true,
  pathRewrite: (path, req) => {
    return path.replace('/api/v1/node/accounts', '');
  },
  onProxyReq: addUserHeaderAndFixBody,
  onError: (err, req, res) => handleProxyError(err, req, res, serviceNameForLog),
});

const createJavaServiceProxyOptions = (
  targetUrl,
  microserviceInternalBasePath,
  serviceNameForLog
) => ({
  target: targetUrl,
  changeOrigin: true,
  pathRewrite: (path, req) => {
    const pathParts = path.split('/');
    const accountId = pathParts[5];
    return `${microserviceInternalBasePath}/${accountId}`;
  },
  onProxyReq: addUserHeaderAndFixBody,
  onError: (err, req, res) => handleProxyError(err, req, res, serviceNameForLog),
});

const protectedRouteMiddlewares = [checkJwt, provisionUser];

// --- Swagger Docs (Configurado desde swaggerConfig.js) ---
const openapiSpecification = swaggerJSDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openapiSpecification, { explorer: true }));

// --- Rutas para Servicios Node.js ---

/**
 * @swagger
 * /api/v1/node/accounts/{accountId}/balance:
 * get:
 * summary: Consultar saldo de cuenta (Node.js)
 * tags: [Node.js - Accounts]
 * description: Obtiene el saldo y detalles de una cuenta específica del usuario autenticado, procesado por el servicio Node.js.
 * security:
 * - bearerAuth: []
 * parameters:
 * - in: path
 * name: accountId
 * required: true
 * description: ID de la cuenta (MongoDB ObjectId) a consultar.
 * schema:
 * type: string
 * format: objectid
 * responses:
 * '200':
 * description: Saldo obtenido exitosamente.
 * content:
 * application/json:
 * schema:
 * $ref: '#/components/schemas/NodeAccountBalanceResponse'
 * '401':
 * $ref: '#/components/responses/UnauthorizedError'
 * '403':
 * $ref: '#/components/responses/ForbiddenError'
 * '404':
 * $ref: '#/components/responses/NotFoundError'
 * '500':
 * $ref: '#/components/responses/InternalServerError'
 */
app.use(
  '/api/v1/node/accounts/balance/:accountId',
  ...protectedRouteMiddlewares,
  createProxyMiddleware(
    createNodeServiceProxyOptions(config.services.node.balance, 'NodeBalanceService')
  )
);

/**
 * @swagger
 * /api/v1/node/accounts/{accountId}/deposit:
 * post:
 * summary: Realizar un depósito en cuenta (Node.js)
 * tags: [Node.js - Accounts]
 * description: Deposita un monto especificado en una cuenta del usuario autenticado, procesado por el servicio Node.js.
 * security:
 * - bearerAuth: []
 * parameters:
 * - in: path
 * name: accountId
 * required: true
 * description: ID de la cuenta (MongoDB ObjectId) en la cual depositar.
 * schema:
 * type: string
 * format: objectid
 * requestBody:
 * required: true
 * description: Monto a depositar.
 * content:
 * application/json:
 * schema:
 * $ref: '#/components/schemas/NodeAmountRequest'
 * responses:
 * '200':
 * description: Depósito exitoso.
 * content:
 * application/json:
 * schema:
 * $ref: '#/components/schemas/NodeAccountTransactionResponse'
 * '400':
 * $ref: '#/components/responses/BadRequestError'
 * '401':
 * $ref: '#/components/responses/UnauthorizedError'
 * '403':
 * $ref: '#/components/responses/ForbiddenError'
 * '404':
 * $ref: '#/components/responses/NotFoundError'
 * '500':
 * $ref: '#/components/responses/InternalServerError'
 */
app.use(
  '/api/v1/node/accounts/deposit/:accountId',
  ...protectedRouteMiddlewares,
  createProxyMiddleware(
    createNodeServiceProxyOptions(config.services.node.deposit, 'NodeDepositService')
  )
);

// --- Enrutamiento para Servicios Java/Spring Boot ---

/**
 * @swagger
 * /api/v1/node/accounts/{accountId}/withdraw:
 * post:
 * summary: Realizar un retiro de cuenta (Node.js)
 * tags: [Node.js - Accounts]
 * description: Retira un monto especificado de una cuenta del usuario autenticado, procesado por el servicio Node.js.
 * security:
 * - bearerAuth: []
 * parameters:
 * - in: path
 * name: accountId
 * required: true
 * description: ID de la cuenta (MongoDB ObjectId) de la cual retirar.
 * schema:
 * type: string
 * format: objectid
 * requestBody:
 * required: true
 * description: Monto a retirar.
 * content:
 * application/json:
 * schema:
 * $ref: '#/components/schemas/NodeAmountRequest'
 * responses:
 * '200':
 * description: Retiro exitoso.
 * content:
 * application/json:
 * schema:
 * $ref: '#/components/schemas/NodeAccountTransactionResponse'
 * '400':
 * $ref: '#/components/responses/BadRequestError'
 * '401':
 * $ref: '#/components/responses/UnauthorizedError'
 * '403':
 * $ref: '#/components/responses/ForbiddenError'
 * '404':
 * $ref: '#/components/responses/NotFoundError'
 * '500':
 * $ref: '#/components/responses/InternalServerError'
 */
app.use(
  '/api/v1/node/accounts/withdraw/:accountId',
  ...protectedRouteMiddlewares,
  createProxyMiddleware(
    createNodeServiceProxyOptions(config.services.node.withdrawal, 'NodeWithdrawalService')
  )
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
