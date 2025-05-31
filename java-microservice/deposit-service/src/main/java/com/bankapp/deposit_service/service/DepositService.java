package com.bankapp.deposit_service.service;

import com.bankapp.deposit_service.dto.AccountTransactionResponseDataDTO;
import com.bankapp.deposit_service.dto.ApiResponseDTO;

import java.math.BigDecimal;

public interface DepositService {
    ApiResponseDTO<AccountTransactionResponseDataDTO> performDeposit(Long userId, BigDecimal amount, String clientIp);
}
