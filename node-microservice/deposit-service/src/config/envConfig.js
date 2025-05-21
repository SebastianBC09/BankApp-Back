import dotenv from 'dotenv';

dotenv.config({ path: './.env' });

const config = {
  port: process.env.PORT || 3002,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongo: {
    uri: process.env.MONGO_URI,
  },
  urls: {
    baseUrlApi: `http://localhost:${process.env.PORT || 3002}`,
  },
};

const validateConfig = () => {
  const requiredEnvVars = ['MONGO_URI', 'PORT'];
  const missingVars = requiredEnvVars.filter(key => !process.env[key]);

  if (missingVars.length > 0) {
    throw new Error(`Error de configuración: Faltan variables de entorno críticas para Deposit Service: ${missingVars.join(', ')}. Verifica tu archivo .env.`);
  }
  if (!config.mongo.uri) {
    throw new Error('Configuración MONGO_URI no cargada correctamente en el objeto config para Deposit Service.');
  }
};

try {
  validateConfig();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}

export default config;