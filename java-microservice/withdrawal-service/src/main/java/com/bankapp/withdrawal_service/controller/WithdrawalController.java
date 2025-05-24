package com.bankapp.withdrawal_service.controller;

import com.bankapp.deposit_service.dto.AmountRequestDTO;
import com.bankapp.withdrawal_service.dto.AccountTransactionResponseDataDTO;
import com.bankapp.withdrawal_service.dto.ApiResponseDTO;
import com.bankapp.withdrawal_service.exception.InvalidInputException;
import com.bankapp.withdrawal_service.service.WithdrawalService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/account/withdraw")
public class WithdrawalController {
    private final WithdrawalService withdrawalService;

    @Autowired
    public WithdrawalController(WithdrawalService withdrawalService) {
        this.withdrawalService = withdrawalService;
    }

    @PostMapping("/{accountId}")
    public ResponseEntity<ApiResponseDTO<AccountTransactionResponseDataDTO>> handleWithdrawal(
            @PathVariable Long accountId,
            @RequestHeader("X-User-ID") String userIdString,
            @Valid @RequestBody AmountRequestDTO amountRequest,
            HttpServletRequest request) {

        long userId;
        try {
            if (userIdString == null || userIdString.trim().isEmpty()) {
                throw new InvalidInputException("X-User-ID header is missing or empty.");
            }
            userId = Long.parseLong(userIdString);
        } catch (NumberFormatException e) {
            throw new InvalidInputException("X-User-ID header contains an invalid user ID format.");
        }

        if (amountRequest == null || amountRequest.getAmount() == null) {
            throw new InvalidInputException("Request body or amount field is missing.");
        }

        String clientIp = request.getHeader("X-Forwarded-For");
        if (clientIp == null || clientIp.isEmpty() || "unknown".equalsIgnoreCase(clientIp)) {
            clientIp = request.getRemoteAddr();
        } else {
            clientIp = clientIp.split(",")[0].trim();
        }

        AccountTransactionResponseDataDTO withdrawalResponse = withdrawalService.performWithdrawal(
                accountId,
                userId,
                amountRequest.getAmount(),
                clientIp
        );

        return ResponseEntity.ok(ApiResponseDTO.success(withdrawalResponse));
    }
}
