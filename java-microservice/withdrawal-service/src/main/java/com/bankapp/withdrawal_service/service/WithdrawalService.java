package com.bankapp.withdrawal_service.service;

import com.bankapp.withdrawal_service.dto.AccountTransactionResponseDataDTO;
import java.math.BigDecimal;

public interface WithdrawalService {
    AccountTransactionResponseDataDTO performWithdrawal(Long userId, BigDecimal amount, String clientIp);
}
