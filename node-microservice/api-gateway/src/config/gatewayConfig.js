import dotenv from 'dotenv';
dotenv.config();

export default {
  port: process.env.GATEWAY_PORT || 3000,
  auth0_audience: process.env.AUTH0_AUDIENCE,
  auth0_domain: process.env.AUTH0_DOMAIN,
  balance_service_node_url: process.env.BALANCE_NODE_URL || 'http://localhost:3001',
  balance_service_java_url: process.env.BALANCE_JAVA_URL || 'http://localhost:8080',
  deposit_service_node_url: process.env.DEPOSIT_NODE_URL || 'http://localhost:3002',
  deposit_service_java_url: process.env.DEPOSIT_JAVA_URL || 'http://localhost:8081',
  withdrawal_service_node_url: process.env.WITHDRAWAL_NODE_URL || 'http://localhost:3003',
  withdrawal_service_java_url: process.env.WITHDRAWAL_JAVA_URL || 'http://localhost:8082',
};
