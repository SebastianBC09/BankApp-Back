import dotenv from 'dotenv';

dotenv.config({ path: './.env' });

const config = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongo: {
    uri: process.env.MONGO_URI,
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
    java: {
      balance: process.env.JAVA_BALANCE_SERVICE_URL,
      deposit: process.env.JAVA_DEPOSIT_SERVICE_URL,
      withdrawal: process.env.JAVA_WITHDRAWAL_SERVICE_URL,
    },
  },
  urls: {
    clientUrl: process.env.CLIENT_URL || 'http://localhost:4200',
  },
  cors: {
    origin: process.env.CORS_ORIGIN
      ? process.env.CORS_ORIGIN.split(',')
      : process.env.CLIENT_URL || 'http://localhost:4200',
  },
};

const validateConfig = () => {
  const requiredEnvVars = [
    'MONGO_URI',
    'PORT',
    'AUTH0_DOMAIN',
    'AUTH0_AUDIENCE',
    'NODE_BALANCE_SERVICE_URL',
    'NODE_DEPOSIT_SERVICE_URL',
    'NODE_WITHDRAWAL_SERVICE_URL',
    'JAVA_BALANCE_SERVICE_URL',
    'JAVA_DEPOSIT_SERVICE_URL',
    'JAVA_WITHDRAWAL_SERVICE_URL',
  ];
  const missingVars = requiredEnvVars.filter((key) => !process.env[key]);

  if (missingVars.length > 0) {
    throw new Error(
      `Error de configuración del API Gateway: Faltan variables de entorno críticas: ${missingVars.join(', ')}.`
    );
  }
  if (
    !config.mongo.uri ||
    !config.auth0.domain ||
    !config.auth0.audience ||
    !config.services.node.balance ||
    !config.services.java.balance
  ) {
    throw new Error(
      'Configuración crítica (Mongo, Auth0, o URLs de servicios) no cargada correctamente en API Gateway.'
    );
  }
};

try {
  validateConfig();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}

export default config;
