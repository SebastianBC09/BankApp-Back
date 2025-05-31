package com.bankapp.deposit_service.service;

import com.bankapp.deposit_service.dto.ApiResponseDTO;
import com.bankapp.deposit_service.model.Account;
import com.bankapp.deposit_service.repository.AccountRepository;
import com.bankapp.deposit_service.dto.AccountTransactionResponseDataDTO;
import com.bankapp.deposit_service.exception.AccountNotActiveException;
import com.bankapp.deposit_service.exception.InvalidInputException;
import com.bankapp.deposit_service.exception.ResourceNotFoundException;
import com.bankapp.deposit_service.utils.TransactionLogger;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Objects;

@Service
public class DefaultDepositService implements DepositService{
    private final AccountRepository accountRepository;
    private static final Logger serviceLog = LoggerFactory.getLogger(DefaultDepositService.class);

    @Autowired
    public DefaultDepositService(AccountRepository accountRepository) {
        this.accountRepository = accountRepository;
    }

    @Override
    @Transactional
    public ApiResponseDTO<AccountTransactionResponseDataDTO> performDeposit(Long userId, BigDecimal amount, String clientIp) {
        String userIdForLog = Objects.toString(userId, "N/A_IN_SERVICE");
        String amountForLog = (amount != null) ? amount.toPlainString() : "N/A";
        String accountIdForLog = "N/A_UNTIL_FETCHED";
        Account account = null;

        String operationStatus;
        String logMessage;

        serviceLog.info("Attempting deposit: userId={}, amount={}", userIdForLog, amountForLog);

        try {
            if (userId == null) {
                logMessage = "User ID not provided for deposit (X-User-ID header may be missing).";
                operationStatus = "INVALID_ATTEMPT";
                TransactionLogger.logTransaction(userIdForLog, "DEPOSIT", accountIdForLog, amountForLog, "N/A", operationStatus, logMessage, clientIp);
                throw new InvalidInputException(logMessage);
            }

            if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
                logMessage = String.format("Invalid deposit amount: %s. Amount must be positive.", amountForLog);
                operationStatus = "INVALID_ATTEMPT";
                TransactionLogger.logTransaction(userIdForLog, "DEPOSIT", accountIdForLog, amountForLog, "N/A", operationStatus, logMessage, clientIp);
                throw new InvalidInputException(logMessage);
            }

            final String initialAccountIdForLog = accountIdForLog;
            account = accountRepository.findByUserId(userId)
                    .orElseThrow(() -> {
                        String msg = String.format("No account found for user %s to perform deposit.", userIdForLog);
                        TransactionLogger.logTransaction(userIdForLog, "DEPOSIT", initialAccountIdForLog, amountForLog, "N/A", "ACCOUNT_NOT_FOUND", msg, clientIp);
                        return new ResourceNotFoundException(msg);
                    });

            accountIdForLog = account.getId().toString();

            if (!"active".equalsIgnoreCase(account.getStatus())) {
                logMessage = String.format("Deposit failed: Account %s (User: %s) is not active. Current status: %s.",
                        accountIdForLog, userIdForLog, account.getStatus());
                operationStatus = "ACCOUNT_INACTIVE";
                TransactionLogger.logTransaction(userIdForLog, "DEPOSIT", accountIdForLog, amountForLog, account.getCurrency(), operationStatus, logMessage, clientIp);
                throw new AccountNotActiveException(logMessage);
            }

            BigDecimal currentBalance = account.getBalance();
            BigDecimal newBalance = currentBalance.add(amount);
            account.setBalance(newBalance);
            accountRepository.save(account);

            operationStatus = "SUCCESS";
            logMessage = String.format("Deposit of %s %s successful into account %s (User: %s, AccountNumber: %s). New balance: %s.",
                    amountForLog, account.getCurrency(), accountIdForLog, userIdForLog, account.getAccountNumber(), newBalance.toPlainString());

            TransactionLogger.logTransaction(userIdForLog, "DEPOSIT", accountIdForLog, amountForLog, account.getCurrency(), operationStatus, logMessage, clientIp);

            AccountTransactionResponseDataDTO dataDto = AccountTransactionResponseDataDTO.builder()
                    .message("El depósito en la cuenta PostgreSQL fue completado.")
                    .accountId(accountIdForLog)
                    .accountNumber(account.getAccountNumber())
                    .newBalance(newBalance)
                    .currency(account.getCurrency())
                    .amountDeposited(amount)
                    .transactionId("pg_txn_dep_" + System.currentTimeMillis())
                    .transactionTimestamp(Instant.now().toString())
                    .build();

            return ApiResponseDTO.success(dataDto, "Depósito procesado exitosamente desde Java.");

        } catch (Exception e) {
            if (!(e instanceof InvalidInputException ||
                    e instanceof ResourceNotFoundException ||
                    e instanceof AccountNotActiveException)) {

                logMessage = "Unexpected error during deposit for user " + userIdForLog + ": " + e.getMessage();
                String currencyForErrorLog = "N/A";
                if (account != null) {
                    currencyForErrorLog = account.getCurrency();
                }

                TransactionLogger.logTransaction(userIdForLog, "DEPOSIT",
                        accountIdForLog.equals("N/A_UNTIL_FETCHED") ? null : accountIdForLog,
                        amountForLog, currencyForErrorLog, "SYSTEM_ERROR", logMessage, clientIp);
                serviceLog.error("Unexpected error during deposit for user {}: {}", userIdForLog, e.getMessage(), e);
            } else {
                serviceLog.warn("Controlled exception during deposit for user {}: {}", userIdForLog, e.getMessage());
            }
            throw e;
        }
    }
}
