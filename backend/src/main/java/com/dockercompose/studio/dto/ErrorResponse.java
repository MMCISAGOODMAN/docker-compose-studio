package com.dockercompose.studio.dto;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.time.Instant;
import java.util.Map;

public record ErrorResponse(ApiError error, Instant timestamp) {
    public static ResponseEntity<ErrorResponse> of(HttpStatus status, String code, String message) {
        return ResponseEntity.status(status)
                .body(new ErrorResponse(new ApiError(code, message, Map.of()), Instant.now()));
    }
}
