import accountService from "../services/accountService.js";
import AppError from "../utils/appError.js";

class AccountController {
    async getBalance(req, res, next) {
        try {
            const accountId = req.params.accountId;
            const userId = req.currentUser._id;
            const clientIp = req.ip || req.socket?.remoteAddress || req.connection?.remoteAddress;

            const balanceData = await accountService.getAccountBalance({ accountId, userId, clientIp });

            res.status(200).json({
                status: 'success',
                data: balanceData,
            });
        } catch (error) {
            next(error);
        }
    }

    async withdraw(req, res, next) {
        try {
            const accountId = req.params.accountId;
            const userId = req.currentUser._id;
            const { amount } = req.body;
            const clientIp = req.ip || req.socket?.remoteAddress || req.connection?.remoteAddress;

            if (amount === undefined) {
                // Usamos AppError directamente aquí para errores de validación de entrada muy básicos
                // antes de llamar al servicio, o podríamos delegar toda validación al servicio.
                const AppError = (await import('../utils/appError.js')).default; // Carga dinámica para no importarlo si no se usa
                throw new AppError('El campo "amount" (monto) es requerido en el cuerpo de la petición.', 400);
            }

            const withdrawalData = await accountService.withdrawFromAccount({
                accountId,
                userId,
                amount,
                clientIp,
            });

            res.status(200).json({
                status: 'success',
                data: withdrawalData,
            });
        } catch (error) {
            next(error);
        }
    }

    async deposit(req, res, next) {
        try {
            const accountId = req.params.accountId;
            const userId = req.currentUser._id;
            const { amount } = req.body;
            const clientIp = req.ip || req.socket?.remoteAddress || req.connection?.remoteAddress;

            if (amount === undefined) {
                throw new AppError('El campo "amount" (monto) es requerido en el cuerpo de la petición.', 400);
            }

            const depositData = await accountService.depositToAccount({
                accountId,
                userId,
                amount,
                clientIp,
            });

            res.status(201).json({
                status: 'success',
                data: depositData,
            });
        } catch (error) {
            next(error);
        }
    }
};

export default new AccountController();