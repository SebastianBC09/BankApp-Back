import express from 'express';
import config from './config/envConfig.js';
import depositRoutes from './routes/accountRoutes';

const app = express();

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

if (config.nodeEnv === 'development') {
    try {
        const morgan = (await import('morgan')).default;
        app.use(morgan('dev'));
    } catch (e) {
        console.warn("Morgan (HTTP logger) no pudo ser cargado.");
    }
}

app.use('/account', depositRoutes);

app.get('/', (req, res) => {
    res.send(`Deposit Service (Modo: ${config.nodeEnv}) funcionando!`);
});

app.use((err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';
    if (config.nodeEnv === 'development') {
        console.error('ERROR EN DEPOSIT SERVICE 💥:', err);
    } else if (err.isOperational) {
        console.error('ERROR OPERACIONAL EN DEPOSIT SERVICE:', err.message);
    } else {
        console.error('ERROR DE PROGRAMACIÓN EN DEPOSIT SERVICE:', err);
    }

    res.status(err.statusCode).json({
        status: err.status,
        message: err.isOperational || config.nodeEnv === 'development' ? err.message : 'Algo salió muy mal en el servicio de depósitos.',
        ...(config.nodeEnv === 'development' && { stack: err.stack })
    });
});

export default app;