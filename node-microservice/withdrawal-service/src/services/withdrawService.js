import mongoose from 'mongoose';
import Account from '../models/accountModel.js';
import AppError from '../utils/appError.js';
import { logOperation } from '../utils/transactionLogger.js';

class WithdrawService {
  async performWithdrawal(details) {
    const { userId, amount, clientIp } = details;
    let operationDetailsForLog = {
      userId,
      operationType: 'DEPOSIT',
      accountId: 'N/A',
      amount: 'N/A',
      currency: 'N/A',
      clientIp,
    };
    const session = await mongoose.startSession();

    try {
      session.startTransaction();
      console.log(`[WithdrawService] Iniciando retiro para UserID: '${userId}', Monto: ${amount}`);
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
      const withdrawalAmountFloat = parseFloat(amount);
      if (isNaN(withdrawalAmountFloat) || withdrawalAmountFloat <= 0) {
        const message = `Monto de retiro inválido: '${amount}'. Debe ser un número positivo.`;
        operationDetailsForLog.amount = String(amount); // Loguear el monto problemático
        await logOperation({ ...operationDetailsForLog, status: 'VALIDATION_ERROR', message });
        throw new AppError(message, 400);
      }
      operationDetailsForLog.amount = withdrawalAmountFloat.toFixed(2);
      console.log(`[WithdrawService] Buscando cuenta para userId (ObjectId): ${userObjectId}`);
      const account = await Account.findOne({ userId: userObjectId }).session(session);
      if (!account) {
        const message = `No se encontró una cuenta activa para realizar el retiro para el usuario ${userId}.`;
        await logOperation({ ...operationDetailsForLog, status: 'ACCOUNT_NOT_FOUND', message });
        throw new AppError(message, 404);
      }
      operationDetailsForLog.accountId = account._id.toString();
      operationDetailsForLog.currency = account.currency;
      if (account.status !== 'active') {
        const message = `Retiro fallido: La cuenta N.º ${account.accountNumber} (ID: ${account._id}) del usuario ${userId} no está activa. Estado actual: ${account.status}.`;
        await logOperation({ ...operationDetailsForLog, status: 'ACCOUNT_INACTIVE', message });
        throw new AppError(message, 403);
      }
      const currentBalance = parseFloat(account.balance.toString());
      account.balance = mongoose.Types.Decimal128.fromString(
        (currentBalance - withdrawalAmountFloat).toFixed(2)
      );
      await account.save({ session });
      await session.commitTransaction();
      const successMessage = `Retiro de ${withdrawalAmountFloat.toFixed(2)} ${account.currency} exitoso en la cuenta N.º ${account.accountNumber} (ID: ${account._id}) por el usuario ${userId}. Nuevo saldo: ${account.balance.toString()}.`;
      await logOperation({ ...operationDetailsForLog, status: 'SUCCESS', message: successMessage });
      return {
        message: 'Retiro exitoso.',
        accountId: account._id.toString(),
        accountNumber: account.accountNumber,
        newBalance: account.balance.toString(),
        currency: account.currency,
        amountWithdrawn: withdrawalAmountFloat.toFixed(2),
      };
    } catch (error) {
      await session.abortTransaction();
      if (error instanceof AppError) {
        throw error;
      }
      console.error('[WithdrawService] Error inesperado en performWithdrawal:', error);
      const safeUserId = typeof userId === 'string' ? userId : 'N/A_IN_CATCH';
      const safeClientIp = typeof clientIp === 'string' ? clientIp : 'N/A_IN_CATCH';
      await logOperation({
        ...operationDetailsForLog,
        userId: safeUserId,
        clientIp: safeClientIp,
        status: 'SYSTEM_ERROR',
        message: `Excepción no controlada durante el retiro: ${error.message || 'Error desconocido'}.`,
      });
      throw new AppError(error.message || 'Error interno del servidor al procesar el retiro.', 500);
    } finally {
      await session.endSession();
    }
  }
}

export default new WithdrawService();
