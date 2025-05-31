import mongoose from 'mongoose';
import config from './envConfig.js';

class MongoConnector {
  constructor() {
    this.mongoURI = config.mongo.uri;
    if (!this.mongoURI) {
      console.warn(
        '[MongoConnector] ADVERTENCIA: MONGO_URI no está configurado. La conexión a MongoDB no se establecerá.'
      );
    }
  }

  async connect() {
    if (!this.mongoURI) {
      console.log('[MongoConnector] No se intentará conectar a MongoDB (MONGO_URI no configurado).');
      return false;
    }

    try {
      const mongooseOptions = {
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 10000,
        socketTimeoutMS: 45000,
        appName: 'APIGateway-UserProvisioning-Mongo',
      };
      console.log('[MongoConnector] Intentando conectar a MongoDB para API Gateway...');
      const conn = await mongoose.connect(this.mongoURI, mongooseOptions);
      console.log(
        `[MongoConnector] MongoDB (API Gateway) Conectado: ${conn.connection.host} a la base de datos "${conn.connection.name}"`
      );

      mongoose.connection.on('disconnected', () =>
        console.warn('[MongoConnector] MongoDB (API Gateway) Desconectado!')
      );
      mongoose.connection.on('reconnected', () =>
        console.info('[MongoConnector] MongoDB (API Gateway) Reconectado!')
      );
      mongoose.connection.on('error', (dbErr) =>
        console.error(`[MongoConnector] Error en conexión MongoDB (API Gateway) post-inicial: ${dbErr.message}`)
      );
      return true;
    } catch (error) {
      console.error(`[MongoConnector] Error de conexión inicial a MongoDB (API Gateway): ${error.message}`);
      return false;
    }
  }

  async disconnect() {
    if (mongoose.connection.readyState === 1 || mongoose.connection.readyState === 2) {
      try {
        await mongoose.disconnect();
        console.log('[MongoConnector] MongoDB (API Gateway) Desconectado.');
      } catch (error) {
        console.error(`[MongoConnector] Error al desconectar MongoDB (API Gateway): ${error.message}`);
      }
    } else {
      console.log('[MongoConnector] MongoDB (API Gateway) no estaba conectado, no se necesita desconectar.');
    }
  }
}

export default new MongoConnector();
