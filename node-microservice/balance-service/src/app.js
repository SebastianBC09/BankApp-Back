import express from 'express';
import cors from 'cors';
import config from './config/envConfig.js';
import balanceRoute from '../src/routes/accountRoutes.js';

const app = express();

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

if (config.nodeEnv === 'development') {
  try {
    const morgan = (await import('morgan')).default;
    app.use(morgan('dev'));
  } catch (e) {
    console.warn('Morgan (HTTP logger) no pudo ser cargado.', e);
  }
}

app.use(cors());
app.use('/', balanceRoute);

app.use((err, req, res) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';
  if (config.nodeEnv === 'development') {
    console.error('ERROR EN BALANCE SERVICE 💥 (Development):', {
      message: err.message,
      status: err.status,
      statusCode: err.statusCode,
      stack: err.stack,
      isOperational: err.isOperational
    });
  } else {
    console.error('ERROR DE PROGRAMACIÓN/INESPERADO EN BALANCE SERVICE (Production):', err);
  }
  if (config.nodeEnv === 'development') {
    return res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
    });
  }
  return res.status(500).json({
    status: 'error',
    message: 'Algo salió muy mal en el servidor. Por favor, intente más tarde.',
  });
});

export default app;
