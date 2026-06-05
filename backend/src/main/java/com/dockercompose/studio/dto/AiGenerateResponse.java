package com.dockercompose.studio.dto;

import lombok.Builder;

import java.util.Map;

@Builder
public record AiGenerateResponse(
        Map<String, Object> topology,
        String composeYaml,
        String explanation,
        String provider
) {}
