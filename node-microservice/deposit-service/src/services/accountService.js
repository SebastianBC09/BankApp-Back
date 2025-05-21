import mongoose from 'mongoose';
import Account from '../models/accountModel.js';
import AppError from '../utils/appError.js';
import { logOperation } from '../utils/transactionLogger.js';

class AccountService {
    async depositToAccount(details) {
        const { accountId, userId, amount, clientIp } = details;
        let operationStatus = 'FAILURE';
        let logMessage = `Intento de depósito de ${amount} en cuenta ${accountId} por usuario ${userId}.`;
        const session = await mongoose.startSession();

        try {
            session.startTransaction();

            if (!userId) {
                logMessage = 'ID de usuario no proporcionado para el depósito.';
                operationStatus = 'INVALID_ATTEMPT';
                throw new AppError(logMessage, 400);
            }
            const depositAmountFloat = parseFloat(amount);
            if (isNaN(depositAmountFloat) || depositAmountFloat <= 0) {
                logMessage = `Monto de depósito inválido: ${amount}. Debe ser un número positivo.`;
                operationStatus = 'INVALID_ATTEMPT';
                throw new AppError(logMessage, 400);
            }

            const account = await Account.findOne({ _id: accountId, userId: userId }).session(session);

            if (!account) {
                let specificMessage = `Cuenta ${accountId} no encontrada para depósito.`;
                const tempAccount = await Account.findById(accountId).lean();
                if (tempAccount) {
                    specificMessage = `Cuenta ${accountId} no pertenece al usuario ${userId}. Depósito denegado.`;
                }
                logMessage = `Depósito fallido: ${specificMessage}`;
                operationStatus = 'INVALID_ATTEMPT';
                throw new AppError(specificMessage, tempAccount ? 403 : 404);
            }

            if (account.status !== 'active') {
                logMessage = `Depósito fallido: La cuenta ${accountId} no está activa. Estado actual: ${account.status}. No se pueden realizar depósitos.`;
                operationStatus = 'FAILURE';
                throw new AppError(logMessage, 403);
            }

            const currentBalance = parseFloat(account.balance.toString());

            account.balance = mongoose.Types.Decimal128.fromString((currentBalance + depositAmountFloat).toFixed(2));
            await account.save({ session });

            await session.commitTransaction();
            operationStatus = 'SUCCESS';
            logMessage = `Depósito de ${depositAmountFloat.toFixed(2)} ${account.currency} exitoso en la cuenta ${accountId} por el usuario ${userId}. Nuevo saldo: ${account.balance.toString()}.`;

            await logOperation({
                userId,
                operationType: 'DEPOSIT',
                accountId,
                amount: depositAmountFloat.toFixed(2),
                currency: account.currency,
                status: operationStatus,
                message: logMessage,
                clientIp,
            });

            return {
                message: 'Depósito exitoso.',
                accountId: account._id.toString(),
                newBalance: account.balance.toString(),
                currency: account.currency,
                amountDeposited: depositAmountFloat.toFixed(2),
            };

        } catch (error) {
            await session.abortTransaction();
            if (operationStatus !== 'SUCCESS') {
                await logOperation({
                    userId,
                    operationType: 'DEPOSIT',
                    accountId,
                    amount: (typeof amount === 'number' || !isNaN(parseFloat(amount))) ? parseFloat(amount).toFixed(2) : 'N/A',
                    // currency no la tenemos aquí si la cuenta no se encontró, pero se puede omitir o loguear N/A
                    status: operationStatus || 'FAILURE',
                    message: error.message || logMessage,
                    clientIp,
                });
            }
            if (!(error instanceof AppError)) {
                throw new AppError(error.message || 'Error interno del servidor en servicio de depósito.', 500);
            }
            throw error;
        } finally {
            await session.endSession();
        }
    }
}

export default new AccountService();