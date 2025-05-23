import User from '../models/userModel.js';

class UserProvisioningMiddleware {
  constructor() {}

  async provisionUser(req, res, next) {
    if (!req.auth || !req.auth.payload || !req.auth.payload.sub) {
      console.error(
        '[UserProvisioning] Error: req.auth.payload.sub (auth0Id) no encontrado. ¿El middleware checkJwt se ejecutó antes y fue exitoso?'
      );
      return res.status(401).json({
        status: 'error',
        message:
          'No se pudo identificar al usuario desde el token. Falta información de autenticación.',
      });
    }

    const auth0Id = req.auth.payload.sub;

    try {
      let user = await User.findOne(undefined, undefined, undefined);

      if (user) {
        console.log(
          `[UserProvisioning] Usuario encontrado para auth0Id ${auth0Id}: _id ${user._id}`
        );
      } else {
        console.log(
          `[UserProvisioning] Usuario con auth0Id ${auth0Id} no encontrado. Creando nuevo usuario...`
        );
        const emailFromToken =
          req.auth.payload.email || req.auth.payload['https://claims.bankapp.com/email']; // Ajusta el nombre del claim si usas namespace
        const firstNameFromToken =
          req.auth.payload.given_name || req.auth.payload['https://claims.bankapp.com/given_name'];
        const lastNameFromToken =
          req.auth.payload.family_name ||
          req.auth.payload['https://claims.bankapp.com/family_name'];
        const emailVerifiedFromToken =
          req.auth.payload.email_verified ||
          req.auth.payload['https://claims.bankapp.com/email_verified'];

        if (!firstNameFromToken || !lastNameFromToken) {
          console.warn(
            `[UserProvisioning] Nombre o apellido no disponible en el token para auth0Id ${auth0Id}. Se usarán placeholders o el modelo debe permitirlo.`
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
          `[UserProvisioning] Nuevo usuario creado con _id: ${user._id} para auth0Id: ${auth0Id}`
        );
      }

      req.currentUser = user;
      next();
    } catch (error) {
      console.error(`[UserProvisioning] Error procesando auth0Id ${auth0Id}:`, error);
      if (error.name === 'ValidationError') {
        return res.status(400).json({
          status: 'error',
          message: 'Error de validación al crear o actualizar el perfil del usuario.',
          details: error.errors,
        });
      }
      return res.status(500).json({
        status: 'error',
        message: 'Error interno del servidor al provisionar el usuario.',
      });
    }
  }
}

const instance = new UserProvisioningMiddleware();
const provisionUserMiddleware = instance.provisionUser.bind(instance);

export { provisionUserMiddleware as provisionUser };
