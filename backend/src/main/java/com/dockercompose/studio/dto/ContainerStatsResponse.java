package com.dockercompose.studio.dto;

public record ContainerStatsResponse(
        String containerId,
        double cpuPercent,
        long memoryUsageMb,
        long memoryLimitMb,
        double memoryPercent
) {}
