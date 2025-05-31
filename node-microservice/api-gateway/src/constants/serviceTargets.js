import dotenv from 'dotenv';
import config from '../config/gatewayConfig.js';
dotenv.config();

export const SERVICE_TARGETS = {
  balance: {
    node: config.balance_service_node_url || 'http://localhost:3001',
    pathRewriteNode: { '^/api/account/balance': '/' },
    java: config.balance_service_java_url || 'http://localhost:8080',
    pathRewriteJava: { '^/api/account/balance': '/' },
  },
  deposit: {
    node: config.deposit_service_node_url || 'http://localhost:3002',
    pathRewriteNode: { '^/api/account/deposit': '/' },
    java: config.deposit_service_java_url || 'http://localhost:8081',
    pathRewriteJava: { '^/api/account/balance': '/' },
  },
  withdraw: {
    node: config.withdrawal_service_node_url || 'http://localhost:3003',
    pathRewriteNode: { '^/api/account/withdraw': '/' },
    java: config.withdrawal_service_java_url || 'http://localhost:8082',
    pathRewriteJava: { '^/api/account/balance': '/' },
  },
};
