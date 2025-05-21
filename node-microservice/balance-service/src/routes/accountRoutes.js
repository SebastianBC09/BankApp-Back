import express from "express";
import accountController from "../controllers/accountController.js";

const router = express.Router();

router.get('/balance/:accountId', accountController.getBalance);

export default router;