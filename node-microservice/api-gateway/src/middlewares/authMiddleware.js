import { auth } from 'express-oauth2-jwt-bearer';
import config from '../config/envConfig.js';

class Auth0JwtValidator {
  constructor() {
    this.auth0Domain = config.auth0.domain;
    this.auth0Audience = config.auth0.audience;

    if (!this.auth0Domain) {
      throw new Error(
        'Error de configuración: auth0.domain no está definido en envConfig. La aplicación no puede iniciar.'
      );
    }
    if (!this.auth0Audience) {
      throw new Error(
        'Error de configuración: auth0.audience no está definido en envConfig. La aplicación no puede iniciar.'
      );
    }
  }

  getCheckJwtMiddleware() {
    return auth({
      audience: this.auth0Audience,
      issuerBaseURL: `https://${this.auth0Domain}/`,
      tokenSigningAlg: 'RS256',
    });
  }
}

const auth0ValidatorInstance = new Auth0JwtValidator();
const checkJwt = auth0ValidatorInstance.getCheckJwtMiddleware();

export { checkJwt };
