import dotenv from 'dotenv';
dotenv.config({ path: './.env' });

import config from './src/config/envConfig.js';
import app from './src/app.js';
import DatabaseConnector from './src/config/db.js';

let serverInstance;

process.on('uncaughtException', (err) => { /* ... */ });
process.on('unhandledRejection', (err) => { /* ... */});


const start = async () => {
  try {
    console.log(`Intentando iniciar API Gateway en modo: ${config.nodeEnv}`);
    console.log(`Puerto para API Gateway: ${config.port}`);

    if (config.mongo.uri) {
      const dbConnector = new DatabaseConnector();
      await dbConnector.connect();
    } else {
      console.warn('MONGO_URI no configurada para API Gateway. User provisioning local no funcionará.');
    }

    serverInstance = app.listen(config.port, () => {
      console.log(`API Gateway HTTP corriendo en el puerto ${config.port}.`);
    });
  } catch (error) {
    console.error('FALLÓ EL INICIO DEL API GATEWAY:', error);
    process.exit(1);
  }
};

start().catch((error) => {
  console.error('Error no manejado durante el inicio del API Gateway:', error);
  process.exit(1);
});