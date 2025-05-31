import dotenv from 'dotenv';
dotenv.config();

const config = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongo: {
    uri: process.env.MONGO_URI,
  },
  postgres: {
    host: process.env.PG_HOST || 'localhost',
    port: parseInt(process.env.PG_PORT, 10) || 5432,
    user: process.env.PG_USER,
    password: process.env.PG_PASSWORD,
    database: process.env.PG_DATABASE,
    schema: process.env.PG_SCHEMA || 'bankapp',
    ssl: process.env.PG_SSL === 'true' ? { rejectUnauthorized: false } : false,
    poolMin: parseInt(process.env.PG_POOL_MIN, 10) || 0,
    poolMax: parseInt(process.env.PG_POOL_MAX, 10) || 10,
    poolIdleTimeoutMillis: parseInt(process.env.PG_POOL_IDLE_TIMEOUT_MS, 10) || 30000,
  },
  auth0: {
    domain: process.env.AUTH0_DOMAIN,
    audience: process.env.AUTH0_AUDIENCE,
  },
  services: {
    node: {
      balance: process.env.NODE_BALANCE_SERVICE_URL,
      deposit: process.env.NODE_DEPOSIT_SERVICE_URL,
      withdrawal: process.env.NODE_WITHDRAWAL_SERVICE_URL,
    },
    balance_java: process.env.JAVA_BALANCE_SERVICE_URL,
    deposit_java: process.env.JAVA_DEPOSIT_SERVICE_URL,
    withdrawal_java: process.env.JAVA_WITHDRAWAL_SERVICE_URL,
  },
  goSyncServiceUrl: process.env.GO_SYNC_SERVICE_URL || 'http://localhost:8090',
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
  },

};

if (!config.auth0.domain || !config.auth0.audience) {
  console.error('FATAL ERROR: AUTH0_DOMAIN o AUTH0_AUDIENCE no están configurados. La autenticación fallará.');
  process.exit(1);
}

const requiredPostgresVars = ['PG_USER', 'PG_DATABASE'];
if (config.postgres.user === undefined || config.postgres.database === undefined) {
  console.error('FATAL ERROR: Variables de entorno PostgreSQL requeridas (PG_USER, PG_DATABASE) no están configuradas. UserProvisioningMiddleware no funcionará correctamente.');
  process.exit(1);
}

const requiredJavaServiceUrls = [
  'JAVA_BALANCE_SERVICE_URL',
  'JAVA_DEPOSIT_SERVICE_URL',
  'JAVA_WITHDRAWAL_SERVICE_URL',
];

for (const serviceEnvVar of requiredJavaServiceUrls) {
  if (!process.env[serviceEnvVar]) {
    console.error(`FATAL ERROR: Variable de entorno para URL de servicio Java faltante: ${serviceEnvVar}`);
    process.exit(1);
  }
}

// Opcional: Validar URLs de servicios Node.js si todavía son parte del flujo principal
// const requiredNodeServiceUrls = [
//   'NODE_BALANCE_SERVICE_URL',
//   'NODE_DEPOSIT_SERVICE_URL',
//   'NODE_WITHDRAWAL_SERVICE_URL',
// ];
// for (const serviceEnvVar of requiredNodeServiceUrls) {
//   if (!process.env[serviceEnvVar]) {
//     console.warn(`ADVERTENCIA: Variable de entorno para URL de servicio Node.js faltante: ${serviceEnvVar}`);
//   }
// }


export default config;