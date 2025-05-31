import pg from 'pg';
import config from './envConfig.js';

const { Pool } = pg;
let pool;

const getPool = () => {
  if (!pool) {
    if (!config.postgres.user || !config.postgres.database) {
      console.error('FATAL ERROR: Faltan credenciales/configuración de PostgreSQL (user, database) en la configuración.');
      return null;
    }
    console.log('[PostgresConnector] Creando nuevo pool de conexiones PostgreSQL...');
    try {
      pool = new Pool({
        user: config.postgres.user,
        host: config.postgres.host,
        database: config.postgres.database,
        password: config.postgres.password,
        port: config.postgres.port,
        min: config.postgres.poolMin,
        max: config.postgres.poolMax,
        idleTimeoutMillis: config.postgres.poolIdleTimeoutMillis,
      });

      pool.on('connect', (client) => {
        console.log('[PostgresConnector] Cliente conectado al pool de PostgreSQL.');
      });

      pool.on('error', (err, client) => {
        console.error('[PostgresConnector] Error inesperado en cliente del pool de PostgreSQL:', err);
      });
      pool.query('SELECT NOW() AS now')
        .then(res => console.log('[PostgresConnector] Conexión a PostgreSQL exitosa. Hora del servidor DB:', res.rows[0].now))
        .catch(err => {
          console.error('[PostgresConnector] Error al probar la conexión inicial a PostgreSQL:', err.message);
        });
    } catch (error) {
      console.error('[PostgresConnector] Error al instanciar el Pool de PostgreSQL:', error);
      pool = null;
    }
  }
  return pool;
};

const query = async (text, params) => {
  const currentPool = getPool();
  if (!currentPool) {
    throw new Error('Pool de PostgreSQL no está inicializado o falló la inicialización.');
  }
  const start = Date.now();
  try {
    const res = await currentPool.query(text, params);
    const duration = Date.now() - start;
    console.log('[PostgresConnector] Query ejecutada:', { text, duration: `${duration}ms`, rowCount: res.rowCount });
    return res;
  } catch (error) {
    console.error('[PostgresConnector] Error ejecutando query:', { text, paramsInError: params, error: error.message });
    throw error;
  }
};

export default {
  query,
  getPool
};
