import express from 'express';
import userController from '../controllers/userController.js';
import { checkJwt } from '../middlewares/authMiddleware.js';
import { provisionUser } from '../middlewares/userProvisioningMiddleware.js';

const router = express.Router();

router.put(
    '/me/complete-profile', // O '/complete-profile'
    checkJwt,
    provisionUser,
    userController.completeMyProfile
);

export default router;