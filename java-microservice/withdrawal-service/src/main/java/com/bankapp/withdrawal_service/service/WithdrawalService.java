package com.bankapp.withdrawal_service.service;

import com.bankapp.withdrawal_service.dto.AccountTransactionResponseDataDTO;
import com.bankapp.withdrawal_service.dto.ApiResponseDTO;

import java.math.BigDecimal;

public interface WithdrawalService {
    ApiResponseDTO<AccountTransactionResponseDataDTO> performWithdrawal(Long userId, BigDecimal amount, String clientIp);
}
