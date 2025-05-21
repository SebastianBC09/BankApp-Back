import mongoose from 'mongoose';
import config from './envConfig.js';

class DatabaseConnector {
  constructor() {
    this.mongoURI = config.mongo.uri;
    if (!this.mongoURI) {
      console.error('FATAL ERROR: MONGO_URI no está disponible para DatabaseConnector en Balance Service.');
      process.exit(1);
    }
  }

  async connect() {
    try {
      const mongooseOptions = {
        serverSelectionTimeoutMS: 5000,
        appName: 'BalanceService', // Nombre de aplicación específico para este microservicio
      };
      const conn = await mongoose.connect(this.mongoURI, mongooseOptions);
      console.log(`MongoDB (BalanceService) Conectado: ${conn.connection.host} a la base de datos "${conn.connection.name}"`);

      mongoose.connection.on('disconnected', () => console.warn('MongoDB (BalanceService) Desconectado!'));
      mongoose.connection.on('reconnected', () => console.info('MongoDB (BalanceService) Reconectado!'));
      mongoose.connection.on('error', (dbErr) => console.error(`Error en conexión MongoDB (BalanceService) post-inicial: ${dbErr.message}`));

    } catch (error) {
      console.error(`Error de conexión inicial a MongoDB (BalanceService): ${error.message}`);
      process.exit(1);
    }
  }

  async disconnect() {
    try {
      await mongoose.disconnect();
      console.log('MongoDB (BalanceService) Desconectado.');
    } catch (error) {
      console.error(`Error al desconectar MongoDB (BalanceService): ${error.message}`);
    }
  }
}

export default DatabaseConnector;