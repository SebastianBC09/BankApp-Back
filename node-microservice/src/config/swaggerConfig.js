import config from './envConfig.js';

const swaggerDefinition = {
    openapi: '3.0.3',
    info: {
        title: 'BankApp API',
        version: process.env.npm_package_version || '1.0.0',
        description:
            'API para la aplicación bancaria BankApp, permitiendo operaciones de consulta, depósito y retiro, con autenticación Auth0.',
        contact: {
            name: 'Soporte BankApp',
            email: 'soporte@bankapp.example.com',
        },
        license: {
            name: 'ISC',
        },
    },
    servers: [
        {
            url: config.urls.baseUrlApi,
            description: `Servidor ${config.nodeEnv}`,
        },
    ],
    components: {
        securitySchemes: {
            bearerAuth: {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
                description: "Ingresa el token JWT Bearer de Auth0 (sin el prefijo 'Bearer ').",
            },
        },
        schemas: {
            // Schemas para Errores Genéricos
            ErrorResponse: {
                type: 'object',
                properties: {
                    status: { type: 'string', example: 'error' },
                    message: { type: 'string', example: 'Mensaje detallado del error.' },
                    stack: { type: 'string', example: 'Stack trace del error (solo en desarrollo).' }
                },
            },
            NotFoundErrorResponse: {
                type: 'object',
                properties: {
                    status: { type: 'string', example: 'fail' },
                    message: { type: 'string', example: 'Recurso no encontrado.' },
                }
            },
            UnauthorizedError: {
                type: 'object',
                properties: {
                    message: { type: 'string', example: 'Unauthorized' },
                }
            },
            ForbiddenError: {
                type: 'object',
                properties: {
                    status: { type: 'string', example: 'fail' },
                    message: { type: 'string', example: 'Acceso prohibido al recurso.' },
                }
            },
            BadRequestError: {
                type: 'object',
                properties: {
                    status: { type: 'string', example: 'fail' },
                    message: { type: 'string', example: 'Petición incorrecta.' },
                    details: { type: 'object', description: 'Detalles de errores de validación, si aplica.'}
                }
            },

            // Schemas para User
            UserProfileInput: {
                type: 'object',
                required: ['firstName', 'lastName', 'identificationDocument', 'address', 'phone', 'dateOfBirth', 'nationality'],
                properties: {
                    firstName: { type: 'string', example: 'Juan' },
                    lastName: { type: 'string', example: 'Pérez' },
                    phone: {
                        type: 'object',
                        properties: {
                            countryCode: { type: 'string', example: '+57' },
                            number: { type: 'string', example: '3001234567' },
                        }
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
                    dateOfBirth: { type: 'string', format: 'date', example: '1990-01-15' },
                    nationality: { type: 'string', example: 'Colombiana' },
                    identificationDocument: {
                        type: 'object',
                        required: ['type', 'number'],
                        properties: {
                            type: { type: 'string', enum: ['CC', 'CE', 'PASSPORT', 'NIT', 'TI'], example: 'CC' },
                            number: { type: 'string', example: '1020304050' },
                        }
                    },
                    agreedToTermsVersion: { type: 'string', example: 'v1.2_2025-01-15', nullable: true },
                }
            },
            UserResponse: {
                type: 'object',
                properties: {
                    _id: { type: 'string', format: 'objectid' },
                    auth0Id: { type: 'string' },
                    firstName: { type: 'string' },
                    lastName: { type: 'string' },
                    fullName: { type: 'string', readOnly: true },
                    email: { type: 'string', format: 'email' },
                    emailVerified: { type: 'boolean' },
                    phone: { type: 'object', properties: { countryCode: {type: 'string'}, number: {type: 'string'}, isVerified: {type: 'boolean'} } },
                    address: { type: 'object', properties: { street: {type: 'string'}, city: {type: 'string'} /* ...otros campos de dirección... */ } },
                    dateOfBirth: { type: 'string', format: 'date' },
                    nationality: { type: 'string' },
                    identificationDocument: { type: 'object', properties: { type: {type: 'string'}, number: {type: 'string'} } },
                    status: { type: 'string' },
                    roles: { type: 'array', items: { type: 'string' } },
                    createdAt: { type: 'string', format: 'date-time' },
                    updatedAt: { type: 'string', format: 'date-time' },
                }
            },
            UserProvisionResponse: {
                type: 'object',
                properties: {
                    message: { type: 'string' },
                    auth0UserSub: { type: 'string' },
                    databaseUser: { $ref: '#/components/schemas/UserResponse' }
                }
            },
            ProfileCompletionResponse: {
                type: 'object',
                properties: {
                    status: { type: 'string', example: 'success'},
                    message: { type: 'string', example: 'Perfil completado y cuenta inicial creada exitosamente.'},
                    data: {
                        type: 'object',
                        properties: {
                            user: { $ref: '#/components/schemas/UserResponse' },
                            account: { $ref: '#/components/schemas/AccountResponse' }
                        }
                    }
                }
            },

            // Schemas para Account
            AmountRequest: {
                type: 'object',
                required: ['amount'],
                properties: {
                    amount: { type: 'number', format: 'float', example: 100.50, description: 'Monto para la transacción (debe ser positivo).' }
                }
            },
            AccountResponse: {
                type: 'object',
                properties: {
                    _id: { type: 'string', format: 'objectid' },
                    userId: { type: 'string', format: 'objectid' },
                    accountNumber: { type: 'string' },
                    accountType: { type: 'string', enum: ['savings', 'checking', 'credit_line', 'loan'] },
                    balance: { type: 'string', description: 'Saldo actual de la cuenta' },
                    currency: { type: 'string', enum: ['COP', 'USD', 'EUR'] },
                    status: { type: 'string', enum: ['pending_activation', 'active', 'inactive', 'blocked', 'dormant', 'closed'] },
                    createdAt: { type: 'string', format: 'date-time' },
                    updatedAt: { type: 'string', format: 'date-time' },
                }
            },
            AccountBalanceData: {
                type: 'object',
                properties: {
                    accountId: { type: 'string', format: 'objectid' },
                    balance: { type: 'string' },
                    currency: { type: 'string' },
                    accountNumber: { type: 'string' },
                    accountType: { type: 'string' },
                }
            },
            AccountBalanceResponse: {
                type: 'object',
                properties: {
                    status: { type: 'string', example: 'success' },
                    data: { $ref: '#/components/schemas/AccountBalanceData'}
                }
            },
            AccountTransactionResponseData: {
                type: 'object',
                properties: {
                    message: { type: 'string' },
                    accountId: { type: 'string', format: 'objectid' },
                    newBalance: { type: 'string' },
                    currency: { type: 'string' },
                    amountProcessed: { type: 'string', description: 'Monto procesado en la transacción (ej. amountWithdrawn o amountDeposited)' },
                }
            },
            AccountTransactionResponse: {
                type: 'object',
                properties: {
                    status: { type: 'string', example: 'success' },
                    data: { $ref: '#/components/schemas/AccountTransactionResponseData'}
                }
            }
        }
    },
    // Definición global de seguridad, se aplica a todos los endpoints a menos que se anule.
    security: [
        {
            bearerAuth: [] // Requiere 'bearerAuth' (JWT), sin scopes específicos a nivel global
        }
    ]
};

const options = {
    swaggerDefinition,
    apis: ['./src/routes/*.js'], // Rutas donde buscar anotaciones JSDoc
};

export default options;