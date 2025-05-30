import mongoose from 'mongoose';
import config from './envConfig.js';

class DatabaseConnector {
  constructor() {
    this.mongoURI = config.mongo.uri;
    if (!this.mongoURI) {
      console.error(
        'FATAL ERROR: MONGO_URI no está disponible para DatabaseConnector en Deposit Service.'
      );
      process.exit(1);
    }
  }

  async connect() {
    try {
      const mongooseOptions = {
        serverSelectionTimeoutMS: 5000,
        appName: 'DepositService',
      };
      const conn = await mongoose.connect(this.mongoURI, mongooseOptions);
      console.log(
        `MongoDB (DepositService) Conectado: ${conn.connection.host} a la base de datos "${conn.connection.name}"`
      );

      mongoose.connection.on('disconnected', () =>
        console.warn('MongoDB (DepositService) Desconectado!')
      );
      mongoose.connection.on('reconnected', () =>
        console.info('MongoDB (DepositService) Reconectado!')
      );
      mongoose.connection.on('error', (dbErr) =>
        console.error(`Error en conexión MongoDB (DepositService) post-inicial: ${dbErr.message}`)
      );
    } catch (error) {
      console.error(`Error de conexión inicial a MongoDB (DepositService): ${error.message}`);
      process.exit(1);
    }
  }

  async disconnect() {
    try {
      await mongoose.disconnect();
      console.log('MongoDB (DepositService) Desconectado.');
    } catch (error) {
      console.error(`Error al desconectar MongoDB (DepositService): ${error.message}`);
    }
  }
}

export default DatabaseConnector;
