import depositService from '../services/depositService.js';
import AppError from '../utils/appError.js';

class DepositController {
  async handleDeposit(req, res, next) {
    try {
      const userId = req.header('X-User-ID');
      const { amount } = req.body;
      const clientIp = req.ip || req.socket?.remoteAddress || req.connection?.remoteAddress;
      if (!userId || userId.trim() === '') {
        return next(
          new AppError(
            'Identificación de usuario (X-User-ID) no encontrada o vacía en la cabecera.',
            401
          )
        );
      }
      if (amount === undefined || amount === null) {
        return next(
          new AppError('El campo "amount" (monto) es requerido en el cuerpo de la petición.', 400)
        );
      }
      const depositData = await depositService.depositToAccount({
        userId,
        amount,
        clientIp,
      });
      res.status(200).json({
        status: 'success',
        message: 'Depósito procesado exitosamente.',
        data: depositData,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new DepositController();
