import express from "express";
import accountController from "../controllers/accountController.js";

const router = express.Router();

router.post('/withdraw/:accountId', accountController.handleWithdrawal);

export default router;