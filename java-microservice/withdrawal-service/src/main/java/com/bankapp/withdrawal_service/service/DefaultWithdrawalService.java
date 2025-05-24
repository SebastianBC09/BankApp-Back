package com.bankapp.withdrawal_service.service;

import com.bankapp.withdrawal_service.dto.AccountTransactionResponseDataDTO;
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

@Service
public class DefaultWithdrawalService implements WithdrawalService {
    private final AccountRepository accountRepository;
    private static final Logger log = LoggerFactory.getLogger(DefaultWithdrawalService.class);

    @Autowired
    public DefaultWithdrawalService(AccountRepository accountRepository) {
        this.accountRepository = accountRepository;
    }

    @Override
    @Transactional
    public AccountTransactionResponseDataDTO performWithdrawal(Long accountId, Long userId, BigDecimal amount, String clientIp) {
        String operationStatus = "FAILURE";
        String logMessage = String.format("Attempting withdrawal of %s from account %d by user %d.", amount, accountId, userId);
        String amountStringForLog = amount != null ? amount.toPlainString() : "N/A";
        String userIdForLog = userId != null ? String.valueOf(userId) : "N/A";
        String accountIdForLog = accountId != null ? String.valueOf(accountId) : "N/A";

        try {
            if (userId == null) {
                logMessage = "User ID not provided for withdrawal.";
                operationStatus = "INVALID_ATTEMPT";
                TransactionLogger.log(userIdForLog, "WITHDRAWAL", accountIdForLog, amountStringForLog, "N/A", operationStatus, logMessage, clientIp);
                throw new InvalidInputException(logMessage);
            }

            if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
                logMessage = String.format("Invalid withdrawal amount: %s. Amount must be positive.", amount);
                operationStatus = "INVALID_ATTEMPT";
                TransactionLogger.log(userIdForLog, "WITHDRAWAL", accountIdForLog, amountStringForLog, "N/A", operationStatus, logMessage, clientIp);
                throw new InvalidInputException(logMessage);
            }

            Account account = accountRepository.findByIdAndUserId(accountId, userId)
                    .orElseThrow(() -> {
                        boolean accountExistsButNotOwned = accountRepository.existsById(accountId);
                        if (accountExistsButNotOwned) {
                            return new UnauthorizedAccessException(String.format("Account %d does not belong to user %d. Withdrawal denied.", accountId, userId));
                        }
                        return new ResourceNotFoundException(String.format("Account %d not found for withdrawal for user %d.", accountId, userId));
                    });

            if (!"active".equalsIgnoreCase(account.getStatus())) {
                logMessage = String.format("Withdrawal failed: Account %d is not active. Current status: %s.", accountId, account.getStatus());
                operationStatus = "FAILURE";
                TransactionLogger.log(userIdForLog, "WITHDRAWAL", accountIdForLog, amountStringForLog, account.getCurrency(), operationStatus, logMessage, clientIp);
                throw new AccountNotActiveException(logMessage);
            }

            BigDecimal currentBalance = account.getBalance();
            if (currentBalance.compareTo(amount) < 0) {
                logMessage = String.format("Withdrawal failed: Insufficient funds in account %d. Balance: %s, Requested: %s.",
                        accountId, currentBalance.toPlainString(), amount.toPlainString());
                operationStatus = "FAILURE";
                TransactionLogger.log(userIdForLog, "WITHDRAWAL", accountIdForLog, amountStringForLog, account.getCurrency(), operationStatus, logMessage, clientIp);
                throw new InsufficientFundsException(logMessage);
            }

            BigDecimal newBalance = currentBalance.subtract(amount);
            account.setBalance(newBalance);
            accountRepository.save(account);

            operationStatus = "SUCCESS";
            logMessage = String.format("Withdrawal of %s %s successful from account %d by user %d. New balance: %s.",
                    amount.toPlainString(), account.getCurrency(), accountId, userId, newBalance.toPlainString());

            TransactionLogger.log(userIdForLog, "WITHDRAWAL", accountIdForLog, amount.toPlainString(), account.getCurrency(), operationStatus, logMessage, clientIp);

            return new AccountTransactionResponseDataDTO(
                    "Withdrawal successful.",
                    account.getId().toString(),
                    newBalance,
                    account.getCurrency(),
                    amount
            );

        } catch (Exception e) {
            if (!"SUCCESS".equals(operationStatus)) {
                logMessage = e.getMessage();
                TransactionLogger.log(userIdForLog, "WITHDRAWAL", accountIdForLog, amountStringForLog, "N/A", operationStatus, logMessage, clientIp);
            }
            throw e;
        }
    }
}
