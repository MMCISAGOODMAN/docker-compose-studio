package com.dockercompose.studio.service.ai;

import java.util.List;
import java.util.Optional;

public interface AiModelProvider {

    String id();

    String displayName();

    boolean isAvailable(AiRuntimeConfig config);

    boolean requiresApiKey();

    Optional<AiPlan> plan(String prompt, List<String> catalogIds, AiRuntimeConfig config);
}
