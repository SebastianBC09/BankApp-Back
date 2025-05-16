import mongoose from 'mongoose';
import config from './envConfig.js';

class DatabaseConnector {
  constructor() {
    this.mongoURI = config.mongo.uri;

    if (!this.mongoURI) {
      console.error(
        'FATAL ERROR: MONGO_URI no está disponible a través de la configuración centralizada para DatabaseConnector.'
      );
      process.exit(1);
    }
  }

  async connect() {
    try {
      const mongooseOptions = {};
      const conn = await mongoose.connect(this.mongoURI, mongooseOptions);
      console.log(
        `MongoDB Conectado: ${conn.connection.host} a la base de datos "${conn.connection.name}"`
      );

      mongoose.connection.on('disconnected', () => {
        console.warn('MongoDB Desconectado!');
      });

      mongoose.connection.on('reconnected', () => {
        console.info('MongoDB Reconectado!');
      });

      mongoose.connection.on('error', (err) => {
        console.error(
          `Error en la conexión de MongoDB después de la conexión inicial: ${err.message}`
        );
      });
    } catch (error) {
      console.error(`Error de conexión inicial a MongoDB: ${error.message}`);
      console.error(
        'Verifique su MONGO_URI, la configuración de red de Atlas (IP Whitelist) y el estado del clúster.'
      );
      console.error('La aplicación se cerrará.');
      process.exit(1);
    }
  }

  async disconnect() {
    try {
      await mongoose.disconnect();
      console.log('MongoDB Desconectado.');
    } catch (error) {
      console.error(`Error al desconectar MongoDB: ${error.message}`);
    }
  }
}

export default DatabaseConnector;
