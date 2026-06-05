package com.dockercompose.studio.dto;

import lombok.Builder;

@Builder
public record AiProviderInfoResponse(
        String id,
        String name,
        boolean available,
        String model,
        String baseUrl,
        boolean requiresApiKey
) {}
