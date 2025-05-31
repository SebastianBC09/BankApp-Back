package com.bankapp.deposit_service.utils;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.Instant;
import java.util.Objects;

public class TransactionLogger {
    private static final Logger traceLogger = LoggerFactory.getLogger("TransactionTraceLogger");

    private static void writeToTraceLog(String entry) {

        traceLogger.info(entry);
    }

    public static void logTransaction(
            String userId,
            String operationType,
            String accountId,
            String amount,
            String currency,
            String status,
            String message,
            String clientIp) {
        String logEntry = String.format("TIMESTAMP: %s | USER_ID: %s | OPERATION: %s | ACCOUNT_ID: %s | AMOUNT: %s | CURRENCY: %s | STATUS: %s | IP: %s | MESSAGE: %s",
                Instant.now().toString(),
                Objects.toString(userId, "N/A"),
                Objects.toString(operationType, "N/A"),
                Objects.toString(accountId, "N/A"),
                Objects.toString(amount, "N/A"),
                Objects.toString(currency, "N/A"),
                Objects.toString(status, "N/A"),
                Objects.toString(clientIp, "N/A"),
                message);
        writeToTraceLog(logEntry);
    }
}
