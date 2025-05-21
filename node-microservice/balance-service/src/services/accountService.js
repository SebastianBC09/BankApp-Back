import mongoose from 'mongoose';
import Account from '../models/accountModel.js';
import AppError from '../utils/appError.js';
import { logOperation } from '../utils/transactionLogger.js';

class BalanceService {
  async getAccountBalance(details) {
    const { accountId, userId, clientIp } = details;
    let operationStatus = 'FAILURE';
    let logMessage = `Intento de consulta de saldo para cuenta ${accountId} por usuario ${userId}.`;

    try {
      if (!userId) {
        logMessage = 'ID de usuario no proporcionado (cabecera X-User-ID faltante o vacía).';
        operationStatus = 'INVALID_ATTEMPT';
        throw new AppError(logMessage, 400);
      }
      if (!mongoose.Types.ObjectId.isValid(accountId)) {
        logMessage = `ID de cuenta inválido: ${accountId}.`;
        operationStatus = 'INVALID_ATTEMPT';
        throw new AppError(logMessage, 400);
      }
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        logMessage = `ID de usuario inválido recibido del API Gateway: ${userId}.`;
        operationStatus = 'INVALID_ATTEMPT';
        throw new AppError(logMessage, 400); // O 500 si consideras que esto es un error interno del sistema de gateway
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

      if (account.status !== 'active' && account.status !== 'pending_activation') {
        logMessage = `Consulta de saldo no permitida: La cuenta ${accountId} no está activa. Estado actual: ${account.status}.`;
        operationStatus = 'FAILURE';
        throw new AppError(logMessage, 403);
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
        status: account.status,
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
}

export default new BalanceService();