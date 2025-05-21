import dotenv from 'dotenv';
dotenv.config({ path: './.env' });

import config from './src/config/envConfig.js';
import app from './src/app.js';
import DatabaseConnector from './src/config/db.js';

let serverInstance;

process.on('uncaughtException', (err) => {
    console.error('UNCAUGHT EXCEPTION! (DepositService) 💥 Shutting down...');
    console.error(err.name, err.message, err.stack);
    if (serverInstance) serverInstance.close(() => process.exit(1));
    else process.exit(1);
});

process.on('unhandledRejection', (err) => {
    console.error('UNHANDLED REJECTION! (DepositService) 💥 Shutting down gracefully...');
    console.error(err.name, err.message, err.stack);
    if (serverInstance) serverInstance.close(() => process.exit(1));
    else process.exit(1);
});

const start = async () => {
    try {
        console.log(`Intentando iniciar Deposit Service en modo: ${config.nodeEnv}`);
        console.log(`Puerto para Deposit Service: ${config.port}`);

        const dbConnector = new DatabaseConnector();
        await dbConnector.connect();

        serverInstance = app.listen(config.port, () => {
            console.log(`Deposit Service HTTP corriendo en el puerto ${config.port}.`);
        });
    } catch (error) {
        console.error('FALLÓ EL INICIO DEL DEPOSIT SERVICE:', error);
        process.exit(1);
    }
};

start().catch((error) => {
    console.error('Error no manejado durante el inicio del Deposit Service:', error);
    process.exit(1);
});