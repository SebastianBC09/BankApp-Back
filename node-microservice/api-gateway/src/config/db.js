import mongoose from 'mongoose';
import config from './envConfig.js';

class DatabaseConnector {
  constructor() {
    this.mongoURI = config.mongo.uri;
    if (!this.mongoURI) {
      console.error('FATAL ERROR: MONGO_URI no está disponible para DatabaseConnector en API Gateway.');
      process.exit(1);
    }
  }

  async connect() {
    try {
      const mongooseOptions = {
        serverSelectionTimeoutMS: 5000,
        appName: 'APIGateway',
      };
      const conn = await mongoose.connect(this.mongoURI, mongooseOptions);
      console.log(`MongoDB (APIGateway) Conectado: ${conn.connection.host} a la base de datos "${conn.connection.name}"`);

      mongoose.connection.on('disconnected', () => console.warn('MongoDB (APIGateway) Desconectado!'));
      mongoose.connection.on('reconnected', () => console.info('MongoDB (APIGateway) Reconectado!'));
      mongoose.connection.on('error', (dbErr) => console.error(`Error en conexión MongoDB (APIGateway) post-inicial: ${dbErr.message}`));

    } catch (error) {
      console.error(`Error de conexión inicial a MongoDB (APIGateway): ${error.message}`);
      process.exit(1);
    }
  }

  async disconnect() {
    try {
      await mongoose.disconnect();
      console.log('MongoDB (APIGateway) Desconectado.');
    } catch (error) {
      console.error(`Error al desconectar MongoDB (APIGateway): ${error.message}`);
    }
  }
}

export default DatabaseConnector;