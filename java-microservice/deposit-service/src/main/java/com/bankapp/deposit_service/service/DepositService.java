package com.bankapp.deposit_service.service;

import com.bankapp.deposit_service.dto.AccountTransactionResponseDataDTO;
import java.math.BigDecimal;

public interface DepositService {
    AccountTransactionResponseDataDTO performDeposit(Long userId, BigDecimal amount, String clientIp);
}
