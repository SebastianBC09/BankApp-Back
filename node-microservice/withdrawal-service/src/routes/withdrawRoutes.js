import express from 'express';
import accountController from '../controllers/withdrawController.js';

const router = express.Router();
router.post('/', accountController.handleWithdrawal);

export default router;
