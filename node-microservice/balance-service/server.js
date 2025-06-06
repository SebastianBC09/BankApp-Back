import dotenv from 'dotenv';
dotenv.config({ path: './.env' });
import config from './src/config/envConfig.js';
import app from './src/app.js';
import DatabaseConnector from './src/config/db.js';

const dbConnector = new DatabaseConnector();

const start = async () => {
  try {
    console.log(`Intentando iniciar Balance Service en modo: ${config.nodeEnv}`);
    console.log(`Puerto para Balance Service: ${config.port}`);
    await dbConnector.connect();
    app.listen(config.port, () => {
      console.log(`Balance Service HTTP corriendo en el puerto ${config.port}.`);
    });
  } catch (error) {
    console.error('FALLÓ EL INICIO DEL BALANCE SERVICE:', error);
    process.exit(1);
  }
};

start().catch((error) => {
  console.error('Error no manejado durante el inicio del Balance Service:', error);
  process.exit(1);
});