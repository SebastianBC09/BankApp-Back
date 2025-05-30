import balanceService from '../services/accountService.js';
import AppError from '../utils/appError.js';

class BalanceController {
  async getBalance(req, res, next) {
    try {
      const userId = req.header('X-User-ID');
      const clientIp = req.ip || req.socket?.remoteAddress || req.connection?.remoteAddress;
      if (!userId || userId.trim() === '') {
        return next(
          new AppError(
            'Identificación de usuario (X-User-ID) no encontrada o vacía en la cabecera de la petición.',
            401
          )
        );
      }
      const balanceData = await balanceService.getAccountBalance({ userId, clientIp });
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
