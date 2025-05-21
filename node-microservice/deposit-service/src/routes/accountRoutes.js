import express from "express";
import accountController from "../controllers/accountController.js";

const router = express.Router();

router.post('/deposit/:accountId', accountController.handleDeposit);

export default router;