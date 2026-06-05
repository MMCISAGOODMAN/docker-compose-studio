package com.dockercompose.studio.dto;

import lombok.Builder;

import java.util.List;

@Builder
public record AiStatusResponse(
        String mode,
        String defaultLlm,
        List<AiProviderInfoResponse> providers,
        String message
) {}
