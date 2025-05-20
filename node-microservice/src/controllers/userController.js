import userService from '../services/userService.js';
import AppError from '../utils/appError.js';

class UserController {
    async completeMyProfile(req, res, next) {
        try {
            const userId = req.currentUser._id; // Obtenido del middleware provisionUser
            const profileData = req.body;
            const clientIp = req.ip || req.socket?.remoteAddress || req.connection?.remoteAddress;

            if (Object.keys(profileData).length === 0) {
                throw new AppError('No se proporcionaron datos de perfil para actualizar.', 400);
            }

            const result = await userService.completeUserProfileAndOpenAccount({
                userId,
                profileData,
                clientIp,
            });

            res.status(200).json({ // 200 OK porque se actualizó un recurso existente y se creó uno nuevo
                status: 'success',
                message: 'Perfil completado y cuenta inicial creada exitosamente.',
                data: result,
            });
        } catch (error) {
            next(error);
        }
    }
}

export default new UserController();