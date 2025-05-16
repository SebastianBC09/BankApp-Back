import mongoose from 'mongoose';

class DatabaseConnector {
    constructor() {
        this.mongoUri = process.env.MONGO_URI;

        if(!this.mongoUri) {
            console.error('FATAL ERROR: MONGO_URI no está definida en las variables de entorno.');
            console.error('Asegúrese de que el archivo .env existe y MONGO_URI está configurada correctamente.');
            console.error('La aplicación se cerrará.');
            process.exit(1);
        }
    }

    async connect() {
        try {
            const mongooseOptions= {};
            const conn = await mongoose.connect(this.mongoUri, mongooseOptions);
            console.log(`MongoDB Conectado: ${conn.connection.host} a la base de datos "${conn.connection.name}"`);

            mongoose.connection.on('disconnected', () => {
                console.warn('MongoDB Desconectado!');
            });

            mongoose.connection.on('reconnected', () => {
                console.info('MongoDB Reconectado!');
            });

            mongoose.connection.on('error', (err) => {
                console.error(`Error en la conexión de MongoDB después de la conexión inicial: ${err.message}`);
            });
        } catch (error) {
            console.error(`Error de conexión inicial a MongoDB: ${error.message}`);
            console.error('Verifique su MONGO_URI, la configuración de red de Atlas (IP Whitelist) y el estado del clúster.');
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