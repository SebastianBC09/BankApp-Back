import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { createProxyMiddleware } from 'http-proxy-middleware';
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

// Proxy middleware configuration
const createProxyConfig = (target, pathRewrite = {}) => ({
  target,
  changeOrigin: true,
  pathRewrite,
  onProxyReq: (proxyReq, req) => {
    if (req.currentUser && req.currentUser._id) {
      proxyReq.setHeader('X-User-ID', req.currentUser._id.toString());
    }
    if (req.body && (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH')) {
      const bodyData = JSON.stringify(req.body);
      proxyReq.setHeader('Content-Type', 'application/json');
      proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
      proxyReq.write(bodyData);
    }
  },
  onError: (err, req, res) => {
    console.error('Proxy Error:', err);
    res.status(502).json({
      status: 'error',
      message: 'Error al conectar con el servicio.'
    });
  }
});

const protectedRouteMiddlewares = [checkJwt, provisionUser];


// Swagger setup
const openapiSpecification = swaggerJSDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openapiSpecification, { explorer: true }));


// --- Rutas para Servicios Node.js ---

/**
 * @swagger
 * /api/v1/node/accounts/balance/{accountId}:
 *   get:
 *     summary: Consultar saldo de cuenta (Node.js)
 *     tags: [Node.js - Accounts]
 *     description: Obtiene el saldo y detalles de una cuenta específica del usuario autenticado, procesado por el servicio Node.js.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: accountId
 *         required: true
 *         description: ID de la cuenta (MongoDB ObjectId) a consultar.
 *         schema:
 *           type: string
 *           format: objectid
 *     responses:
 *       '200':
 *         description: Saldo obtenido exitosamente.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/NodeAccountBalanceResponse'
 *       '401':
 *         $ref: '#/components/responses/UnauthorizedError'
 *       '403':
 *         $ref: '#/components/responses/ForbiddenError'
 *       '404':
 *         $ref: '#/components/responses/NotFoundError'
 *       '500':
 *         $ref: '#/components/responses/InternalServerError'
 */
app.use(
  '/api/v1/node/accounts/balance/:accountId',
  protectedRouteMiddlewares,
  createProxyMiddleware(
    createProxyConfig(config.services.node.balance)
  )
);

/**
 * @swagger
 * /api/v1/node/accounts/deposit/{accountId}:
 *   post:
 *     summary: Realizar un depósito en cuenta (Node.js)
 *     tags: [Node.js - Accounts]
 *     description: Deposita un monto especificado en una cuenta del usuario autenticado, procesado por el servicio Node.js.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: accountId
 *         required: true
 *         description: ID de la cuenta (MongoDB ObjectId) en la cual depositar.
 *         schema:
 *           type: string
 *           format: objectid
 *     requestBody:
 *       required: true
 *       description: Monto a depositar.
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/NodeAmountRequest'
 *     responses:
 *       '200':
 *         description: Depósito exitoso.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/NodeAccountTransactionResponse'
 *       '400':
 *         $ref: '#/components/responses/BadRequestError'
 *       '401':
 *         $ref: '#/components/responses/UnauthorizedError'
 *       '403':
 *         $ref: '#/components/responses/ForbiddenError'
 *       '404':
 *         $ref: '#/components/responses/NotFoundError'
 *       '500':
 *         $ref: '#/components/responses/InternalServerError'
 */
app.use(
  '/api/v1/node/accounts/deposit/:accountId',
  protectedRouteMiddlewares,
  createProxyMiddleware(
    createProxyConfig
    (config.services.node.deposit)
  )
);

/**
 * @swagger
 * /api/v1/node/accounts/withdraw/{accountId}:
 *   post:
 *     summary: Realizar un retiro de cuenta (Node.js)
 *     tags: [Node.js - Accounts]
 *     description: Retira un monto especificado de una cuenta del usuario autenticado, procesado por el servicio Node.js.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: accountId
 *         required: true
 *         description: ID de la cuenta (MongoDB ObjectId) de la cual retirar.
 *         schema:
 *           type: string
 *           format: objectid
 *     requestBody:
 *       required: true
 *       description: Monto a retirar.
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/NodeAmountRequest'
 *     responses:
 *       '200':
 *         description: Retiro exitoso.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/NodeAccountTransactionResponse'
 *       '400':
 *         $ref: '#/components/responses/BadRequestError'
 *       '401':
 *         $ref: '#/components/responses/UnauthorizedError'
 *       '403':
 *         $ref: '#/components/responses/ForbiddenError'
 *       '404':
 *         $ref: '#/components/responses/NotFoundError'
 *       '500':
 *         $ref: '#/components/responses/InternalServerError'
 */
app.use(
  '/api/v1/node/accounts/withdraw/:accountId',
  protectedRouteMiddlewares,
  createProxyMiddleware(
    createProxyConfig(config.services.node.withdrawal)
  )
);

// --- Enrutamiento para Servicios Java/Spring Boot ---

app.use(
  '/api/v1/java/accounts/balance/:accountId',
  protectedRouteMiddlewares,
  createProxyMiddleware(
    createProxyConfig(config.services.balance))
);

app.use(
  '/api/v1/java/accounts/deposit/:accountId',
  protectedRouteMiddlewares,
  createProxyMiddleware(
    createProxyConfig(config.services.deposit))
);

app.use(
  '/api/v1/java/accounts/withdraw/:accountId',
  protectedRouteMiddlewares,
  createProxyMiddleware(
    createProxyConfig(config.services.withdrawal))
);

// Rutas de Usuario (ej. completar perfil)
// Asumamos que hay un UserProfileService o que el Gateway maneja esto si es simple,
// o que uno de los servicios existentes se encarga (menos ideal para separación).
// Por ahora, si la lógica de completar perfil (userController, userService)
// la quieres en el Gateway porque maneja el UserModel:
// import userRouter from './routes/userRoutes.js'; // Necesitarías crear este router en el Gateway


app.get('/', (_req, res) => {
  res.send(
    `API Gateway (${config.nodeEnv}) - Status: OK - ${new Date().toLocaleTimeString('es-CO', { timeZone: 'America/Bogota' })}`
  );
});

// Error handling middleware
app.use((err, _req, res, _next) => {
  const statusCode = err.statusCode || 500;
  const status = err.status || 'error';

  if (config.nodeEnv !== 'test') {
    console.error('API Gateway Error:', err);
  }

  res.status(statusCode).json({
    status,
    message: config.nodeEnv === 'development' ? err.message : 'Internal server error'
  });
});

export default app;