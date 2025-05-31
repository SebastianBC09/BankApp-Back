package com.bankapp.balance_service.service;

import com.bankapp.balance_service.dto.AccountBalanceDataDTO;
import com.bankapp.balance_service.exception.AccountNotActiveException;
import com.bankapp.balance_service.exception.InvalidInputException;
import com.bankapp.balance_service.exception.ResourceNotFoundException;
import com.bankapp.balance_service.model.Account;
import com.bankapp.balance_service.repository.AccountRepository;
import com.bankapp.balance_service.utils.TransactionLogger;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class DefaultBalanceService implements BalanceService {
    private final AccountRepository accountRepository;
    private static final Logger serviceLog = LoggerFactory.getLogger(DefaultBalanceService.class);

    @Autowired
    public DefaultBalanceService(AccountRepository accountRepository) {
        this.accountRepository = accountRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public AccountBalanceDataDTO getAccountBalance(Long userId, String clientIp) {
        String userIdForLog = userId != null ? String.valueOf(userId) : "N/A_IN_SERVICE";
        String accountIdForLog = "N/A_UNTIL_FETCHED";
        String operationStatus;
        String logMessage;

        serviceLog.info("Attempting balance inquiry for user {}.", userIdForLog);

        try {
            if (userId == null) {
                logMessage = "User ID not provided for balance inquiry (X-User-ID header might be missing or empty).";
                operationStatus = "INVALID_ATTEMPT";
                TransactionLogger.logOperation(userIdForLog, "BALANCE_INQUIRY", null, operationStatus, logMessage, clientIp);
                throw new InvalidInputException(logMessage);
            }

            final String finalUserIdForLog = String.valueOf(userId);

            Account account = accountRepository.findByUserId(userId)
                    .orElseThrow(() -> {
                        String msg = String.format("No account found for user %s.", finalUserIdForLog);
                        TransactionLogger.logOperation(finalUserIdForLog, "BALANCE_INQUIRY", "N/A_ACCOUNT_NOT_FOUND", "ACCOUNT_NOT_FOUND", msg, clientIp);
                        return new ResourceNotFoundException(msg);
                    });

            accountIdForLog = String.valueOf(account.getId());

            if (!"active".equalsIgnoreCase(account.getStatus()) && !"pending_activation".equalsIgnoreCase(account.getStatus())) {
                logMessage = String.format("Balance inquiry not permitted: Account %s (User: %s) is not active or pending activation. Current status: %s.",
                        accountIdForLog, finalUserIdForLog, account.getStatus());
                operationStatus = "ACCOUNT_INACTIVE";
                TransactionLogger.logOperation(finalUserIdForLog, "BALANCE_INQUIRY", accountIdForLog, operationStatus, logMessage, clientIp);
                throw new AccountNotActiveException(logMessage);
            }

            operationStatus = "SUCCESS";
            logMessage = String.format("Balance inquiry successful for account %s of user %s.", accountIdForLog, finalUserIdForLog);
            TransactionLogger.logOperation(finalUserIdForLog, "BALANCE_INQUIRY", accountIdForLog, operationStatus, logMessage, clientIp);

            return new AccountBalanceDataDTO(
                    account.getId(),
                    account.getAccountNumber(),
                    account.getAccountType(),
                    account.getBalance(),
                    account.getCurrency(),
                    account.getStatus()
            );

        } catch (Exception e) {
            if (e instanceof InvalidInputException ||
                    e instanceof ResourceNotFoundException ||
                    e instanceof AccountNotActiveException) {
                serviceLog.warn("Operational error during balance inquiry for user {}: {}", userIdForLog, e.getMessage());
            } else {
                logMessage = "Unexpected error during balance inquiry for user " + userIdForLog + ": " + e.getMessage();
                TransactionLogger.logOperation(userIdForLog, "BALANCE_INQUIRY", accountIdForLog.equals("N/A_UNTIL_FETCHED") ? null : accountIdForLog, "SYSTEM_ERROR", logMessage, clientIp);
                serviceLog.error("Unexpected error during balance inquiry for user {}: {}", userIdForLog, e.getMessage(), e);
            }
            throw e;
        }
    }
}