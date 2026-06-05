package com.dockercompose.studio.service.ai;

public record AiRuntimeConfig(
        String type,
        String baseUrl,
        String model,
        String apiKey,
        int timeoutSeconds
) {
    public static AiRuntimeConfig ollama(String baseUrl, String model, int timeoutSeconds) {
        return new AiRuntimeConfig("ollama", baseUrl, model, null, timeoutSeconds);
    }

    public static AiRuntimeConfig openAiCompatible(String baseUrl, String model, String apiKey, int timeoutSeconds) {
        return new AiRuntimeConfig("openai-compatible", baseUrl, model, apiKey, timeoutSeconds);
    }
}
