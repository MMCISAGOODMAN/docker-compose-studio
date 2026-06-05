package com.dockercompose.studio.dto;

public record ContainerInfoResponse(
        String id,
        String name,
        String service,
        String image,
        String status,
        String state,
        String health,
        String ports
) {}
