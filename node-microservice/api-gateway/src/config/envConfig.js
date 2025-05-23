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
    balance: process.env.BALANCE_SERVICE_URL || 'http://localhost:3001',
    deposit: process.env.DEPOSIT_SERVICE_URL || 'http://localhost:3002',
    withdrawal: process.env.WITHDRAWAL_SERVICE_URL || 'http://localhost:3003',
    // userProfile: process.env.USER_PROFILE_SERVICE_URL, // Si tuvieras uno para /me/profile
  },
  urls: {
    clientUrl: process.env.CLIENT_URL || 'http://localhost:4200',
  },
  cors: {
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : (process.env.CLIENT_URL || 'http://localhost:4200'),
  },
};

const validateConfig = () => {
  const requiredEnvVars = [
    'MONGO_URI', 'PORT',
    'AUTH0_DOMAIN', 'AUTH0_AUDIENCE',
    'BALANCE_SERVICE_URL', 'DEPOSIT_SERVICE_URL', 'WITHDRAWAL_SERVICE_URL'
  ];
  const missingVars = requiredEnvVars.filter(key => !process.env[key]);

  if (missingVars.length > 0) {
    throw new Error(`Error de configuración del API Gateway: Faltan variables de entorno críticas: ${missingVars.join(', ')}. Verifica tu archivo .env.`);
  }
  if (!config.mongo.uri || !config.auth0.domain || !config.auth0.audience) {
    throw new Error('Configuración crítica (Mongo o Auth0) no cargada correctamente en el API Gateway.');
  }
};

try {
  validateConfig();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}

export default config;