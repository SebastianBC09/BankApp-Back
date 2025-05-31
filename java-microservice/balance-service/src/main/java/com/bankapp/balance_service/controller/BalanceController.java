package com.bankapp.balance_service.controller;

import com.bankapp.balance_service.dto.AccountBalanceDataDTO;
import com.bankapp.balance_service.dto.ApiResponseDTO;
import com.bankapp.balance_service.exception.InvalidInputException;

import com.bankapp.balance_service.service.DefaultBalanceService;
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
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/")
@Tag(name = "Balance Service", description = "Endpoints para consulta de saldo de cuentas")
@SecurityRequirement(name = "bearerAuth")
public class BalanceController {
    private final DefaultBalanceService balanceService;
    private static final Logger controllerLog = LoggerFactory.getLogger(BalanceController.class);

    @Autowired
    public BalanceController(DefaultBalanceService balanceService) {
        this.balanceService = balanceService;
    }

    @Operation(
            summary = "Consultar saldo de la cuenta del usuario autenticado",
            description = "Obtiene el saldo y detalles de la cuenta asociada al usuario autenticado, el cual es identificado por el header 'X-User-ID' inyectado por el API Gateway."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Saldo obtenido exitosamente.",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = ApiResponseDTO.class))),
            @ApiResponse(responseCode = "400", description = "Solicitud incorrecta (ej. X-User-ID con formato incorrecto o faltante a nivel de validación del controlador).",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ApiResponseDTO.class))),
            @ApiResponse(responseCode = "401", description = "No autorizado (el API Gateway maneja la autenticación JWT; este error podría surgir si X-User-ID es inválido a nivel de servicio).",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ApiResponseDTO.class))),
            @ApiResponse(responseCode = "403", description = "Prohibido (ej. la cuenta del usuario no está activa).",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ApiResponseDTO.class))),
            @ApiResponse(responseCode = "404", description = "No encontrado (ej. no se encontró una cuenta para el X-User-ID proporcionado).",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ApiResponseDTO.class))),
            @ApiResponse(responseCode = "500", description = "Error interno del servidor.",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ApiResponseDTO.class)))
    })
    @GetMapping
    public ResponseEntity<ApiResponseDTO<AccountBalanceDataDTO>> getAccountBalance(
            @Parameter(in = ParameterIn.HEADER, name = "X-User-ID", required = true,
                    description = "ID del usuario (PostgreSQL ID) inyectado por el API Gateway después de la autenticación.",
                    schema = @Schema(type = "string"), example = "1")
            @RequestHeader("X-User-ID") String userIdString,
            HttpServletRequest request) {
        controllerLog.info("Received request to get account balance for X-User-ID: {}", userIdString);
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
        String clientIp = request.getHeader("X-Forwarded-For");
        if (clientIp == null || clientIp.isEmpty() || "unknown".equalsIgnoreCase(clientIp)) {
            clientIp = request.getRemoteAddr();
        } else {
            clientIp = clientIp.split(",")[0].trim();
        }
        controllerLog.debug("Client IP determined as: {}", clientIp);
        AccountBalanceDataDTO balanceResponse = balanceService.getAccountBalance(userId, clientIp);
        controllerLog.info("Successfully retrieved balance for user ID: {}", userId);
        return ResponseEntity.ok(ApiResponseDTO.success(balanceResponse));
    }
}
