package com.dockercompose.studio.dto;

public record RuntimeDeployResponse(
        String deployId,
        String status,
        String message,
        String composeProjectName
) {}
