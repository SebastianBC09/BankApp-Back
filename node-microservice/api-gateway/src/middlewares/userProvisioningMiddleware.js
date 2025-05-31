import User from '../models/userModel.js';
import pgClient from '../config/postgresConnector.js'
import config from '../config/envConfig.js';

class UserProvisioningMiddleware {
  async provisionUser(req, res, next) {
    try {
      if (!req.auth?.payload?.sub) {
        console.error('[API Gateway - UserProvisioning] Error: req.auth.payload.sub (auth0Id) no encontrado.');
        return res.status(401).json({
          status: 'error',
          message: 'Token inválido: no se pudo identificar al usuario.',
        });
      }

      const auth0Id = req.auth.payload.sub;
      console.log(`[API Gateway - UserProvisioning] Procesando auth0Id: ${auth0Id}`);

      const provisionedUser = {
        auth0Id: auth0Id,
        email: req.auth.payload.email || null,
        mongoId: null,
        postgresId: null,
        firstName: req.auth.payload.given_name || null,
        lastName: req.auth.payload.family_name || null,
        status: 'pending',
        dataSourcesFound: [],
      };

      try {
        const pgQuery = `SELECT id, email, first_name, last_name, status FROM "${config.postgres.schema}".users WHERE auth0_id = $1`;
        const pgResult = await pgClient.query(pgQuery, [auth0Id]);

        if (pgResult.rows.length > 0) {
          const pgUser = pgResult.rows[0];
          console.log(`[API Gateway - UserProvisioning] Usuario encontrado en PostgreSQL. ID (Postgres): ${pgUser.id}`);
          provisionedUser.postgresId = pgUser.id;
          provisionedUser.email = pgUser.email;
          provisionedUser.firstName = pgUser.first_name;
          provisionedUser.lastName = pgUser.last_name;
          provisionedUser.status = pgUser.status;
          provisionedUser.dataSourcesFound.push('postgresql');
        } else {
          console.log(`[API Gateway - UserProvisioning] Usuario con auth0Id ${auth0Id} no encontrado en PostgreSQL.`);
        }
      } catch (pgError) {
        console.error('[API Gateway - UserProvisioning] Error al consultar PostgreSQL:', pgError);
      }

      try {
        const mongoUser = await User.findOne({ auth0Id }).lean();
        if (mongoUser) {
          console.log(`[API Gateway - UserProvisioning] Usuario encontrado en MongoDB. _id (Mongo): ${mongoUser._id}`);
          provisionedUser.mongoId = mongoUser._id.toString();
          provisionedUser.email = provisionedUser.email || mongoUser.email;
          provisionedUser.firstName = provisionedUser.firstName || mongoUser.firstName;
          provisionedUser.lastName = provisionedUser.lastName || mongoUser.lastName;
          provisionedUser.status = mongoUser.status || provisionedUser.status;
          if (!provisionedUser.dataSourcesFound.includes('mongodb')) {
            provisionedUser.dataSourcesFound.push('mongodb');
          }
        } else {
          console.log(`[API Gateway - UserProvisioning] Usuario con auth0Id ${auth0Id} no encontrado en MongoDB.`);
        }
      } catch (mongoError) {
        console.error('[API Gateway - UserProvisioning] Error al consultar MongoDB:', mongoError);
        if (mongoError.name === 'MongoNetworkError' || mongoError.name === 'MongoServerError') {
          return res.status(503).json({
            status: 'error',
            message: 'Error de conexión a la base de datos MongoDB. Intente más tarde.',
          });
        }
      }

      if (!provisionedUser.postgresId && !provisionedUser.mongoId) {
        console.error(`[API Gateway - UserProvisioning] Usuario no encontrado en ninguna base de datos para auth0Id: ${auth0Id}`);
        return res.status(403).json({
          status: 'error',
          message: 'Usuario no encontrado o no registrado en el sistema.',
        });
      }

      req.currentUser = {
        ...provisionedUser,
        _id: provisionedUser.mongoId,
      };

      console.log(`[API Gateway - UserProvisioning] Usuario procesado: MongoID='${req.currentUser.mongoId}', PostgresID='${req.currentUser.postgresId}'. Fuentes: ${req.currentUser.dataSourcesFound.join(', ')}`);
      next();
    } catch (error) {
      console.error(`[API Gateway - UserProvisioning] Error procesando usuario:`, error);
      if (!res.headersSent) {
        return res.status(500).json({
          status: 'error',
          message: 'Error interno al provisionar el usuario.',
        });
      }
      next(error);
    }
  }
}

const instance = new UserProvisioningMiddleware();
const provisionUserMiddleware = instance.provisionUser.bind(instance);

export { provisionUserMiddleware as provisionUser };
