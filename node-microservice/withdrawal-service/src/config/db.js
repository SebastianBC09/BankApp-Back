import mongoose from 'mongoose';
import config from './envConfig.js';

class DatabaseConnector {
  constructor() {
    this.mongoURI = config.mongo.uri;
    if (!this.mongoURI) {
      console.error(
        'FATAL ERROR: MONGO_URI no está disponible para DatabaseConnector en Withdrawal Service.'
      );
      process.exit(1);
    }
  }

  async connect() {
    try {
      const mongooseOptions = {
        serverSelectionTimeoutMS: 5000,
        appName: 'WithdrawalService',
      };
      const conn = await mongoose.connect(this.mongoURI, mongooseOptions);
      console.log(
        `MongoDB (WithdrawalService) Conectado: ${conn.connection.host} a la base de datos "${conn.connection.name}"`
      );

      mongoose.connection.on('disconnected', () =>
        console.warn('MongoDB (WithdrawalService) Desconectado!')
      );
      mongoose.connection.on('reconnected', () =>
        console.info('MongoDB (WithdrawalService) Reconectado!')
      );
      mongoose.connection.on('error', (dbErr) =>
        console.error(
          `Error en conexión MongoDB (WithdrawalService) post-inicial: ${dbErr.message}`
        )
      );
    } catch (error) {
      console.error(`Error de conexión inicial a MongoDB (WithdrawalService): ${error.message}`);
      console.error(
        'Verifique su MONGO_URI, la configuración de red de Atlas (IP Whitelist) y el estado del clúster.'
      );
      console.error('La aplicación (WithdrawalService) se cerrará.');
      process.exit(1);
    }
  }

  async disconnect() {
    try {
      await mongoose.disconnect();
      console.log('MongoDB (WithdrawalService) Desconectado.');
    } catch (error) {
      console.error(`Error al desconectar MongoDB (WithdrawalService): ${error.message}`);
    }
  }
}

export default DatabaseConnector;
