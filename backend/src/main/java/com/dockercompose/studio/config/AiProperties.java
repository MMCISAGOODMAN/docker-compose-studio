package com.dockercompose.studio.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Data
@ConfigurationProperties(prefix = "dcs.ai")
public class AiProperties {

    /**
     * Workflow mode: auto (template → LLM → rules), llm (skip template), rules (keyword only).
     */
    private String mode = "auto";

    /** Default LLM backend: ollama | openai | openai-compatible */
    private String llm = "ollama";

    private Ollama ollama = new Ollama();
    private OpenAi openai = new OpenAi();

    @Data
    public static class Ollama {
        private String baseUrl = "http://localhost:11434";
        private String model = "llama3.2";
        private int timeoutSeconds = 90;
    }

    @Data
    public static class OpenAi {
        /** OpenAI-compatible API base URL (OpenAI, Groq, DeepSeek, LM Studio, etc.) */
        private String baseUrl = "https://api.openai.com/v1";
        private String apiKey = "";
        private String model = "gpt-4o-mini";
        private int timeoutSeconds = 90;
    }
}
