package com.bankapp.deposit_service.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResponseDTO<T> {
    private String status;
    private String message;
    private T data;

    public static <T> ApiResponseDTO<T> success(T data, String rootMessage) {
        return new ApiResponseDTO<>("success", rootMessage, data);
    }

    public static <T> ApiResponseDTO<T> success(T data) {
        String defaultMessage = "Operación completada exitosamente.";
        if (data instanceof AccountTransactionResponseDataDTO) {
            AccountTransactionResponseDataDTO transactionData = (AccountTransactionResponseDataDTO) data;
            if (transactionData.getMessage() != null && !transactionData.getMessage().isEmpty()) {
                defaultMessage = transactionData.getMessage();
            }
        }
        return new ApiResponseDTO<>("success", defaultMessage, data);
    }

    public static <T> ApiResponseDTO<T> error(String rootMessage, T data) {
        return new ApiResponseDTO<>("error", rootMessage, data);
    }

    public static ApiResponseDTO<Object> error(String rootMessage) {
        return new ApiResponseDTO<>("error", rootMessage, null);
    }

    public static <T> ApiResponseDTO<T> fail(String rootMessage, T data) {
        return new ApiResponseDTO<>("fail", rootMessage, data);
    }

    public static ApiResponseDTO<?> fail(String rootMessage) {
        return new ApiResponseDTO<>("fail", rootMessage, null);
    }
}
