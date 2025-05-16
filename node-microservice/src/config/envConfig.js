import dotenv from 'dotenv';

dotenv.config({ path: './.env' });

const config = {
    port: process.env.PORT || 3001,
    nodeEnv: process.env.NODE_ENV || 'development',
    mongo: {
        uri: process.env.MONGO_URI,
    },
    auth0: {
        domain: process.env.AUTH0_DOMAIN,
        audience: process.env.AUTH0_AUDIENCE,
    },
    urls: {
        baseUrlApi: process.env.BASE_URL_API || `http://localhost:${process.env.PORT || 3001}`,
        clientUrl: process.env.CLIENT_URL || 'http://localhost:4200',
    },
    cors: {
        origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : (process.env.CLIENT_URL || 'http://localhost:4200'),
    },
};

export default config;