package com.bankapp.deposit_service.controller;

import com.bankapp.deposit_service.dto.AccountTransactionResponseDataDTO;
import com.bankapp.deposit_service.dto.AmountRequestDTO;
import com.bankapp.deposit_service.dto.ApiResponseDTO;
import com.bankapp.deposit_service.exception.InvalidInputException;
import com.bankapp.deposit_service.service.DefaultDepositService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/account/deposit")
public class DepositController {
    private final DefaultDepositService depositService;

    @Autowired
    public DepositController(DefaultDepositService depositService) {
        this.depositService = depositService;
    }

    @PostMapping("/{accountId}")
    public ResponseEntity<ApiResponseDTO<AccountTransactionResponseDataDTO>> handleDeposit(
            @PathVariable Long accountId,
            @RequestHeader("X-User-ID") String userIdString,
            @Valid @RequestBody AmountRequestDTO amountRequest, // Usar un DTO para el cuerpo y validar
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

        if (amountRequest == null || amountRequest.getAmount() == null) {
            throw new InvalidInputException("Request body or amount field is missing.");
        }
        // La validación de que amount sea > 0 se hace en el servicio,
        // pero podrías añadir anotaciones de validación en AmountRequestDTO

        String clientIp = request.getHeader("X-Forwarded-For");
        if (clientIp == null || clientIp.isEmpty() || "unknown".equalsIgnoreCase(clientIp)) {
            clientIp = request.getRemoteAddr();
        } else {
            clientIp = clientIp.split(",")[0].trim();
        }

        AccountTransactionResponseDataDTO depositResponse = depositService.performDeposit(
                accountId,
                userId,
                amountRequest.getAmount(),
                clientIp
        );

        return ResponseEntity.status(HttpStatus.OK) // O HttpStatus.CREATED (201) si lo prefieres para operaciones que crean/modifican estado
                .body(ApiResponseDTO.success(depositResponse));
    }
}
