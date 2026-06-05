package com.dockercompose.studio.dto;

import jakarta.validation.constraints.NotNull;

import java.util.Map;

public record ComposeValidateTopologyRequest(@NotNull Map<String, Object> topology) {}
