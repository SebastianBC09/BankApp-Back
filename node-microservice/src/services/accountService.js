import mongoose from 'mongoose';
import Account from "../models/accountModel.js";
import { logOperation } from "../utils/transactionLogger.js";
import AppError from "../utils/appError.js";


class AccountService {
    async getAccountBalance(details) {
        const { accountId, userId, clientIp} = details;
        let operationStatus = 'FAILURE';
        let logMessage = `Intento de consulta de saldo para cuenta ${accountId} por usuario ${userId}.`;

        try {
            if (!userId) {
                logMessage = 'ID de usuario no proporcionado para la consulta de saldo.';
                operationStatus = 'INVALID_ATTEMPT';
                throw new AppError(logMessage, 400);
            }

            const account = await Account.findOne({ _id: accountId, userId: userId }).lean();

            if (!account) {
                let specificMessage = `Cuenta ${accountId} no encontrada.`;
                const tempAccount = await Account.findById(accountId).lean();
                if (tempAccount) {
                    specificMessage = `Cuenta ${accountId} no pertenece al usuario ${userId}. Acceso denegado.`;
                }
                logMessage = `Consulta de saldo fallida: ${specificMessage}`;
                operationStatus = 'INVALID_ATTEMPT';
                throw new AppError(specificMessage, tempAccount ? 403 : 404);
            }

            operationStatus = 'SUCCESS';
            logMessage = `Consulta de saldo exitosa para la cuenta ${accountId} por el usuario ${userId}.`;
            await logOperation({
                userId,
                operationType: 'BALANCE_INQUIRY',
                accountId,
                status: operationStatus,
                message: logMessage,
                clientIp,
            });

            return {
                accountId: account._id.toString(),
                balance: account.balance.toString(),
                currency: account.currency,
                accountNumber: account.accountNumber,
                accountType: account.accountType,
            };

        } catch (error) {
            if (operationStatus !== 'SUCCESS') {
                await logOperation({
                    userId,
                    operationType: 'BALANCE_INQUIRY',
                    accountId,
                    status: operationStatus || 'FAILURE',
                    message: error.message || logMessage,
                    clientIp,
                });
            }
            if (!(error instanceof AppError)) {
                throw new AppError(error.message || 'Error interno del servidor en servicio de consulta de saldo.', 500);
            }
            throw error;
        }
    }

    async withdrawFromAccount(details) {
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
            if (isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
                logMessage = `Monto de retiro inválido: ${amount}.`;
                operationStatus = 'INVALID_ATTEMPT';
                throw new AppError(logMessage, 400);
            }

            const withdrawalAmount = parseFloat(amount);

            const account = await Account.findOne({ _id: accountId, userId: userId }).session(session);

            if (!account) {
                let specificMessage = `Cuenta ${accountId} no encontrada para retiro.`;
                const tempAccount = await Account.findById(accountId).lean(); // No necesita sesión, solo consulta
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
            if (currentBalance < withdrawalAmount) {
                logMessage = `Retiro fallido: Fondos insuficientes en la cuenta ${accountId}. Saldo: ${currentBalance}, Retiro: ${withdrawalAmount}.`;
                operationStatus = 'FAILURE';
                throw new AppError(logMessage, 400);
            }

            account.balance = mongoose.Types.Decimal128.fromString((currentBalance - withdrawalAmount).toFixed(2));
            await account.save({ session });

            await session.commitTransaction();
            operationStatus = 'SUCCESS';
            logMessage = `Retiro de ${withdrawalAmount} ${account.currency} exitoso de la cuenta ${accountId} por el usuario ${userId}. Nuevo saldo: ${account.balance.toString()}.`;

            await logOperation({
                userId,
                operationType: 'WITHDRAWAL',
                accountId,
                amount: withdrawalAmount.toFixed(2),
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
                amountWithdrawn: withdrawalAmount.toFixed(2),
            };

        } catch (error) {
            await session.abortTransaction();
            if (operationStatus !== 'SUCCESS') {
                await logOperation({
                    userId,
                    operationType: 'WITHDRAWAL',
                    accountId,
                    amount: parseFloat(amount).toFixed(2) || 'N/A',
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