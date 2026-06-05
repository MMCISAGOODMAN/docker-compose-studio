package com.dockercompose.studio.dto;

import jakarta.validation.constraints.NotBlank;

public record ComposeValidateYamlRequest(@NotBlank String yaml) {}
