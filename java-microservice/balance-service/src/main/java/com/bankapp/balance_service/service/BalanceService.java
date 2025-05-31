package com.bankapp.balance_service.service;

import com.bankapp.balance_service.dto.AccountBalanceDataDTO;

public interface BalanceService {
    AccountBalanceDataDTO getAccountBalance(Long userId, String clientIp);
}
