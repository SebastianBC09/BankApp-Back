import config from './envConfig.js';

const swaggerDefinition = {
  openapi: '3.0.3',
  info: {
    title: 'BankApp API - Node.js Microservices (via API Gateway)',
    version: process.env.npm_package_version || '1.0.0',
    description:
      'Documentación para los microservicios Node.js de BankApp, accesibles a través del API Gateway. Incluye operaciones de cuentas y perfiles de usuario.',
    contact: {
      name: 'Soporte BankApp Node',
      email: 'soporte-node@bankapp.example.com',
    },
  },
  servers: [
    {
      url: `http://localhost:${config.port}`,
      description: `API Gateway (${config.nodeEnv})`,
    },
    {
      url: config.services.node.balance,
      description: 'Node.js - Balance Service Direct (Development/Test)',
    },
    {
      url: config.services.node.deposit,
      description: 'Node.js - Deposit Service Direct (Development/Test)',
    },
    {
      url: config.services.node.withdrawal,
      description: 'Node.js - Withdrawal Service Direct (Development/Test)',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Ingresa el token JWT Bearer de Auth0.',
      },
    },
    schemas: {
      ErrorResponse: {
        type: 'object',
        properties: {
          status: { type: 'string', example: 'error' },
          message: { type: 'string' },
          stack: { type: 'string', description: '(Solo en desarrollo)' },
        },
      },
      NotFoundErrorResponse: {},
      UnauthorizedError: {},
      ForbiddenError: {},
      BadRequestError: {},
      NodeUserProfileInput: {
        type: 'object',
        required: [
          'firstName',
          'lastName',
          'identificationDocument',
          'address',
          'phone',
          'dateOfBirth',
          'nationality',
        ],
        properties: {
          firstName: { type: 'string', example: 'Ana' },
          lastName: { type: 'string', example: 'Gomez' },
          phone: {
            type: 'object',
            properties: {
              countryCode: { type: 'string', example: '+57' },
              number: { type: 'string', example: '3109876543' },
            },
          },
          address: {},
          dateOfBirth: { type: 'string', format: 'date', example: '1992-03-20' },
          nationality: { type: 'string', example: 'Colombiana' },
          identificationDocument: {},
          agreedToTermsVersion: { type: 'string', nullable: true },
        },
      },
      NodeUserResponse: {
        type: 'object',
        properties: {
          _id: { type: 'string', format: 'objectid', description: 'MongoDB Object ID' },
          auth0Id: { type: 'string' },
          firstName: { type: 'string' },
          lastName: { type: 'string' },
          fullName: { type: 'string', readOnly: true },
          email: { type: 'string', format: 'email' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      NodeUserProvisionResponse: {
        type: 'object',
        properties: {
          message: { type: 'string' },
          auth0UserSub: { type: 'string' },
          databaseUser: { $ref: '#/components/schemas/NodeUserResponse' },
        },
      },
      NodeProfileCompletionResponse: {
        type: 'object',
        properties: {
          status: { type: 'string', example: 'success' },
          message: { type: 'string' },
          data: {
            type: 'object',
            properties: {
              user: { $ref: '#/components/schemas/NodeUserResponse' },
              account: { $ref: '#/components/schemas/NodeAccountResponse' }, // Definir NodeAccountResponse
            },
          },
        },
      },

      NodeAmountRequest: {
        type: 'object',
        required: ['amount'],
        properties: {
          amount: {
            type: 'number',
            format: 'double',
            example: 100.0,
            description: 'Monto para la transacción (debe ser positivo).',
          },
        },
      },
      NodeAccountResponse: {
        type: 'object',
        properties: {
          _id: { type: 'string', format: 'objectid' },
          userId: { type: 'string', format: 'objectid' },
          accountNumber: { type: 'string' },
          accountType: { type: 'string', enum: ['savings', 'checking'] },
          balance: { type: 'string', description: 'Saldo como string (Decimal128 de Mongoose)' },
          currency: { type: 'string', enum: ['COP', 'USD'] },
          status: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      NodeAccountBalanceData: {
        type: 'object',
        properties: {
          accountId: { type: 'string', format: 'objectid' },
          balance: { type: 'string' },
          currency: { type: 'string' },
          accountNumber: { type: 'string' },
          accountType: { type: 'string' },
          status: { type: 'string' },
        },
      },
      NodeAccountBalanceResponse: {
        type: 'object',
        properties: {
          status: { type: 'string', example: 'success' },
          data: { $ref: '#/components/schemas/NodeAccountBalanceData' },
        },
      },
      NodeAccountTransactionResponseData: {
        type: 'object',
        properties: {
          message: { type: 'string' },
          accountId: { type: 'string', format: 'objectid' },
          newBalance: { type: 'string' },
          currency: { type: 'string' },
          amountProcessed: { type: 'string' },
        },
      },
      NodeAccountTransactionResponse: {
        type: 'object',
        properties: {
          status: { type: 'string', example: 'success' },
          data: { $ref: '#/components/schemas/NodeAccountTransactionResponseData' },
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
};

const options = {
  swaggerDefinition,
  apis: ['./src/app.js', './src/routes/*.js'],
};

export default options;
