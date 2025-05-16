import express from 'express';
import apiRoutes from './routes/apiRoutes.js';

const app = express();

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

app.use('/api/test', apiRoutes);

export default app;
