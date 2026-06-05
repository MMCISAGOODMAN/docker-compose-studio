package com.dockercompose.studio.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.Map;

public record ProjectRequest(
        @NotBlank String name,
        String description,
        @NotNull Map<String, Object> topology,
        String composeYaml
) {}
