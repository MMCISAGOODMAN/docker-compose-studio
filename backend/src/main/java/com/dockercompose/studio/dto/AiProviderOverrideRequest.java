package com.dockercompose.studio.dto;

public record AiProviderOverrideRequest(
        String type,
        String baseUrl,
        String model,
        String apiKey
) {}
