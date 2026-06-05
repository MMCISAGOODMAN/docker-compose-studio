package com.dockercompose.studio.service.ai;

import com.dockercompose.studio.config.AiProperties;
import com.dockercompose.studio.dto.AiProviderInfoResponse;
import com.dockercompose.studio.dto.AiProviderOverrideRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AiProviderRouter {

    private final AiProperties aiProperties;
    private final OllamaAiProvider ollamaProvider;
    private final OpenAiCompatibleAiProvider openAiProvider;

    public List<AiProviderInfoResponse> listProviders(AiProviderOverrideRequest override) {
        List<AiProviderInfoResponse> providers = new ArrayList<>();

        AiRuntimeConfig ollamaConfig = resolveConfig("ollama", override);
        providers.add(AiProviderInfoResponse.builder()
                .id(ollamaProvider.id())
                .name(ollamaProvider.displayName())
                .available(ollamaProvider.isAvailable(ollamaConfig))
                .model(ollamaConfig.model())
                .baseUrl(ollamaConfig.baseUrl())
                .requiresApiKey(ollamaProvider.requiresApiKey())
                .build());

        AiRuntimeConfig openAiConfig = resolveConfig("openai-compatible", override);
        providers.add(AiProviderInfoResponse.builder()
                .id(openAiProvider.id())
                .name(openAiProvider.displayName())
                .available(openAiProvider.isAvailable(openAiConfig))
                .model(openAiConfig.model())
                .baseUrl(openAiConfig.baseUrl())
                .requiresApiKey(openAiProvider.requiresApiKey())
                .build());

        return providers;
    }

    public Optional<AiPlan> plan(String prompt, List<String> catalogIds, AiProviderOverrideRequest override) {
        String requested = override != null && override.type() != null && !override.type().isBlank()
                ? normalizeType(override.type())
                : normalizeType(aiProperties.getLlm());

        Optional<AiPlan> primary = planWithProvider(requested, prompt, catalogIds, override);
        if (primary.isPresent()) return primary;

        if (!"auto".equals(aiProperties.getMode())) {
            return Optional.empty();
        }

        for (String fallback : List.of("ollama", "openai-compatible")) {
            if (fallback.equals(requested)) continue;
            Optional<AiPlan> result = planWithProvider(fallback, prompt, catalogIds, override);
            if (result.isPresent()) return result;
        }
        return Optional.empty();
    }

    public AiRuntimeConfig resolveConfig(String type, AiProviderOverrideRequest override) {
        String normalized = normalizeType(type);

        if (override != null && override.type() != null && normalizeType(override.type()).equals(normalized)) {
            return buildFromOverride(normalized, override);
        }

        if ("openai-compatible".equals(normalized)) {
            AiProperties.OpenAi openAi = aiProperties.getOpenai();
            return AiRuntimeConfig.openAiCompatible(
                    openAi.getBaseUrl(),
                    openAi.getModel(),
                    openAi.getApiKey(),
                    openAi.getTimeoutSeconds()
            );
        }

        AiProperties.Ollama ollama = aiProperties.getOllama();
        return AiRuntimeConfig.ollama(
                ollama.getBaseUrl(),
                ollama.getModel(),
                ollama.getTimeoutSeconds()
        );
    }

    private Optional<AiPlan> planWithProvider(
            String type,
            String prompt,
            List<String> catalogIds,
            AiProviderOverrideRequest override
    ) {
        AiRuntimeConfig config = resolveConfig(type, override);
        AiModelProvider provider = getProvider(type);
        if (!provider.isAvailable(config)) return Optional.empty();
        return provider.plan(prompt, catalogIds, config);
    }

    private AiModelProvider getProvider(String type) {
        return "openai-compatible".equals(type) ? openAiProvider : ollamaProvider;
    }

    private AiRuntimeConfig buildFromOverride(String type, AiProviderOverrideRequest override) {
        String baseUrl = override.baseUrl();
        String model = override.model();
        String apiKey = override.apiKey();

        if ("openai-compatible".equals(type)) {
            AiProperties.OpenAi defaults = aiProperties.getOpenai();
            return AiRuntimeConfig.openAiCompatible(
                    baseUrl != null && !baseUrl.isBlank() ? baseUrl : defaults.getBaseUrl(),
                    model != null && !model.isBlank() ? model : defaults.getModel(),
                    apiKey != null ? apiKey : defaults.getApiKey(),
                    defaults.getTimeoutSeconds()
            );
        }

        AiProperties.Ollama defaults = aiProperties.getOllama();
        return AiRuntimeConfig.ollama(
                baseUrl != null && !baseUrl.isBlank() ? baseUrl : defaults.getBaseUrl(),
                model != null && !model.isBlank() ? model : defaults.getModel(),
                defaults.getTimeoutSeconds()
        );
    }

    private String normalizeType(String type) {
        if (type == null || type.isBlank()) return "ollama";
        return switch (type.toLowerCase()) {
            case "openai", "openai-compatible", "openai_compatible", "compatible" -> "openai-compatible";
            default -> "ollama";
        };
    }
}
