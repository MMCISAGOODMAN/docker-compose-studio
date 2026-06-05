package com.dockercompose.studio.service.ai;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Component
@RequiredArgsConstructor
@Slf4j
public class OpenAiCompatibleAiProvider implements AiModelProvider {

    private final AiPlanningService planningService;
    private final RestTemplate aiRestTemplate;

    @Override
    public String id() {
        return "openai-compatible";
    }

    @Override
    public String displayName() {
        return "OpenAI Compatible";
    }

    @Override
    public boolean requiresApiKey() {
        return true;
    }

    @Override
    public boolean isAvailable(AiRuntimeConfig config) {
        return config.apiKey() != null && !config.apiKey().isBlank()
                && config.baseUrl() != null && !config.baseUrl().isBlank()
                && config.model() != null && !config.model().isBlank();
    }

    @Override
    public Optional<AiPlan> plan(String prompt, List<String> catalogIds, AiRuntimeConfig config) {
        if (!isAvailable(config)) return Optional.empty();

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("model", config.model());
        body.put("temperature", 0.2);
        body.put("response_format", Map.of("type", "json_object"));
        body.put("messages", List.of(
                Map.of("role", "system", "content", planningService.systemPrompt()),
                Map.of("role", "user", "content", planningService.userPrompt(prompt, catalogIds))
        ));

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(config.apiKey());

        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> response = aiRestTemplate.postForObject(
                    normalizeBaseUrl(config.baseUrl()) + "/chat/completions",
                    new HttpEntity<>(body, headers),
                    Map.class
            );
            if (response == null) return Optional.empty();

            @SuppressWarnings("unchecked")
            List<Map<String, Object>> choices = (List<Map<String, Object>>) response.get("choices");
            if (choices == null || choices.isEmpty()) return Optional.empty();

            @SuppressWarnings("unchecked")
            Map<String, Object> message = (Map<String, Object>) choices.getFirst().get("message");
            if (message == null) return Optional.empty();

            return planningService.parsePlan((String) message.get("content"), id());
        } catch (Exception e) {
            log.warn("OpenAI-compatible planning failed: {}", e.getMessage());
            return Optional.empty();
        }
    }

    static String normalizeBaseUrl(String baseUrl) {
        if (baseUrl == null || baseUrl.isBlank()) return "https://api.openai.com/v1";
        String trimmed = baseUrl.endsWith("/") ? baseUrl.substring(0, baseUrl.length() - 1) : baseUrl;
        if (trimmed.endsWith("/v1")) return trimmed;
        return trimmed + "/v1";
    }
}
