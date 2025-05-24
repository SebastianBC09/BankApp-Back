package com.bankapp.deposit_service.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ApiResponseDTO<T> {
    private String status;
    private T data;
    private String message;

    public static <T> ApiResponseDTO<T> success(T data) {
        return new ApiResponseDTO<>("success", data, null);
    }

    public static <T> ApiResponseDTO<T> fail(T data, String message) {
        return new ApiResponseDTO<>("fail", data, message);
    }

    public static <T> ApiResponseDTO<T> error(String message) {
        return new ApiResponseDTO<>("error", null, message);
    }
}
