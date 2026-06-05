package com.dockercompose.studio.dto;

import com.dockercompose.studio.domain.ProjectStatus;
import lombok.Builder;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@Builder
public record ProjectResponse(
        UUID id,
        String name,
        String description,
        Map<String, Object> topology,
        String composeYaml,
        ProjectStatus status,
        Instant createdAt,
        Instant updatedAt
) {}
