import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import config from './config/envConfig.js';
import { checkJwt } from './middlewares/authMiddleware.js';
import { populateHeaders } from './middlewares/HeaderPopulationMiddleware.js';
import { provisionUser } from './middlewares/userProvisioningMiddleware.js';
import { createServiceProxy } from './utils/serviceProxy.js';
import { SERVICE_TARGETS } from './constants/serviceTargets.js';
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

//Middlewares
app.use('/api', checkJwt);
app.use('/api', provisionUser);
app.use('/api', populateHeaders);

// Swagger setup
const openapiSpecification = swaggerJSDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openapiSpecification, { explorer: true }));

/**
 * @swagger
 * /api/account/balance:
 *   get:
 *       summary: Consultar saldo de la cuenta del usuario autenticado (Node.js)
 *       tags:
 *         - "Node.js - Accounts"
 *       description: >
 *         Obtiene el saldo y detalles de la cuenta asociada al usuario autenticado.
 *         El API Gateway se encarga de la autenticación, extrae el ID del usuario
 *         del token, y lo pasa al servicio backend a través del header `X-User-ID`.
 *       security:
 *         - bearerAuth: []
 *       parameters:
 *         - in: header
 *           name: X-User-ID
 *           required: true
 *           description: >
 *             ID del usuario (MongoDB ObjectId). Este header es inyectado por el API Gateway
 *             después de una autenticación exitosa y es requerido por el servicio backend.
 *             Para pruebas directas en Swagger UI, este valor debe ser proporcionado.
 *           schema:
 *             type: string
 *             example: "60d5f1f89c89a0001a2b3c4d"
 *       responses:
 *         "200":
 *           description: Saldo y detalles de la cuenta obtenidos exitosamente.
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/NodeAccountBalanceResponse'
 *         "400":
 *           description: Error de validación (ej. X-User-ID con formato incorrecto).
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/responses/BadRequestError'
 *         "401":
 *           description: >
 *             No autorizado. Puede ser por token JWT inválido/ausente
 *             (manejado por el API Gateway), o por falta/invalidéz del header `X-User-ID`.
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/responses/UnauthorizedError'
 *         "403":
 *           description: Prohibido (ej. la cuenta del usuario no está activa).
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/responses/ForbiddenError'
 *         "404":
 *           description: No encontrado (ej. no se encontró una cuenta para el ID proporcionado).
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/responses/NotFoundError'
 *         "500":
 *           description: Error interno del servidor.
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/responses/InternalServerError'
 *
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *
 *   schemas:
 *     NodeAccountBalanceResponse:
 *       type: object
 *       properties:
 *         status:
 *           type: string
 *           example: success
 *         data:
 *           type: object
 *           properties:
 *             accountId:
 *               type: string
 *               format: objectid
 *               example: "60d5f1f89c89a0001a2b3c4d"
 *             balance:
 *               type: number
 *               example: 1234.56
 *             currency:
 *               type: string
 *               example: USD
 *             accountNumber:
 *               type: string
 *               example: "1000000001"
 *             accountType:
 *               type: string
 *               example: AHORROS
 *             status:
 *               type: string
 *               example: active
 *
 *   responses:
 *     UnauthorizedError:
 *       description: No autorizado o token inválido.
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 example: error
 *               message:
 *                 type: string
 *                 example: No autorizado o token inválido.
 *
 *     ForbiddenError:
 *       description: Acceso prohibido al recurso.
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 example: error
 *               message:
 *                 type: string
 *                 example: Acceso prohibido al recurso.
 *
 *     NotFoundError:
 *       description: Recurso no encontrado.
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 example: error
 *               message:
 *                 type: string
 *                 example: Recurso no encontrado.
 *
 *     BadRequestError:
 *       description: Solicitud incorrecta o parámetros inválidos.
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 example: error
 *               message:
 *                 type: string
 *                 example: Solicitud incorrecta o parámetros inválidos.
 *
 *     InternalServerError:
 *       description: Error interno del servidor.
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 example: error
 *               message:
 *                 type: string
 *                 example: Error interno del servidor.
 */
app.use(
  '/api/account/balance',
  createServiceProxy(
    'Balance',
    SERVICE_TARGETS.balance.node,
    SERVICE_TARGETS.balance.pathRewriteNode,
    SERVICE_TARGETS.balance.java,
    SERVICE_TARGETS.balance.pathRewriteJava,
    { type: 'BALANCE_READ' }
  )
);

