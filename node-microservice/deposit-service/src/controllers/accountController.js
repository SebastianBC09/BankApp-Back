import mongoose from 'mongoose';
import accountService from "../services/accountService";
import AppError from '../utils/appError.js';

class AccountController {
    async handleDeposit(req, res, next) {
        try {
            const accountId = req.params.accountId;
            const userId = req.header('X-User-ID');
            const { amount } = req.body;
            const clientIp = req.ip || req.socket?.remoteAddress || req.connection?.remoteAddress;

            if (!userId) {
                return next(new AppError('Identificación de usuario (X-User-ID) no encontrada en la cabecera.', 401));
            }
            if (!accountId || !mongoose.Types.ObjectId.isValid(accountId)) {
                return next(new AppError('Parámetro accountId inválido o faltante.', 400));
            }
            if (amount === undefined || amount === null) {
                return next(new AppError('El campo "amount" (monto) es requerido en el cuerpo de la petición.', 400));
            }

            const depositData = await accountService.depositToAccount({
                accountId,
                userId,
                amount,
                clientIp,
            });

            res.status(200).json({
                status: 'success',
                data: depositData,
            });
        } catch (error) {
            next(error);
        }
    }
}
export default new AccountController();