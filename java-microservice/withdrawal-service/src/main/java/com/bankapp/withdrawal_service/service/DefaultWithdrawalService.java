package com.bankapp.withdrawal_service.service;

import com.bankapp.withdrawal_service.dto.AccountTransactionResponseDataDTO;
import com.bankapp.withdrawal_service.dto.ApiResponseDTO;
import com.bankapp.withdrawal_service.exception.*;
import com.bankapp.withdrawal_service.model.Account;
import com.bankapp.withdrawal_service.repository.AccountRepository;
import com.bankapp.withdrawal_service.utils.TransactionLogger;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Objects;

@Service
public class DefaultWithdrawalService implements WithdrawalService {
    private final AccountRepository accountRepository;
    private static final Logger serviceLog = LoggerFactory.getLogger(DefaultWithdrawalService.class);

    @Autowired
    public DefaultWithdrawalService(AccountRepository accountRepository) {
        this.accountRepository = accountRepository;
    }

    @Override
    @Transactional
    public ApiResponseDTO<AccountTransactionResponseDataDTO> performWithdrawal(Long userId, BigDecimal amount, String clientIp) {
        String userIdForLog = Objects.toString(userId, "N/A_IN_SERVICE");
        String amountForLog = (amount != null) ? amount.toPlainString() : "N/A";
        String accountIdForLog = "N/A_UNTIL_FETCHED";
        Account account = null;

        String operationStatus;
        String logMessage;

        serviceLog.info("Attempting withdrawal: userId={}, amount={}", userIdForLog, amountForLog);

        try {
            if (userId == null) {
                logMessage = "User ID not provided for withdrawal (X-User-ID header may be missing).";
                operationStatus = "INVALID_ATTEMPT";
                TransactionLogger.logTransaction(userIdForLog, "WITHDRAWAL", accountIdForLog, amountForLog, "N/A", operationStatus, logMessage, clientIp);
                throw new InvalidInputException(logMessage);
            }

            if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
                logMessage = String.format("Invalid withdrawal amount: %s. Amount must be positive.", amountForLog);
                operationStatus = "INVALID_ATTEMPT";
                TransactionLogger.logTransaction(userIdForLog, "WITHDRAWAL", accountIdForLog, amountForLog, "N/A", operationStatus, logMessage, clientIp);
                throw new InvalidInputException(logMessage);
            }

            final String initialAccountIdForLog = accountIdForLog;
            account = accountRepository.findByUserId(userId)
                    .orElseThrow(() -> {
                        String msg = String.format("No account found for user %s to perform withdrawal.", userIdForLog);
                        TransactionLogger.logTransaction(userIdForLog, "WITHDRAWAL", initialAccountIdForLog, amountForLog, "N/A", "ACCOUNT_NOT_FOUND", msg, clientIp);
                        return new ResourceNotFoundException(msg);
                    });

            accountIdForLog = account.getId().toString();

            if (!"active".equalsIgnoreCase(account.getStatus())) {
                logMessage = String.format("Withdrawal failed: Account %s (User: %s) is not active. Current status: %s.",
                        accountIdForLog, userIdForLog, account.getStatus());
                operationStatus = "ACCOUNT_INACTIVE";
                TransactionLogger.logTransaction(userIdForLog, "WITHDRAWAL", accountIdForLog, amountForLog, account.getCurrency(), operationStatus, logMessage, clientIp);
                throw new AccountNotActiveException(logMessage);
            }

            BigDecimal currentBalance = account.getBalance();
            if (currentBalance.compareTo(amount) < 0) {
                logMessage = String.format("Withdrawal failed: Insufficient funds in account %s (User: %s). Balance: %s, Requested: %s.",
                        accountIdForLog, userIdForLog, currentBalance.toPlainString(), amountForLog);
                operationStatus = "INSUFFICIENT_FUNDS";
                TransactionLogger.logTransaction(userIdForLog, "WITHDRAWAL", accountIdForLog, amountForLog, account.getCurrency(), operationStatus, logMessage, clientIp);
                throw new InsufficientFundsException(logMessage);
            }

            BigDecimal newBalance = currentBalance.subtract(amount);
            account.setBalance(newBalance);
            accountRepository.save(account);

            operationStatus = "SUCCESS";
            logMessage = String.format("Withdrawal of %s %s successful from account %s (User: %s, AccountNumber: %s). New balance: %s.",
                    amountForLog, account.getCurrency(), accountIdForLog, userIdForLog, account.getAccountNumber(), newBalance.toPlainString());

            TransactionLogger.logTransaction(userIdForLog, "WITHDRAWAL", accountIdForLog, amountForLog, account.getCurrency(), operationStatus, logMessage, clientIp);

            AccountTransactionResponseDataDTO dataDto = AccountTransactionResponseDataDTO.builder()
                    .message("El retiro de la cuenta PostgreSQL fue completado.")
                    .accountId(accountIdForLog)
                    .accountNumber(account.getAccountNumber())
                    .newBalance(newBalance)
                    .currency(account.getCurrency())
                    .amountWithdrawn(amount)
                    .transactionId("pg_txn_wdr_" + System.currentTimeMillis())
                    .transactionTimestamp(Instant.now().toString())
                    .build();

            return ApiResponseDTO.success(dataDto, "Retiro procesado exitosamente desde Java.");

        } catch (Exception e) {
            if (!(e instanceof InvalidInputException ||
                    e instanceof ResourceNotFoundException ||
                    e instanceof AccountNotActiveException ||
                    e instanceof InsufficientFundsException)) {

                logMessage = "Unexpected error during withdrawal for user " + userIdForLog + ": " + e.getMessage();
                String currencyForErrorLog = "N/A";
                if (account != null) {
                    currencyForErrorLog = account.getCurrency();
                }

                TransactionLogger.logTransaction(userIdForLog, "WITHDRAWAL",
                        accountIdForLog.equals("N/A_UNTIL_FETCHED") ? null : accountIdForLog,
                        amountForLog, currencyForErrorLog, "SYSTEM_ERROR", logMessage, clientIp);
                serviceLog.error("Unexpected error during withdrawal for user {}: {}", userIdForLog, e.getMessage(), e);
            } else {
                serviceLog.warn("Controlled exception during withdrawal for user {}: {}", userIdForLog, e.getMessage());
            }
            throw e;
        }
    }
}
