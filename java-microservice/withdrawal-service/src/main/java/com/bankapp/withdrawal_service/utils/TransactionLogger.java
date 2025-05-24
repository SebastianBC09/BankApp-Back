package com.bankapp.withdrawal_service.utils;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.Instant;

public class TransactionLogger {
    private static final Logger logger = LoggerFactory.getLogger(TransactionLogger.class);
    public static void log(String userId, String operationType, String accountId, String amount, String currency, String status, String message, String clientIp) {
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
        logger.info("[TRANSACTION_TRACE] {}", logEntry);
    }
}
