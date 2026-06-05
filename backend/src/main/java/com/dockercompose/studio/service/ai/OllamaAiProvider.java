package com.dockercompose.studio.service.ai;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Component
@RequiredArgsConstructor
@Slf4j
public class OllamaAiProvider implements AiModelProvider {

    private final AiPlanningService planningService;
    private final RestTemplate aiRestTemplate;

    @Override
    public String id() {
        return "ollama";
    }

    @Override
    public String displayName() {
        return "Ollama";
    }

    @Override
    public boolean requiresApiKey() {
        return false;
    }

    @Override
    public boolean isAvailable(AiRuntimeConfig config) {
        try {
            var response = aiRestTemplate.getForEntity(normalizeBaseUrl(config.baseUrl()) + "/api/tags", Map.class);
            return response.getStatusCode().is2xxSuccessful();
        } catch (Exception e) {
            log.debug("Ollama unavailable at {}: {}", config.baseUrl(), e.getMessage());
            return false;
        }
    }

    @Override
    public Optional<AiPlan> plan(String prompt, List<String> catalogIds, AiRuntimeConfig config) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("model", config.model());
        body.put("stream", false);
        body.put("format", "json");
        body.put("messages", List.of(
                Map.of("role", "system", "content", planningService.systemPrompt()),
                Map.of("role", "user", "content", planningService.userPrompt(prompt, catalogIds))
        ));

        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> response = aiRestTemplate.postForObject(
                    normalizeBaseUrl(config.baseUrl()) + "/api/chat",
                    body,
                    Map.class
            );
            if (response == null) return Optional.empty();

            @SuppressWarnings("unchecked")
            Map<String, Object> message = (Map<String, Object>) response.get("message");
            if (message == null) return Optional.empty();

            return planningService.parsePlan((String) message.get("content"), id());
        } catch (Exception e) {
            log.warn("Ollama planning failed: {}", e.getMessage());
            return Optional.empty();
        }
    }

    static String normalizeBaseUrl(String baseUrl) {
        if (baseUrl == null || baseUrl.isBlank()) return "http://localhost:11434";
        return baseUrl.endsWith("/") ? baseUrl.substring(0, baseUrl.length() - 1) : baseUrl;
    }
}
