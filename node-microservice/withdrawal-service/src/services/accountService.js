import mongoose from 'mongoose';
import Account from '../models/accountModel.js';
import AppError from '../utils/appError.js';
import { logOperation } from '../utils/transactionLogger.js';

class AccountService {
    async performWithdrawal(details) {
        const { accountId, userId, amount, clientIp } = details;
        let operationStatus = 'FAILURE';
        let logMessage = `Intento de retiro de ${amount} en cuenta ${accountId} por usuario ${userId}.`;
        const session = await mongoose.startSession();

        try {
            session.startTransaction();

            if (!userId) {
                logMessage = 'ID de usuario no proporcionado para el retiro.';
                operationStatus = 'INVALID_ATTEMPT';
                throw new AppError(logMessage, 400);
            }
            const withdrawalAmountFloat = parseFloat(amount);
            if (isNaN(withdrawalAmountFloat) || withdrawalAmountFloat <= 0) {
                logMessage = `Monto de retiro inválido: ${amount}.`;
                operationStatus = 'INVALID_ATTEMPT';
                throw new AppError(logMessage, 400);
            }

            const account = await Account.findOne({ _id: accountId, userId: userId }).session(session);

            if (!account) {
                let specificMessage = `Cuenta ${accountId} no encontrada para retiro.`;
                const tempAccount = await Account.findById(accountId).lean();
                if (tempAccount) {
                    specificMessage = `Cuenta ${accountId} no pertenece al usuario ${userId}. Retiro denegado.`;
                }
                logMessage = `Retiro fallido: ${specificMessage}`;
                operationStatus = 'INVALID_ATTEMPT';
                throw new AppError(specificMessage, tempAccount ? 403 : 404);
            }

            if (account.status !== 'active') {
                logMessage = `Retiro fallido: La cuenta ${accountId} no está activa. Estado actual: ${account.status}.`;
                operationStatus = 'FAILURE';
                throw new AppError(logMessage, 403);
            }

            const currentBalance = parseFloat(account.balance.toString());
            if (currentBalance < withdrawalAmountFloat) {
                logMessage = `Retiro fallido: Fondos insuficientes en la cuenta ${accountId}. Saldo: ${currentBalance}, Retiro: ${withdrawalAmountFloat}.`;
                operationStatus = 'FAILURE';
                throw new AppError(logMessage, 400);
            }

            account.balance = mongoose.Types.Decimal128.fromString((currentBalance - withdrawalAmountFloat).toFixed(2));
            await account.save({ session });

            await session.commitTransaction();
            operationStatus = 'SUCCESS';
            logMessage = `Retiro de ${withdrawalAmountFloat.toFixed(2)} ${account.currency} exitoso de la cuenta ${accountId} por el usuario ${userId}. Nuevo saldo: ${account.balance.toString()}.`;

            await logOperation({
                userId,
                operationType: 'WITHDRAWAL',
                accountId,
                amount: withdrawalAmountFloat.toFixed(2),
                currency: account.currency,
                status: operationStatus,
                message: logMessage,
                clientIp,
            });

            return {
                message: 'Retiro exitoso.',
                accountId: account._id.toString(),
                newBalance: account.balance.toString(),
                currency: account.currency,
                amountWithdrawn: withdrawalAmountFloat.toFixed(2),
            };

        } catch (error) {
            await session.abortTransaction();
            if (operationStatus !== 'SUCCESS') {
                await logOperation({
                    userId,
                    operationType: 'WITHDRAWAL',
                    accountId,
                    amount: (typeof amount === 'number' || !isNaN(parseFloat(amount))) ? parseFloat(amount).toFixed(2) : 'N/A',
                    status: operationStatus || 'FAILURE',
                    message: error.message || logMessage,
                    clientIp,
                });
            }
            if (!(error instanceof AppError)) {
                throw new AppError(error.message || 'Error interno del servidor en servicio de retiro.', 500);
            }
            throw error;
        } finally {
            await session.endSession();
        }
    }
}

export default new AccountService();