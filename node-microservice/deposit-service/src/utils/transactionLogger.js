import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logFilePath = path.join(__dirname, '../../transaction_trace.txt');

const logOperation = async (logDetails) => {
  const timestamp = new Date().toISOString();
  const {
    userId = 'N/A',
    operationType,
    accountId = 'N/A',
    status,
    message = '',
    clientIp = 'N/A',
    amount = 'N/A',
    currency = 'N/A',
  } = logDetails;

  const logEntry = `TIMESTAMP: ${timestamp} | USER_ID: ${userId} | OPERATION: ${operationType} | ACCOUNT_ID: ${accountId} | AMOUNT: ${amount} | CURRENCY: ${currency} | STATUS: ${status} | IP: ${clientIp} | MESSAGE: ${message}\n`;

  try {
    await fs.appendFile(logFilePath, logEntry);
  } catch (error) {
    console.error('Error al escribir en el log de transacciones:', error);
  }
};

export { logOperation };
