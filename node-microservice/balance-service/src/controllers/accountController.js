import mongoose from 'mongoose';
import balanceService from '../services/accountService.js';
import AppError from '../utils/appError.js';

class BalanceController {
  async getBalance(req, res, next) {
    try {
      const accountId = req.params.accountId;
      const userId = req.header('X-User-ID');
      const clientIp = req.ip || req.socket?.remoteAddress || req.connection?.remoteAddress;

      if (!userId) {
        return next(
          new AppError(
            'Identificación de usuario no encontrada en la cabecera de la petición (X-User-ID).',
            401
          )
        );
      }
      if (!accountId || !mongoose.Types.ObjectId.isValid(accountId)) {
        return next(new AppError('Parámetro accountId inválido o faltante.', 400));
      }

      const balanceData = await balanceService.getAccountBalance({ accountId, userId, clientIp });

      res.status(200).json({
        status: 'success',
        data: balanceData,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new BalanceController();
