package com.bankapp.balance_service.utils;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.time.Instant;
import java.util.Objects;

public class TransactionLogger {
    private static final Logger traceLogger = LoggerFactory.getLogger("TransactionTraceLogger");

    private static void writeToTraceLog(String entry) {
        traceLogger.info(entry);
    }

    public static void logOperation(String userId, String operationType, String accountId, String status, String message, String clientIp) {
        String logEntry = String.format("TIMESTAMP: %s | USER_ID: %s | OPERATION: %s | ACCOUNT_ID: %s | STATUS: %s | IP: %s | MESSAGE: %s",
                Instant.now().toString(),
                Objects.toString(userId, "N/A"),
                operationType,
                Objects.toString(accountId, "N/A"),
                status,
                Objects.toString(clientIp, "N/A"),
                message);
        writeToTraceLog(logEntry);
    }
}
