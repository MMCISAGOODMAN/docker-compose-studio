package com.dockercompose.studio.dto;

import jakarta.validation.constraints.NotBlank;

public record ComposeParseRequest(@NotBlank String yaml) {}
