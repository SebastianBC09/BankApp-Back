import express from 'express';
import { checkJwt } from '../middlewares/authMiddleware.js';
import { provisionUser } from '../middlewares/userProvisioningMiddleware.js';

const router = express.Router();

router.get('/public', (req, res) => {
  res.json({
    message: 'Endpoint público en apiRoutes. No se necesita token.',
    timestamp: new Date().toISOString(),
  });
});

router.get('/private', checkJwt, (req, res) => {
  res.json({
    message: 'Endpoint privado en apiRoutes. Token validado.',
    authPayload: req.auth.payload,
  });
});

router.get('/me', checkJwt, provisionUser, (req, res) => {
  if (!req.currentUser) {
    return res.status(404).json({
      status: 'error',
      message: 'Usuario autenticado no encontrado o no provisionado en la base de datos local.'
    });
  }
  res.json({
    message: 'Información del usuario autenticado y provisionado.',
    auth0UserSub: req.auth.payload.sub,
    databaseUser: {
      id: req.currentUser._id,
      firstName: req.currentUser.firstName,
      lastName: req.currentUser.lastName,
      email: req.currentUser.email,
      roles: req.currentUser.roles,
      status: req.currentUser.status,
    }
  });
});

export default router;