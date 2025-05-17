import Account from "../models/accountModel.js";
import User from "../models/userModel.js";
import { logOperation } from "../utils/transactionLogger.js";
import AppError from "../utils/appError.js";


class AccountService {
    async getAccountBalance(details) {
        const { accountId, userId, clientIp} = details;
        let operationStatus = 'FAILURE';
        let logMessage = '';

        try {
            if(!userId) {
                logMessage = 'ID de usuario no proporcionado para la consulta de saldo.';
                operationStatus = 'INVALID_ATTEMPT';
                throw new AppError(logMessage, 400);
            }
            const account = await Account.findOne({_id: accountId, userId: userId}).lean();

            if(!account) {
                logMessage = `Intento de consulta de saldo fallido: Cuenta ${accountId} no encontrada o no pertenece al usuario ${userId}.`;
                operationStatus = 'INVALID_ATTEMPT';
                const tempAccount = await Account.findById(accountId).lean();
                if(tempAccount) {
                    logMessage = `Intento de consulta de saldo no autorizado: Cuenta ${accountId} no pertenece al usuario ${userId}.`;
                } else {
                    logMessage = `Intento de consulta de saldo fallido: Cuenta ${accountId} no encontrada.`;
                }
                throw new AppError(logMessage, 404);
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
                accountId: account._id,
                balance: account.balance.toString(),
                currency: account.currency,
                accountNumber: account.accountNumber,
                accountType: account.accountType,
            };

        } catch (error) {
            if(operationStatus !== 'SUCCESS') {
                await logOperation({
                    userId,
                    operationType: 'BALANCE_INQUIRY',
                    accountId,
                    status: operationStatus || 'FAILURE',
                    message: error.message || logMessage || 'Error desconocido durante la consulta de saldo.',
                    clientIp,
                });
            }

            if(!(error instanceof AppError)) {
                throw new AppError(error.message || 'Error interno del servidor en el servicio de cuentas.', 500);
            }
            throw error;
        }
    }
}

export default new AccountService();