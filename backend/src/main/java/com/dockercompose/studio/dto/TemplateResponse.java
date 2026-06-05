package com.dockercompose.studio.dto;

import lombok.Builder;

import java.util.Map;
import java.util.UUID;

@Builder
public record TemplateResponse(
        UUID id,
        String slug,
        String name,
        String category,
        String description,
        Map<String, Object> topology,
        String composeYaml
) {}
