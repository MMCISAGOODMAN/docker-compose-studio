package com.dockercompose.studio.service.ai;

import java.util.List;
import java.util.Set;

public record AiPlan(
        Set<String> serviceIds,
        List<AiDependency> dependencies,
        String explanation,
        String providerId
) {
    public record AiDependency(String from, String to) {}
}
