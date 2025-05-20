import mongoose from 'mongoose';
import config from '../config/envConfig.js';
import Account from '../models/accountModel.js';
import User from '../models/userModel.js';
import { logOperation } from '../utils/transactionLogger.js';
import AppError from '../utils/appError.js';

class UserService {
    async completeUserProfileAndOpenAccount() {
        const { userId, profileData, clientIp } = details;
        const session = await mongoose.startSession();
        let userOperationStatus = 'FAILURE';
        let accountOperationStatus = 'FAILURE';
        let userLogMessage = `Intento de completar perfil para usuario ${userId}.`;
        let accountLogMessage = '';

        try {
            session.startTransaction();

            const user = await User.findById(userId).session(session);
            if (!user) {
                userLogMessage = `Usuario ${userId} no encontrado para completar perfil.`;
                throw new AppError(userLogMessage, 404);
            }

            const allowedUpdates = [
                'firstName', 'lastName', 'phone', 'address',
                'dateOfBirth', 'nationality', 'identificationDocument',
                'agreedToTermsVersion', 'preferences'
            ];

            Object.keys(profileData).forEach(key => {
                if (allowedUpdates.includes(key)) {
                    // Manejo especial para subdocumentos para evitar que se borren si no vienen completos
                    if ((key === 'phone' || key === 'address' || key === 'identificationDocument' || key === 'preferences') && typeof profileData[key] === 'object' && profileData[key] !== null) {
                        user[key] = { ...user[key], ...profileData[key] }; // Fusionar subdocumentos
                    } else if (profileData[key] !== undefined) { // Evitar borrar campos con undefined si no se envían
                        user[key] = profileData[key];
                    }
                }
            });

            // Validar que los campos requeridos después de la actualización estén presentes si es necesario
            // Por ejemplo, si identificationDocument.number es crucial ahora
            if (!user.firstName || !user.lastName || !user.identificationDocument?.number || !user.address?.street) {
                userLogMessage = 'Datos de perfil incompletos o inválidos después de la actualización.';
                throw new AppError(userLogMessage, 400);
            }

            user.status = 'active'; // Cambiar el estado del usuario
            await user.save({ session });
            userOperationStatus = 'SUCCESS';
            userLogMessage = `Perfil completado exitosamente para usuario ${userId}. Estado: active.`;

            await logOperation({
                userId,
                operationType: 'PROFILE_COMPLETION',
                status: userOperationStatus,
                message: userLogMessage,
                clientIp,
            });

            // Crear la primera cuenta bancaria
            const accountNumber = await generateAccountNumber();
            const newAccount = new Account({
                userId: user._id,
                accountNumber: accountNumber,
                accountType: 'savings', // Tipo de cuenta por defecto
                balance: mongoose.Types.Decimal128.fromString('0.00'), // Saldo inicial
                currency: config.cors.origin.includes('localhost') ? 'COP' : (user.address?.country === 'CO' ? 'COP' : 'USD'), // Moneda por defecto, ejemplo
                status: 'active',
            });
            await newAccount.save({ session });
            accountOperationStatus = 'SUCCESS';
            accountLogMessage = `Cuenta inicial ${newAccount.accountNumber} creada para usuario ${userId}.`;

            await logOperation({
                userId,
                operationType: 'INITIAL_ACCOUNT_OPENING',
                accountId: newAccount._id.toString(),
                status: accountOperationStatus,
                message: accountLogMessage,
                clientIp,
            });

            await session.commitTransaction();

            return {
                user: user.toObject({ virtuals: true }), // Devolver el usuario actualizado
                account: newAccount.toObject(), // Devolver la nueva cuenta
            };

        } catch (error) {
            await session.abortTransaction();
            if (userOperationStatus !== 'SUCCESS') {
                await logOperation({
                    userId,
                    operationType: 'PROFILE_COMPLETION',
                    status: userOperationStatus,
                    message: error.message || userLogMessage,
                    clientIp,
                });
            }
            if (accountOperationStatus !== 'SUCCESS' && accountOperationStatus !== 'FAILURE') { // Solo loguear si no se creó
                await logOperation({
                    userId,
                    operationType: 'INITIAL_ACCOUNT_OPENING',
                    status: 'FAILURE',
                    message: accountLogMessage || error.message, // Usar accountLogMessage si está seteado
                    clientIp,
                });
            }

            if (!(error instanceof AppError)) {
                throw new AppError(error.message || 'Error interno del servidor al completar el perfil.', 500);
            }
            throw error;
        } finally {
            await session.endSession();
        }
    }
}

export default new UserService();