/**
 * @swagger
 * /api/account/deposit:
 *     post:
 *       summary: Realizar un depósito en la cuenta del usuario (Node.js)
 *       tags:
 *         - "Node.js - Transactions"
 *       description: >
 *         Deposita un monto especificado en la cuenta asociada al usuario autenticado.
 *         El API Gateway maneja la autenticación, obtiene el ID de usuario del token,
 *         y lo pasa al servicio backend a través del header `X-User-ID`.
 *         El monto a depositar se envía en el cuerpo de la solicitud.
 *       security:
 *         - bearerAuth: []
 *       parameters:
 *         - in: header
 *           name: X-User-ID
 *           required: true
 *           description: >
 *             ID del usuario (MongoDB ObjectId). Este header es inyectado por el API Gateway
 *             después de una autenticación exitosa y es requerido por el servicio backend.
 *             Para pruebas directas en Swagger UI, este valor debe ser proporcionado.
 *           schema:
 *             type: string
 *             example: "60d5f1f89c89a0001a2b3c4d"
 *       requestBody:
 *         required: true
 *         description: Monto a depositar.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/NodeAmountRequest'
 *       responses:
 *         "200":
 *           description: Depósito realizado exitosamente.
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/NodeAccountTransactionResponse'
 *         "400":
 *           description: >
 *             Solicitud incorrecta. Puede ser por un monto inválido,
 *             o un `X-User-ID` con formato incorrecto.
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/responses/BadRequestError'
 *         "401":
 *           description: >
 *             No autorizado. Token JWT (Bearer) inválido/ausente (API Gateway),
 *             o header `X-User-ID` ausente/inválido.
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/responses/UnauthorizedError'
 *         "403":
 *           description: Prohibido (ej. la cuenta del usuario no está activa para depósitos).
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/responses/ForbiddenError'
 *         "404":
 *           description: No encontrado (ej. no se encontró una cuenta para el ID proporcionado).
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/responses/NotFoundError'
 *         "500":
 *           description: Error interno del servidor.
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/responses/InternalServerError'
 *
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *
 *   schemas:
 *     NodeAmountRequest:
 *       type: object
 *       required:
 *         - amount
 *       properties:
 *         amount:
 *           type: number
 *           format: double
 *           description: El monto para la transacción (depósito o retiro). Debe ser positivo.
 *           example: 50.75
 *
 *     NodeAccountTransactionResponse:
 *       type: object
 *       properties:
 *         status:
 *           type: string
 *           example: success
 *         message:
 *           type: string
 *           example: Depósito exitoso.
 *         data:
 *           type: object
 *           properties:
 *             accountId:
 *               type: string
 *               format: objectid
 *               example: "60d5f1f89c89a0001a2b3c4d"
 *             accountNumber:
 *               type: string
 *               example: "1000000001"
 *             newBalance:
 *               type: number
 *               example: 1350.25
 *             currency:
 *               type: string
 *               example: USD
 *             amountDeposited:
 *               type: number
 *               example: 50.75
 *
 *   responses:
 *     UnauthorizedError:
 *       description: No autorizado o token inválido.
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 example: error
 *               message:
 *                 type: string
 *                 example: No autorizado o token inválido.
 *
 *     ForbiddenError:
 *       description: Acceso prohibido al recurso.
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 example: error
 *               message:
 *                 type: string
 *                 example: Acceso prohibido al recurso.
 *
 *     NotFoundError:
 *       description: Recurso no encontrado.
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 example: error
 *               message:
 *                 type: string
 *                 example: Recurso no encontrado.
 *
 *     BadRequestError:
 *       description: Solicitud incorrecta o parámetros inválidos.
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 example: error
 *               message:
 *                 type: string
 *                 example: Solicitud incorrecta o parámetros inválidos.
 *
 *     InternalServerError:
 *       description: Error interno del servidor.
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 example: error
 *               message:
 *                 type: string
 *                 example: Error interno del servidor.
 */
app.use(
  '/api/account/deposit',
  createServiceProxy(
    'Deposit',
    SERVICE_TARGETS.deposit.node,
    SERVICE_TARGETS.deposit.pathRewriteNode,
    SERVICE_TARGETS.deposit.java,
    SERVICE_TARGETS.deposit.pathRewriteJava,
    { type: 'DEPOSIT' }
  )
);

