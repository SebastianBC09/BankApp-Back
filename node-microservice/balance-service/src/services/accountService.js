import mongoose from 'mongoose';
import Account from '../models/accountModel.js';
import AppError from '../utils/appError.js';
import { logOperation } from '../utils/transactionLogger.js';

class BalanceService {
  async getAccountBalance(details) {
    const { userId, clientIp } = details;
    let accountIdForLog = 'N/A';
    let operationDetailsForLog = {
      userId,
      operationType: 'USER_BALANCE_INQUIRY',
      accountId: accountIdForLog,
      clientIp,
    };
    try {
      if (!userId || userId.trim() === '') {
        const message = 'ID de usuario (X-User-ID) no proporcionado o vacío.';
        await logOperation({ ...operationDetailsForLog, status: 'VALIDATION_ERROR', message });
        throw new AppError(message, 400);
      }
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        const message = `ID de usuario inválido (formato ObjectId esperado): ${userId}.`;
        await logOperation({ ...operationDetailsForLog, status: 'VALIDATION_ERROR', message });
        throw new AppError(message, 400);
      }
      const userObjectId = new mongoose.Types.ObjectId(userId.trim());
      const account = await Account.findOne({ userId: userObjectId });
      if (!account) {
        const message = `No se encontró cuenta para el usuario ${userId}.`;
        await logOperation({ ...operationDetailsForLog, status: 'NOT_FOUND', message });
        throw new AppError(message, 404);
      }
      accountIdForLog = account._id.toString();
      operationDetailsForLog.accountId = accountIdForLog;
      if (account.status !== 'active' && account.status !== 'pending_activation') {
        const message = `Consulta no permitida: La cuenta N.º ${account.accountNumber} (ID: ${accountIdForLog}) del usuario ${userId} no está activa. Estado: ${account.status}.`;
        await logOperation({ ...operationDetailsForLog, status: 'ACCOUNT_INACTIVE', message });
        throw new AppError(message, 403);
      }
      const successMessage = `Consulta de saldo exitosa para la cuenta N.º ${account.accountNumber} (ID: ${accountIdForLog}) del usuario ${userId}.`;
      await logOperation({ ...operationDetailsForLog, status: 'SUCCESS', message: successMessage });
      return {
        accountId: accountIdForLog,
        balance: account.balance.toString(),
        currency: account.currency,
        accountNumber: account.accountNumber,
        accountType: account.accountType,
        status: account.status,
      };

    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      const safeUserId = typeof userId === 'string' ? userId : 'N/A_IN_CATCH';
      const safeClientIp = typeof clientIp === 'string' ? clientIp : 'N/A_IN_CATCH';
      await logOperation({
        ...operationDetailsForLog,
        userId: safeUserId,
        clientIp: safeClientIp,
        status: 'SYSTEM_ERROR',
        message: `Excepción no controlada durante la consulta de saldo: ${error.message}`,
      });
      throw new AppError('Error interno del servidor al procesar la consulta de saldo.', 500);
    }
  }
}

export default new BalanceService();