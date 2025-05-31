package com.bankapp.withdrawal_service.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class AccountTransactionResponseDataDTO {
    private String message;
    private String accountId;
    private String accountNumber;
    @JsonFormat(shape = JsonFormat.Shape.STRING)
    private BigDecimal newBalance;
    private String currency;
    @JsonFormat(shape = JsonFormat.Shape.STRING)
    private BigDecimal amountDeposited;
    @JsonFormat(shape = JsonFormat.Shape.STRING)
    private BigDecimal amountWithdrawn;
    private String transactionId;
    private String transactionTimestamp;
}
