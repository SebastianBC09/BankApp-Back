package com.bankapp.deposit_service.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class AccountTransactionResponseDataDTO {
    private String message;
    private String accountId;
    private BigDecimal newBalance;
    private String currency;
    private BigDecimal amountProcessed;

}
