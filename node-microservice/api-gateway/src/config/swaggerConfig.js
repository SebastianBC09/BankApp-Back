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
    license: {
      name: 'ISC',
    },
  },
  servers: [
    {
      url: `http://localhost:${config.port}`,
      description: `API Gateway (${config.nodeEnv || 'development'})`,
    },
    {
      url: config.services.node.balance,
      description: 'Node.js - Balance Service Direct',
    },
    {
      url: config.services.node.deposit,
      description: 'Node.js - Deposit Service Direct',
    },
    {
      url: config.services.node.withdrawal,
      description: 'Node.js - Withdrawal Service Direct',
    },
    {
      url: config.services.balance,
      description: 'Java - Balance Service Direct',
    },
    {
      url: config.services.deposit,
      description: 'Java - Deposit Service Direct',
    },
    {
      url: config.services.withdrawal,
      description: 'Java - Withdrawal Service Direct',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: "Ingresa el token JWT Bearer de Auth0.",
      },
    },
    schemas: {
      ErrorBasePayload: {
        type: 'object',
        properties: {
          status: { type: 'string' },
          message: { type: 'string' },
        },
        required: ['status', 'message']
      },
      ErrorResponseDebug: {
        type: 'object',
        properties: {
          status: { type: 'string', example: 'error' },
          message: { type: 'string', example: 'Mensaje detallado del error.' },
          stack: { type: 'string', example: 'Stack trace del error (solo en desarrollo).', nullable: true }
        },
      },
      NotFoundErrorPayload: {
        type: 'object',
        properties: {
          status: { type: 'string', example: 'fail' },
          message: { type: 'string', example: 'Recurso no encontrado.' },
        },
      },
      UnauthorizedPayload: {
        type: 'object',
        properties: {
          status: { type: 'string', example: 'error' },
          message: { type: 'string', example: 'No autorizado. Token ausente o inválido.' },
        },
      },
      ForbiddenPayload: {
        type: 'object',
        properties: {
          status: { type: 'string', example: 'fail' },
          message: { type: 'string', example: 'Acceso prohibido al recurso.' },
        },
      },
      BadRequestPayload: {
        type: 'object',
        properties: {
          status: { type: 'string', example: 'fail' },
          message: { type: 'string', example: 'Petición incorrecta o datos inválidos.' },
          details: { type: 'object', description: 'Detalles de errores de validación, si aplica.', nullable: true}
        }
      },
      NodeUserProfileInput: {
        type: 'object',
        required: [
          'firstName', 'lastName', 'identificationDocument',
          'address', 'phone', 'dateOfBirth', 'nationality'
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
          address: {
            type: 'object',
            properties: {
              street: { type: 'string', example: 'Calle Falsa 123' },
              city: { type: 'string', example: 'Bogotá' },
              stateOrDepartment: { type: 'string', example: 'Cundinamarca' },
              country: { type: 'string', example: 'CO' },
              postalCode: { type: 'string', example: '110111', nullable: true },
            }
          },
          dateOfBirth: { type: 'string', format: 'date', example: '1992-03-20' },
          nationality: { type: 'string', example: 'Colombiana' },
          identificationDocument: {
            type: 'object',
            required: ['type', 'number'],
            properties: {
              type: { type: 'string', enum: ['CC', 'CE', 'PASSPORT', 'NIT', 'TI'], example: 'CC' },
              number: { type: 'string', example: '1020304050' },
            }
          },
          agreedToTermsVersion: { type: 'string', nullable: true, example: 'v1.3-2025' },
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
          emailVerified: { type: 'boolean' },
          phone: { type: 'object', properties: { countryCode: {type: 'string'}, number: {type: 'string'}, isVerified: {type: 'boolean'} } },
          address: { type: 'object', properties: { street: {type: 'string'}, city: {type: 'string'}, stateOrDepartment: {type: 'string'}, country: {type: 'string'}, postalCode: {type: 'string', nullable: true} } },
          dateOfBirth: { type: 'string', format: 'date', nullable: true },
          nationality: { type: 'string', nullable: true },
          identificationDocument: { type: 'object', properties: { type: {type: 'string'}, number: {type: 'string'} }, nullable: true },
          status: { type: 'string' },
          roles: { type: 'array', items: { type: 'string' } },
          agreedToTermsVersion: { type: 'string', nullable: true },
          preferences: { type: 'object', properties: { notifications: {type: 'object', properties: { email: {type: 'boolean'}, sms: {type: 'boolean'}, push: {type: 'boolean'}}}, language: {type: 'string'} } },
          lastLoginAt: { type: 'string', format: 'date-time', nullable: true},
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        }
      },
      NodeUserProvisionResponse: {
        type: 'object',
        properties: {
          message: { type: 'string' },
          auth0UserSub: { type: 'string' },
          databaseUser: { $ref: '#/components/schemas/NodeUserResponse' }
        }
      },
      NodeProfileCompletionResponseData: {
        type: 'object',
        properties: {
          user: { $ref: '#/components/schemas/NodeUserResponse' },
          account: { $ref: '#/components/schemas/NodeAccountResponse' }
        }
      },
      NodeProfileCompletionResponse: {
        type: 'object',
        properties: {
          status: { type: 'string', example: 'success'},
          message: { type: 'string' },
          data: { $ref: '#/components/schemas/NodeProfileCompletionResponseData' }
        }
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
          accountType: { type: 'string', enum: ['savings', 'checking', 'credit_line', 'loan'] },
          balance: { type: 'string', description: 'Saldo como string (Decimal128 de Mongoose)' },
          currency: { type: 'string', enum: ['COP', 'USD', 'EUR'] },
          status: { type: 'string', enum: ['pending_activation', 'active', 'inactive', 'blocked', 'dormant', 'closed']},
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        }
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
        }
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
        }
      },
      NodeAccountTransactionResponse: {
        type: 'object',
        properties: {
          status: { type: 'string', example: 'success' },
          data: { $ref: '#/components/schemas/NodeAccountTransactionResponseData' },
        },
      },
    },
    responses: {
      UnauthorizedError: {
        description: 'No autorizado. Token JWT ausente, inválido o expirado.',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/UnauthorizedPayload' }
          }
        }
      },
      ForbiddenError: {
        description: 'Prohibido. El usuario no tiene permisos o la operación no está permitida.',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ForbiddenPayload' }
          }
        }
      },
      NotFoundError: {
        description: 'Recurso no encontrado.',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/NotFoundErrorPayload' }
          }
        }
      },
      BadRequestError: {
        description: 'Petición incorrecta o datos de entrada inválidos.',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/BadRequestPayload' }
          }
        }
      },
      InternalServerError: {
        description: 'Error interno del servidor.',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponseDebug' }
          }
        }
      }
    }
  },
  security: [{ bearerAuth: [] }]
};

const options = {
  swaggerDefinition,
  apis: ['./src/app.js', './src/routes/*.js'],
};

export default options;