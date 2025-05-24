package com.bankapp.deposit_service.service;

import com.bankapp.deposit_service.model.Account;
import com.bankapp.deposit_service.repository.AccountRepository;
import com.bankapp.deposit_service.dto.AccountTransactionResponseDataDTO;
import com.bankapp.deposit_service.exception.AccountNotActiveException;
import com.bankapp.deposit_service.exception.InvalidInputException;
import com.bankapp.deposit_service.exception.ResourceNotFoundException;
import com.bankapp.deposit_service.exception.UnauthorizedAccessException;
import com.bankapp.deposit_service.utils.TransactionLogger;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
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
    public AccountTransactionResponseDataDTO performDeposit(Long accountId, Long userId, BigDecimal amount, String clientIp) {
        String userIdForLog = Objects.toString(userId, "N/A");
        String accountIdForLog = Objects.toString(accountId, "N/A");
        String amountForLog = (amount != null) ? amount.toPlainString() : "N/A";

        String operationStatus = "FAILURE";
        String logMessage;

        serviceLog.info("Attempting deposit: userId={}, accountId={}, amount={}", userIdForLog, accountIdForLog, amountForLog);

        try {
            if (userId == null) {
                logMessage = "User ID not provided for deposit.";
                operationStatus = "INVALID_ATTEMPT";
                TransactionLogger.logOperation(userIdForLog, "DEPOSIT", accountIdForLog, operationStatus, logMessage, clientIp);
                throw new InvalidInputException(logMessage);
            }

            if (accountId == null) {
                logMessage = "Account ID not provided for deposit.";
                operationStatus = "INVALID_ATTEMPT";
                TransactionLogger.logOperation(userIdForLog, "DEPOSIT", accountIdForLog, operationStatus, logMessage, clientIp);
                throw new InvalidInputException(logMessage);
            }

            if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
                logMessage = String.format("Invalid deposit amount: %s. Amount must be positive.", amountForLog);
                operationStatus = "INVALID_ATTEMPT";
                TransactionLogger.logOperation(userIdForLog, "DEPOSIT", accountIdForLog, operationStatus, logMessage, clientIp);
                throw new InvalidInputException(logMessage);
            }

            Account account = accountRepository.findByIdAndUserId(accountId, userId)
                    .orElseThrow(() -> {
                        boolean accountExistsButNotOwned = accountRepository.existsById(accountId);
                        if (accountExistsButNotOwned) {
                            return new UnauthorizedAccessException(String.format("Account %s does not belong to user %s. Deposit denied.", accountIdForLog, userIdForLog));
                        }
                        return new ResourceNotFoundException(String.format("Account %s not found for deposit for user %s.", accountIdForLog, userIdForLog));
                    });

            if (!"active".equalsIgnoreCase(account.getStatus())) {
                logMessage = String.format("Deposit failed: Account %s is not active. Current status: %s.", accountIdForLog, account.getStatus());
                operationStatus = "FAILURE";
                TransactionLogger.logTransaction(userIdForLog, "DEPOSIT", accountIdForLog, amountForLog, account.getCurrency(), operationStatus, logMessage, clientIp);
                throw new AccountNotActiveException(logMessage);
            }

            BigDecimal currentBalance = account.getBalance();
            BigDecimal newBalance = currentBalance.add(amount);
            account.setBalance(newBalance);
            accountRepository.save(account);

            operationStatus = "SUCCESS";
            logMessage = String.format("Deposit of %s %s successful into account %s by user %s. New balance: %s.",
                    amountForLog, account.getCurrency(), accountIdForLog, userIdForLog, newBalance.toPlainString());

            TransactionLogger.logTransaction(userIdForLog, "DEPOSIT", accountIdForLog, amountForLog, account.getCurrency(), operationStatus, logMessage, clientIp);

            return new AccountTransactionResponseDataDTO(
                    "Deposit successful.",
                    account.getId().toString(),
                    newBalance,
                    account.getCurrency(),
                    amount
            );

        } catch (Exception e) {
            String currencyForErrorLog = "N/A";
            if (!(e instanceof ResourceNotFoundException || e instanceof UnauthorizedAccessException && e.getMessage().contains("not found"))) {
            }


            if (!(e instanceof InvalidInputException ||
                    e instanceof ResourceNotFoundException ||
                    e instanceof UnauthorizedAccessException ||
                    e instanceof AccountNotActiveException)) {

                logMessage = "Unexpected error during deposit: " + e.getMessage();
                operationStatus = "FAILURE";

                TransactionLogger.logTransaction(userIdForLog, "DEPOSIT", accountIdForLog, amountForLog, currencyForErrorLog, operationStatus, logMessage, clientIp);
                serviceLog.error("Unexpected error during deposit for user {} and account {}: {}", userIdForLog, accountIdForLog, e.getMessage(), e);
            } else {

                serviceLog.warn("Controlled exception during deposit for user {}: {}", userIdForLog, e.getMessage());
            }
            throw e;
        }
    }
}
