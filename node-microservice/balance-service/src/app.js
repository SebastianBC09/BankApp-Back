import express from 'express';
import cors from 'cors';
import config from './config/envConfig.js';
import balanceRoute from '../src/routes/accountRoutes';

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

app.use(cors());

app.use('/account', balanceRoute);

app.get('/', (req, res) => {
  res.send(`Balance Service (Modo: ${config.nodeEnv}) funcionando!`);
});

app.use((err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';
  if (config.nodeEnv === 'development') {
    console.error('ERROR EN BALANCE SERVICE 💥:', err);
  } else if (err.isOperational) {
    console.error('ERROR OPERACIONAL EN BALANCE SERVICE:', err.message);
  } else {
    console.error('ERROR DE PROGRAMACIÓN EN BALANCE SERVICE:', err);
  }

  res.status(err.statusCode).json({
    status: err.status,
    message: err.isOperational || config.nodeEnv === 'development' ? err.message : 'Algo salió muy mal.',
    ...(config.nodeEnv === 'development' && { stack: err.stack })
  });
});

export default app;