import { auth } from 'express-oauth2-jwt-bearer';

class Auth0JwtValidator {
  constructor() {
      this.auth0Domain = process.env.AUTH0_DOMAIN;
      this.auth0Audience = process.env.AUTH0_AUDIENCE;

      if(!this.auth0Domain) {
          throw new Error('Error de configuración: AUTH0_DOMAIN no está definida en las variables de entorno. La aplicación no puede iniciar.')
      }

      if(!this.auth0Audience) {
          throw new Error('Error de configuración: AUTH0_AUDIENCE no está definida en las variables de entorno. La aplicación no puede iniciar.');
      }
  }

  getCheckJwtMiddleware() {
      return auth({
          audience: this.auth0Audience,
          issuerBaseURL: `https://${this.auth0Domain}/`,
          tokenSigningAlg: 'RS256'
      });
  }
}

const auth0ValidatorInstance = new Auth0JwtValidator();
const checkJwt = auth0ValidatorInstance.getCheckJwtMiddleware();

export { checkJwt };