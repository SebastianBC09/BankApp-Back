import express from 'express';
import depositController from '../controllers/depositController.js';

const router = express.Router();
router.post('/', depositController.handleDeposit);

export default router;
