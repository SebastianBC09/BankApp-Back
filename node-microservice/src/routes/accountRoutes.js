import express from "express";
import accountController from "../controllers/accountController.js";
import { checkJwt } from "../middlewares/authMiddleware.js";
import { provisionUser} from "../middlewares/userProvisioningMiddleware.js";

const router = express.Router();

router.get('/:accountId/balance', checkJwt, provisionUser, accountController.getBalance);

export default router;