package com.bankapp.balance_service.service;

import com.bankapp.balance_service.dto.AccountBalanceDataDTO;
import com.bankapp.balance_service.exception.AccountNotActiveException;
import com.bankapp.balance_service.exception.InvalidInputException;
import com.bankapp.balance_service.exception.ResourceNotFoundException;
import com.bankapp.balance_service.exception.UnauthorizedAccessException;
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
    private static final Logger log = LoggerFactory.getLogger(DefaultBalanceService.class);

    @Autowired
    public DefaultBalanceService(AccountRepository accountRepository) {
        this.accountRepository = accountRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public AccountBalanceDataDTO getAccountBalance(Long accountId, Long userId, String clientIp) {
        String userIdForLog = (userId == null) ? "N/A" : String.valueOf(userId);
        String accountIdForLog = (accountId == null) ? "N/A" : String.valueOf(accountId);
        String operationStatus = "FAILURE";
        String logMessage = String.format("Attempting balance inquiry for account %s by user %s.", accountIdForLog, userIdForLog);

        try {
            if (userId == null) {
                logMessage = "User ID not provided for balance inquiry (X-User-ID header might be missing or empty).";
                operationStatus = "INVALID_ATTEMPT";
                TransactionLogger.logOperation(userIdForLog, "BALANCE_INQUIRY", accountIdForLog, operationStatus, logMessage, clientIp);
                throw new InvalidInputException(logMessage);
            }

            userIdForLog = String.valueOf(userId);

            if (accountId == null) {
                logMessage = "Account ID not provided for balance inquiry.";
                operationStatus = "INVALID_ATTEMPT";
                TransactionLogger.logOperation(userIdForLog, "BALANCE_INQUIRY", accountIdForLog, operationStatus, logMessage, clientIp);
                throw new InvalidInputException(logMessage);
            }
            accountIdForLog = String.valueOf(accountId);

            String finalAccountIdForLog = accountIdForLog;
            String finalUserIdForLog = userIdForLog;
            Account account = accountRepository.findByIdAndUserId(accountId, userId)
                    .orElseThrow(() -> {
                        boolean accountExistsButNotOwned = accountRepository.existsById(accountId);
                        if (accountExistsButNotOwned) {
                            return new UnauthorizedAccessException(String.format("Account %s does not belong to user %s. Access denied.", finalAccountIdForLog, finalUserIdForLog));
                        }
                        return new ResourceNotFoundException(String.format("Account %s not found for user %s.", finalAccountIdForLog, finalUserIdForLog));
                    });

            if (!"active".equalsIgnoreCase(account.getStatus()) && !"pending_activation".equalsIgnoreCase(account.getStatus())) {
                logMessage = String.format("Balance inquiry not permitted: Account %s is not active or pending activation. Current status: %s.", accountIdForLog, account.getStatus());
                operationStatus = "FAILURE"; // O "INVALID_OPERATION_ACCOUNT_STATUS"
                TransactionLogger.logOperation(userIdForLog, "BALANCE_INQUIRY", accountIdForLog, operationStatus, logMessage, clientIp);
                throw new AccountNotActiveException(logMessage);
            }

            operationStatus = "SUCCESS";
            logMessage = String.format("Balance inquiry successful for account %s by user %s.", accountIdForLog, userIdForLog);
            TransactionLogger.logOperation(userIdForLog, "BALANCE_INQUIRY", accountIdForLog, operationStatus, logMessage, clientIp);

            return new AccountBalanceDataDTO(
                    account.getId(),
                    account.getAccountNumber(),
                    account.getAccountType(),
                    account.getBalance(),
                    account.getCurrency(),
                    account.getStatus()
            );

        } catch (Exception e) {

            String finalLogMessage = (e instanceof InvalidInputException || e instanceof ResourceNotFoundException ||
                    e instanceof UnauthorizedAccessException || e instanceof AccountNotActiveException)
                    ? e.getMessage()
                    : "Unexpected error during balance inquiry: " + e.getMessage();

            String finalStatus = (e instanceof InvalidInputException || e instanceof ResourceNotFoundException ||
                    e instanceof UnauthorizedAccessException)
                    ? "INVALID_ATTEMPT"
                    : "FAILURE";

            if (!(e instanceof ResourceNotFoundException || e instanceof UnauthorizedAccessException || e instanceof AccountNotActiveException || e instanceof InvalidInputException)) {
                TransactionLogger.logOperation(userIdForLog, "BALANCE_INQUIRY", accountIdForLog, finalStatus, finalLogMessage, clientIp);
            } else if (operationStatus.equals("FAILURE") && !logMessage.contains("successful")) {
                log.error("Handled operational error during balance inquiry for user {}: {}", userIdForLog, e.getMessage());
            }
            throw e;
        }
    }
}
