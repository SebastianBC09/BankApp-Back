import dotenv from 'dotenv';
dotenv.config();

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
      withdrawal: process.env.NODE_WITHDRAWAL_SERVICE_URL
    },
    balance: process.env.JAVA_BALANCE_SERVICE_URL,
    deposit: process.env.JAVA_DEPOSIT_SERVICE_URL,
    withdrawal: process.env.JAVA_WITHDRAWAL_SERVICE_URL
  },
  cors: {
    origin: process.env.CORS_ORIGIN || '*'
  },
};

// Validate required configuration
const requiredServices = [
  'NODE_BALANCE_SERVICE_URL',
  'NODE_DEPOSIT_SERVICE_URL',
  'NODE_WITHDRAWAL_SERVICE_URL',
  'JAVA_BALANCE_SERVICE_URL',
  'JAVA_DEPOSIT_SERVICE_URL',
  'JAVA_WITHDRAWAL_SERVICE_URL'
];

for (const service of requiredServices) {
  if (!process.env[service]) {
    throw new Error(`Missing required environment variable: ${service}`);
  }
}

export default config;