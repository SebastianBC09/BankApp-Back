package com.bankapp.deposit_service.exception;

import com.bankapp.deposit_service.dto.ApiResponseDTO;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MissingRequestHeaderException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

@ControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiResponseDTO<Object>> handleResourceNotFoundException(ResourceNotFoundException ex) {
        log.warn("Resource not found: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ApiResponseDTO.fail(null, ex.getMessage()));
    }

    @ExceptionHandler(UnauthorizedAccessException.class)
    public ResponseEntity<ApiResponseDTO<Object>> handleUnauthorizedAccessException(UnauthorizedAccessException ex) {
        log.warn("Unauthorized access attempt: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(ApiResponseDTO.fail(null, ex.getMessage()));
    }

    @ExceptionHandler(AccountNotActiveException.class)
    public ResponseEntity<ApiResponseDTO<Object>> handleAccountNotActiveException(AccountNotActiveException ex) {
        log.warn("Operation on non-active account: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(ApiResponseDTO.fail(null, ex.getMessage()));
    }

    @ExceptionHandler(InvalidInputException.class) // Manejador para InvalidInputException
    public ResponseEntity<ApiResponseDTO<Object>> handleInvalidInputException(InvalidInputException ex) {
        log.warn("Invalid input provided: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponseDTO.fail(null, ex.getMessage()));
    }

    // Mantenemos el de IllegalArgumentException por si alguna librería interna lo lanza
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiResponseDTO<Object>> handleIllegalArgumentException(IllegalArgumentException ex) {
        log.warn("Illegal argument provided (generic): {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponseDTO.fail(null, ex.getMessage()));
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ApiResponseDTO<Object>> handleMethodArgumentTypeMismatch(MethodArgumentTypeMismatchException ex) {
        log.warn("Method argument type mismatch: {}", ex.getMessage());
        String fieldName = ex.getName();
        String requiredType = ex.getRequiredType() != null ? ex.getRequiredType().getSimpleName() : "desconocido";
        Object providedValue = ex.getValue();
        String message = String.format("El parámetro '%s' debe ser de tipo '%s'. Valor recibido: '%s'",
                fieldName, requiredType, providedValue);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponseDTO.fail(null, message));
    }

    @ExceptionHandler(MissingRequestHeaderException.class)
    public ResponseEntity<ApiResponseDTO<Object>> handleMissingRequestHeaderException(MissingRequestHeaderException ex) {
        log.warn("Missing request header: {}", ex.getHeaderName());
        String message = String.format("La cabecera requerida '%s' no está presente.", ex.getHeaderName());
        HttpStatus status = HttpStatus.BAD_REQUEST;
        if ("X-User-ID".equalsIgnoreCase(ex.getHeaderName())) { // Ser más específico para X-User-ID
            status = HttpStatus.UNAUTHORIZED; // Un User ID faltante es un problema de autenticación/autorización
            message = "Información de identificación del usuario no proporcionada.";
        }
        return ResponseEntity.status(status)
                .body(ApiResponseDTO.fail(null, message));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponseDTO<Object>> handleGlobalException(Exception ex) {
        log.error("Ocurrió un error inesperado:", ex); // Loguear el stack trace completo en producción es importante
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponseDTO.error("Ocurrió un error interno inesperado en el servidor."));
    }
}