/**
 * @swagger
 * /api/account/withdraw:
 *     post:
 *       summary: Realizar un retiro de la cuenta del usuario (Node.js)
 *       tags:
 *         - "Node.js - Transactions"
 *       description: >
 *         Retira un monto especificado de la cuenta asociada al usuario autenticado.
 *         El API Gateway maneja la autenticación, obtiene el ID de usuario del token,
 *         y lo pasa al servicio backend a través del header `X-User-ID`.
 *         El monto a retirar se envía en el cuerpo de la solicitud.
 *       security:
 *         - bearerAuth: []
 *       parameters:
 *         - in: header
 *           name: X-User-ID
 *           required: true
 *           description: >
 *             ID del usuario (MongoDB ObjectId). Este header es inyectado por el API Gateway
 *             después de una autenticación exitosa y es requerido por el servicio backend.
 *             Para pruebas directas en Swagger UI, este valor debe ser proporcionado.
 *           schema:
 *             type: string
 *             example: "60d5f1f89c89a0001a2b3c4d"
 *       requestBody:
 *         required: true
 *         description: Monto a retirar.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/NodeAmountRequest'
 *       responses:
 *         "200":
 *           description: Retiro realizado exitosamente.
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/NodeAccountWithdrawalResponse'
 *         "400":
 *           description: >
 *             Solicitud incorrecta. Puede ser por un monto inválido, fondos insuficientes,
 *             o un `X-User-ID` con formato incorrecto.
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/responses/BadRequestError'
 *         "401":
 *           description: >
 *             No autorizado. Token JWT (Bearer) inválido/ausente (API Gateway),
 *             o header `X-User-ID` ausente/inválido.
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/responses/UnauthorizedError'
 *         "403":
 *           description: >
 *             Prohibido. Puede ser porque la cuenta no está activa para retiros
 *             o porque el monto excede los límites permitidos.
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/responses/ForbiddenError'
 *         "404":
 *           description: No encontrado (ej. no se encontró una cuenta para el ID proporcionado).
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/responses/NotFoundError'
 *         "500":
 *           description: Error interno del servidor.
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/responses/InternalServerError'
 *
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *
 *   schemas:
 *     NodeAmountRequest:
 *       type: object
 *       required:
 *         - amount
 *       properties:
 *         amount:
 *           type: number
 *           format: double
 *           description: El monto para la transacción (depósito o retiro). Debe ser positivo y, para retiros, no mayor al saldo.
 *           example: 50.75
 *
 *     NodeAccountWithdrawalResponse:
 *       type: object
 *       properties:
 *         status:
 *           type: string
 *           example: success
 *         message:
 *           type: string
 *           example: Retiro exitoso.
 *         data:
 *           type: object
 *           properties:
 *             accountId:
 *               type: string
 *               format: objectid
 *               example: "60d5f1f89c89a0001a2b3c4d"
 *             accountNumber:
 *               type: string
 *               example: "1000000001"
 *             previousBalance:
 *               type: number
 *               example: 1200.00
 *             amountWithdrawn:
 *               type: number
 *               example: 50.75
 *             newBalance:
 *               type: number
 *               example: 1149.25
 *             currency:
 *               type: string
 *               example: USD
 *
 *   responses:
 *     UnauthorizedError:
 *       description: No autorizado o token inválido.
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 example: error
 *               message:
 *                 type: string
 *                 example: No autorizado o token inválido.
 *
 *     ForbiddenError:
 *       description: Acceso prohibido al recurso.
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 example: error
 *               message:
 *                 type: string
 *                 example: Acceso prohibido al recurso.
 *
 *     NotFoundError:
 *       description: Recurso no encontrado.
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 example: error
 *               message:
 *                 type: string
 *                 example: Recurso no encontrado.
 *
 *     BadRequestError:
 *       description: Solicitud incorrecta o parámetros inválidos.
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 example: error
 *               message:
 *                 type: string
 *                 example: Solicitud incorrecta o parámetros inválidos.
 *
 *     InternalServerError:
 *       description: Error interno del servidor.
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 example: error
 *               message:
 *                 type: string
 *                 example: Error interno del servidor.
 */
app.use(
  '/api/account/withdraw',
  createServiceProxy(
    'Withdraw',
    SERVICE_TARGETS.withdraw.node,
    SERVICE_TARGETS.withdraw.pathRewriteNode,
    SERVICE_TARGETS.withdraw.java,
    SERVICE_TARGETS.withdraw.pathRewriteJava,
    { type: 'WITHDRAWAL' }
  )
);

app.use((err, req, res, next) => {
  console.error('[API Gateway - Error Handler Global] Error:', err);
  if (
    err.name === 'UnauthorizedError' ||
    (err.status && (err.status === 401 || err.status === 403))
  ) {
    return res.status(err.status).json({
      status: 'error',
      message: err.message || 'No autorizado o token inválido.',
    });
  }
  if (!res.headersSent) {
    return res.status(err.status || 500).json({
      status: 'error',
      message: err.message || 'Error interno en el API Gateway.',
    });
  }
  next(err);
});

export default app;