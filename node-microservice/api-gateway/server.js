import dotenv from 'dotenv';
dotenv.config({ path: './.env' });
import config from './src/config/envConfig.js';
import app from './src/app.js';
import mongoConnector from './src/config/mongoConnector.js';
import pgConnector from './src/config/postgresConnector.js';

let serverInstance;

process.on('uncaughtException', (err) => {
  console.error('💥 API GATEWAY: EXCEPCIÓN NO CAPTURADA! Cerrando la aplicación...');
  console.error('Error:', err.name, err.message);
  console.error('Stack:', err.stack);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 API GATEWAY: RECHAZO DE PROMESA NO MANEJADO!');
  console.error('Razón:', reason);
  if (reason instanceof Error) {
    console.error('Error:', reason.name, reason.message);
    console.error('Stack:', reason.stack);
  }

  if (serverInstance) {
    console.log('[API Gateway Server] Intentando cierre elegante del servidor...');
    serverInstance.close(() => {
      console.log('[API Gateway Server] Servidor HTTP cerrado.');
      process.exit(1);
    });
    setTimeout(() => {
      console.error('[API Gateway Server] Cierre elegante falló por timeout. Forzando salida.');
      process.exit(1);
    }, 10000).unref();
  } else {
    process.exit(1);
  }
});

const initializeDatabaseConnections = async () => {
  let pgConnected = false;
  let mongoConnected = false;
  if (config.postgres.user && config.postgres.database) {
    try {
      const pool = pgConnector.getPool();
      if (pool) {
        await pool.query('SELECT 1');
        console.log('[API Gateway Server] Conexión a PostgreSQL verificada y lista.');
        pgConnected = true;
      } else {
        console.warn('[API Gateway Server] Pool de PostgreSQL no se inicializó. User provisioning podría depender de MongoDB.');
      }
    } catch (pgError) {
      console.error('[API Gateway Server] Error al conectar/verificar PostgreSQL durante el inicio:', pgError.message);
    }
  } else {
    console.warn('[API Gateway Server] Configuración de PostgreSQL incompleta (PG_USER o PG_DATABASE faltantes). No se conectará.');
  }

  if (config.mongo.uri) {
    try {
      mongoConnected = await mongoConnector.connect();
      if (!mongoConnected) {
        console.warn('[API Gateway Server] Conexión a MongoDB falló pero se continuará (si PG está disponible).');
      }
    } catch (mongoError) {
      console.error('[API Gateway Server] Error al conectar a MongoDB durante el inicio:', mongoError.message);
    }
  } else {
    console.log('[API Gateway Server] MONGO_URI no configurado. No se conectará a MongoDB.');
  }

  if (!pgConnected && !mongoConnected) {
    console.error('FATAL ERROR: No se pudo conectar a NINGUNA base de datos (PostgreSQL o MongoDB). User provisioning fallará.');
  } else if (!pgConnected) {
    console.warn("ADVERTENCIA: No se pudo conectar a PostgreSQL. El User Provisioning podría no funcionar como se espera para los servicios Java que requieren IDs de PostgreSQL.");
  }
};

const startApiGateway = async () => {
  try {
    console.log(`[API Gateway Server] Intentando iniciar API Gateway en modo: ${config.nodeEnv}`);
    console.log(`[API Gateway Server] Puerto para API Gateway: ${config.port}`);
    await initializeDatabaseConnections();
    serverInstance = app.listen(config.port, () => {
      console.log(`[API Gateway Server] API Gateway HTTP corriendo en el puerto ${config.port}.`);
      console.log(`[API Gateway Server] Listo para aceptar conexiones.`);
    });

  } catch (error) {
    console.error('[API Gateway Server] FALLÓ EL INICIO DEL API GATEWAY:', error);
    if (error.stack) console.error(error.stack);
    process.exit(1);
  }
};

startApiGateway().catch((error) => {
  console.error('Error no manejado durante el inicio del API Gateway:', error);
  process.exit(1);
});