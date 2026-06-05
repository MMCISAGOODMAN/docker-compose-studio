package com.dockercompose.studio.dto;

import jakarta.validation.constraints.NotBlank;

public record RuntimeStopRequest(@NotBlank String deployId) {}
