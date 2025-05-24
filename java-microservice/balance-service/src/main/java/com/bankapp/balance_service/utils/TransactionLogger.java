package com.bankapp.balance_service.utils;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.Instant;

public class TransactionLogger {
    private static final Logger logger = LoggerFactory.getLogger(TransactionLogger.class);

    private static void writeLog(String entry) {
        logger.info("[TRANSACTION_TRACE] {}", entry);
    }

    public static void logTransaction(String userId, String operationType, String accountId, String amount, String currency, String status, String message, String clientIp) {
        String logEntry = String.format("TIMESTAMP: %s | USER_ID: %s | OPERATION: %s | ACCOUNT_ID: %s | AMOUNT: %s | CURRENCY: %s | STATUS: %s | IP: %s | MESSAGE: %s",
                Instant.now().toString(),
                userId == null ? "N/A" : userId,
                operationType,
                accountId == null ? "N/A" : accountId,
                amount == null ? "N/A" : amount,
                currency == null ? "N/A" : currency,
                status,
                clientIp == null ? "N/A" : clientIp,
                message);
        writeLog(logEntry);
    }

    public static void logOperation(String userId, String operationType, String accountId, String status, String message, String clientIp) {
        String logEntry = String.format("TIMESTAMP: %s | USER_ID: %s | OPERATION: %s | ACCOUNT_ID: %s | STATUS: %s | IP: %s | MESSAGE: %s",
                Instant.now().toString(),
                userId == null ? "N/A" : userId,
                operationType,
                accountId == null ? "N/A" : accountId,
                status,
                clientIp == null ? "N/A" : clientIp,
                message);
        writeLog(logEntry);
    }
}
