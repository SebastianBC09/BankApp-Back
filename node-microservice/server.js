import config from './src/config/envConfig.js';
import app from './src/app.js';
import DatabaseConnector from './src/config/db.js';

let serverInstance;

process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.error(err.name, err.message, err.stack);
  if (serverInstance) {
    serverInstance.close(() => {
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
});

process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION! 💥 Shutting down gracefully...');
  console.error(err.name, err.message, err.stack);
  if (serverInstance) {
    serverInstance.close(() => {
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
});

const start = async () => {
  console.log(`Intentando iniciar servidor en modo: ${config.nodeEnv}`);
  console.log(`Puerto configurado: ${config.port}`);

  const dbConnector = new DatabaseConnector();
  await dbConnector.connect();

  serverInstance = app.listen(config.port, () => {
    console.log(`Servidor HTTP corriendo en el puerto ${config.port}.`);
    console.log(`Accede en ${config.urls.baseUrlApi}`);
    console.log(
      `Hora actual en Bogotá: ${new Date().toLocaleTimeString('es-CO', { timeZone: 'America/Bogota' })}`
    );
  });
};

start().catch((error) => {
  console.error('FALLÓ EL INICIO DEL SERVIDOR (error en la Promesa de start):', error);
  process.exit(1);
});
