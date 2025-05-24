import User from '../models/userModel.js';
import config from '../config/envConfig.js';

class UserProvisioningMiddleware {
  async provisionUser(req, res, next) {
    if (!req.auth || !req.auth.payload || !req.auth.payload.sub) {
      console.error(
        '[API Gateway - UserProvisioning] Error: req.auth.payload.sub (auth0Id) no encontrado.'
      );
      return res.status(401).json({
        status: 'error',
        message: 'No se pudo identificar al usuario desde el token en API Gateway.',
      });
    }

    const auth0Id = req.auth.payload.sub;
    const namespace = 'https://claims.bankapp.com/';

    try {
      let user = await User.findOne({ auth0Id });

      if (!user) {
        console.log(
          `[API Gateway - UserProvisioning] Usuario con auth0Id ${auth0Id} no encontrado. Creando nuevo usuario...`
        );
        const emailFromToken = req.auth.payload.email || req.auth.payload[`${namespace}email`];
        const firstNameFromToken =
          req.auth.payload.given_name || req.auth.payload[`${namespace}given_name`];
        const lastNameFromToken =
          req.auth.payload.family_name || req.auth.payload[`${namespace}family_name`];
        const emailVerifiedFromToken =
          req.auth.payload.email_verified || req.auth.payload[`${namespace}email_verified`];

        if (!emailFromToken && config.nodeEnv === 'development') {
          console.warn(
            `[API Gateway - UserProvisioning] Email no disponible en el token para auth0Id ${auth0Id}.`
          );
        }
        if ((!firstNameFromToken || !lastNameFromToken) && config.nodeEnv === 'development') {
          console.warn(
            `[API Gateway - UserProvisioning] Nombre o apellido no disponible en el token para auth0Id ${auth0Id}.`
          );
        }

        user = new User({
          auth0Id,
          email: emailFromToken,
          firstName: firstNameFromToken || 'Usuario',
          lastName: lastNameFromToken || 'BankApp',
          emailVerified: emailVerifiedFromToken === true,
        });
        await user.save();
        console.log(
          `[API Gateway - UserProvisioning] Nuevo usuario creado con _id: ${user._id} para auth0Id: ${auth0Id}`
        );
      } else {
        console.log(
          `[API Gateway - UserProvisioning] Usuario encontrado con _id: ${user._id} para auth0Id: ${auth0Id}`
        );
      }

      req.currentUser = user;
      return next();
    } catch (error) {
      console.error(`[API Gateway - UserProvisioning] Error procesando auth0Id ${auth0Id}:`, error);
      if (error.name === 'ValidationError') {
        return res.status(400).json({
          status: 'error',
          message: 'Error de validación al crear el perfil del usuario en API Gateway.',
          details: error.errors,
        });
      }

      if (!res.headersSent) {
        return res.status(500).json({
          status: 'error',
          message: 'Error interno en API Gateway al provisionar el usuario.',
        });
      }
    }
  }
}

const instance = new UserProvisioningMiddleware();
const provisionUserMiddleware = instance.provisionUser.bind(instance);

export { provisionUserMiddleware as provisionUser };
