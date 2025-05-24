package com.bankapp.balance_service.controller;

import com.bankapp.balance_service.dto.AccountBalanceDataDTO;
import com.bankapp.balance_service.dto.ApiResponseDTO;
import com.bankapp.balance_service.exception.InvalidInputException;

import com.bankapp.balance_service.service.DefaultBalanceService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/account/balance")
public class BalanceController {
    private final DefaultBalanceService balanceService;

    @Autowired
    public BalanceController(DefaultBalanceService balanceService) {
        this.balanceService = balanceService;
    }

    @GetMapping("/{accountId}")
    public ResponseEntity<ApiResponseDTO<AccountBalanceDataDTO>> getAccountBalance(
            @PathVariable Long accountId,
            @RequestHeader("X-User-ID") String userIdString,
            HttpServletRequest request) {

        Long userId;
        try {
            if (userIdString == null || userIdString.trim().isEmpty()) {
                throw new InvalidInputException("X-User-ID header is missing or empty.");
            }
            userId = Long.parseLong(userIdString);
        } catch (NumberFormatException e) {
            throw new InvalidInputException("X-User-ID header contains an invalid user ID format.");
        }

        String clientIp = request.getHeader("X-Forwarded-For");
        if (clientIp == null || clientIp.isEmpty() || "unknown".equalsIgnoreCase(clientIp)) {
            clientIp = request.getRemoteAddr();
        } else {
            clientIp = clientIp.split(",")[0].trim();
        }

        AccountBalanceDataDTO balanceResponse = balanceService.getAccountBalance(accountId, userId, clientIp);
        return ResponseEntity.ok(ApiResponseDTO.success(balanceResponse));
    }
}
