package com.dockercompose.studio.dto;

import jakarta.validation.constraints.NotBlank;

public record RuntimeDeployRequest(
        @NotBlank String composeYaml,
        String projectName
) {}
