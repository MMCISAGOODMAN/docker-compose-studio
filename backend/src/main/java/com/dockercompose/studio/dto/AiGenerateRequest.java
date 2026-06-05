package com.dockercompose.studio.dto;

import jakarta.validation.constraints.NotBlank;

public record AiGenerateRequest(
        @NotBlank String prompt,
        AiProviderOverrideRequest provider
) {}
