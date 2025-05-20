import express from 'express';
import cors from 'cors';
import apiRoutes from './routes/apiRoutes.js';
import accountRoutes from "./routes/accountRoutes.js";
import userRoutes from "./routes/userRoutes.js";

const app = express();

app.use(cors());
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

app.use('/api/test', apiRoutes);
app.use('/api/v1/accounts', accountRoutes);
app.use('/api/v1/users', userRoutes);

export default app;
