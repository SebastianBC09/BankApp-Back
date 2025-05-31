package com.bankapp.withdrawal_service.controller;

import com.bankapp.withdrawal_service.dto.AccountTransactionResponseDataDTO;
import com.bankapp.withdrawal_service.dto.AmountRequestDTO;
import com.bankapp.withdrawal_service.dto.ApiResponseDTO;
import com.bankapp.withdrawal_service.exception.InvalidInputException;
import com.bankapp.withdrawal_service.service.DefaultWithdrawalService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.enums.ParameterIn;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;

@RestController
@RequestMapping("/")
@Tag(name = "Withdrawal Service", description = "Endpoints para operaciones de retiro de cuentas")
@SecurityRequirement(name = "bearerAuth")
public class WithdrawalController {

    private final DefaultWithdrawalService withdrawalService;
    private static final Logger controllerLog = LoggerFactory.getLogger(WithdrawalController.class);

    @Autowired
    public WithdrawalController(DefaultWithdrawalService withdrawalService) {
        this.withdrawalService = withdrawalService;
    }

    @Operation(
            summary = "Realizar un retiro de la cuenta del usuario",
            description = "Retira un monto especificado de la cuenta asociada al usuario autenticado, identificado por el header 'X-User-ID'. El monto a retirar se envía en el cuerpo de la solicitud."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Retiro realizado exitosamente",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = ApiResponseDTO.class))),
            @ApiResponse(responseCode = "400", description = "Solicitud incorrecta (ej. monto inválido, fondos insuficientes, X-User-ID con formato incorrecto)",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = ApiResponseDTO.class))),
            @ApiResponse(responseCode = "401", description = "No autorizado (ej. X-User-ID faltante o inválido a nivel de servicio)",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = ApiResponseDTO.class))),
            @ApiResponse(responseCode = "403", description = "Prohibido (ej. cuenta no activa para retiros)",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = ApiResponseDTO.class))),
            @ApiResponse(responseCode = "404", description = "No encontrado (ej. cuenta no encontrada para el X-User-ID)",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = ApiResponseDTO.class))),
            @ApiResponse(responseCode = "500", description = "Error interno del servidor",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = ApiResponseDTO.class)))
    })
    @PostMapping
    public ResponseEntity<ApiResponseDTO<AccountTransactionResponseDataDTO>> handleWithdrawal(
            @Parameter(in = ParameterIn.HEADER, name = "X-User-ID", required = true, description = "ID del usuario (PostgreSQL ID) inyectado por el API Gateway.", schema = @Schema(type = "string"), example = "123")
            @RequestHeader("X-User-ID") String userIdString,
            @io.swagger.v3.oas.annotations.parameters.RequestBody(description = "Monto a retirar.", required = true,
                    content = @Content(schema = @Schema(implementation = AmountRequestDTO.class)))
            @Valid @RequestBody AmountRequestDTO amountRequest,
            HttpServletRequest request) {

        controllerLog.info("Received withdrawal request for X-User-ID: {}, Amount: {}", userIdString, amountRequest.getAmount());

        Long userId;
        try {
            if (userIdString == null || userIdString.trim().isEmpty()) {
                controllerLog.warn("X-User-ID header is missing or empty.");
                throw new InvalidInputException("X-User-ID header is missing or empty.");
            }
            userId = Long.parseLong(userIdString.trim());
        } catch (NumberFormatException e) {
            controllerLog.warn("X-User-ID header contains an invalid user ID format: {}", userIdString, e);
            throw new InvalidInputException("X-User-ID header contains an invalid user ID format.");
        }

        if (amountRequest.getAmount() == null) {
            controllerLog.warn("Amount is null in the request body.");
            throw new InvalidInputException("Amount field is required and cannot be null.");
        }
        BigDecimal amount = amountRequest.getAmount();

        String clientIp = request.getHeader("X-Forwarded-For");
        if (clientIp == null || clientIp.isEmpty() || "unknown".equalsIgnoreCase(clientIp)) {
            clientIp = request.getRemoteAddr();
        } else {
            clientIp = clientIp.split(",")[0].trim();
        }
        controllerLog.debug("Client IP for withdrawal request: {}", clientIp);

        ApiResponseDTO<AccountTransactionResponseDataDTO> apiResponse = withdrawalService.performWithdrawal(
                userId,
                amount,
                clientIp
        );

        controllerLog.info("Withdrawal processed successfully for user ID: {}", userId);
        return ResponseEntity.ok(apiResponse);
    }
}
