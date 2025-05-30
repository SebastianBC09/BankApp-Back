import dotenv from 'dotenv';
dotenv.config({ path: './.env' });
import config from './src/config/envConfig.js';
import app from './src/app.js';
import DatabaseConnector from './src/config/db.js';

const dbConnector = new DatabaseConnector();

const start = async () => {
  try {
    await dbConnector.connect();
    app.listen(config.port, () => {});
  } catch (error) {
    console.error('FALLÓ EL INICIO DEL BALANCE SERVICE:', error);
    process.exit(1);
  }
};

start().catch((error) => {
  console.error('Error no manejado durante el inicio del Balance Service:', error);
  process.exit(1);
});