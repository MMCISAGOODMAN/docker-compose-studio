package com.dockercompose.studio.dto;

import jakarta.validation.constraints.NotBlank;

public record ComposeDiffRequest(@NotBlank String source, @NotBlank String target) {}
