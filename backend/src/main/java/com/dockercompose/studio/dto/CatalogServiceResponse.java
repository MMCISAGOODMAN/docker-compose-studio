package com.dockercompose.studio.dto;

import java.util.Map;

public record CatalogServiceResponse(
        String id,
        String name,
        String category,
        String icon,
        String description,
        String defaultImage,
        Map<String, Object> defaults
) {}
