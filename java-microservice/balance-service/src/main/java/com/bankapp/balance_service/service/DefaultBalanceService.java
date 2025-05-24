package com.bankapp.balance_service.service;

import com.bankapp.balance_service.dto.AccountBalanceDataDTO;
import com.bankapp.balance_service.exception.AccountNotActiveException;
import com.bankapp.balance_service.exception.InvalidInputException;
import com.bankapp.balance_service.exception.ResourceNotFoundException;
import com.bankapp.balance_service.exception.UnauthorizedAccessException;
import com.bankapp.balance_service.model.Account;
import com.bankapp.balance_service.repository.AccountRepository;
import com.bankapp.balance_service.utils.TransactionLogger; // Correct import
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
    public AccountBalanceDataDTO getAccountBalance(Long accountId, Long userId, String clientIp) {
        String userIdForLog = userId != null ? String.valueOf(userId) : null;
        String accountIdForLog = accountId != null ? String.valueOf(accountId) : null;
        String operationStatus;
        String logMessage;

        serviceLog.info("Attempting balance inquiry for account {} by user {}.", accountIdForLog, userIdForLog);

        try {
            if (userId == null) {
                logMessage = "User ID not provided for balance inquiry (X-User-ID header might be missing or empty).";
                operationStatus = "INVALID_ATTEMPT";
                TransactionLogger.logOperation(null, "BALANCE_INQUIRY", accountIdForLog, operationStatus, logMessage, clientIp);
                throw new InvalidInputException(logMessage);
            }

            if (accountId == null) {
                logMessage = "Account ID not provided for balance inquiry.";
                operationStatus = "INVALID_ATTEMPT";
                TransactionLogger.logOperation(userIdForLog, "BALANCE_INQUIRY", null, operationStatus, logMessage, clientIp);
                throw new InvalidInputException(logMessage);
            }

            final String finalAccountIdForLog = String.valueOf(accountId);
            final String finalUserIdForLog = String.valueOf(userId);

            Account account = accountRepository.findByIdAndUserId(accountId, userId)
                    .orElseThrow(() -> {
                        boolean accountExistsButNotOwned = accountRepository.existsById(accountId);
                        if (accountExistsButNotOwned) {
                            return new UnauthorizedAccessException(String.format("Account %s does not belong to user %s. Access denied.", finalAccountIdForLog, finalUserIdForLog));
                        }
                        return new ResourceNotFoundException(String.format("Account %s not found for user %s.", finalAccountIdForLog, finalUserIdForLog));
                    });

            if (!"active".equalsIgnoreCase(account.getStatus()) && !"pending_activation".equalsIgnoreCase(account.getStatus())) {
                logMessage = String.format("Balance inquiry not permitted: Account %s is not active or pending activation. Current status: %s.", finalAccountIdForLog, account.getStatus());
                operationStatus = "FAILURE";
                TransactionLogger.logOperation(finalUserIdForLog, "BALANCE_INQUIRY", finalAccountIdForLog, operationStatus, logMessage, clientIp);
                throw new AccountNotActiveException(logMessage);
            }

            operationStatus = "SUCCESS";
            logMessage = String.format("Balance inquiry successful for account %s by user %s.", finalAccountIdForLog, finalUserIdForLog);
            TransactionLogger.logOperation(finalUserIdForLog, "BALANCE_INQUIRY", finalAccountIdForLog, operationStatus, logMessage, clientIp);

            return new AccountBalanceDataDTO(
                    account.getId(),
                    account.getAccountNumber(),
                    account.getAccountType(),
                    account.getBalance(),
                    account.getCurrency(),
                    account.getStatus()
            );

        } catch (Exception e) {

            if (!(e instanceof InvalidInputException ||
                    e instanceof ResourceNotFoundException ||
                    e instanceof UnauthorizedAccessException ||
                    e instanceof AccountNotActiveException)) {

                logMessage = "Unexpected error during balance inquiry: " + e.getMessage();
                TransactionLogger.logOperation(userIdForLog, "BALANCE_INQUIRY", accountIdForLog, "FAILURE", logMessage, clientIp);
                serviceLog.error("Unexpected error during balance inquiry for user {} and account {}: {}", userIdForLog, accountIdForLog, e.getMessage(), e);
            } else {

                serviceLog.warn("Operational error during balance inquiry for user {}: {} - Account: {}", userIdForLog, e.getMessage(), accountIdForLog);
            }
            throw e;
        }
    }
}