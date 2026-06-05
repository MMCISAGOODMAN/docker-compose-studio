package com.dockercompose.studio.service;

import com.dockercompose.studio.config.AiProperties;
import com.dockercompose.studio.dto.*;
import com.dockercompose.studio.service.ai.AiPlan;
import com.dockercompose.studio.service.ai.AiProviderRouter;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
@RequiredArgsConstructor
public class AiTopologyService {

    private final AiProperties aiProperties;
    private final CatalogService catalogService;
    private final ComposeService composeService;
    private final TemplateService templateService;
    private final AiProviderRouter aiProviderRouter;

    private static final List<TemplateMatch> TEMPLATE_MATCHES = List.of(
            new TemplateMatch("rag-dev", List.of("rag", "检索增强", "向量", "qdrant", "知识库")),
            new TemplateMatch("spring-boot-dev", List.of("spring boot", "springboot", "spring", "java")),
            new TemplateMatch("python-dev", List.of("python", "django", "fastapi", "flask")),
            new TemplateMatch("microservices-dev", List.of("microservice", "microservices", "微服务")),
            new TemplateMatch("kafka-cluster", List.of("kafka cluster", "kafka集群", "kafka ui")),
            new TemplateMatch("ai-dev", List.of("open webui", "openwebui", "ollama", "大模型", "llm")),
            new TemplateMatch("kafka-cluster", List.of("kafka", "消息队列"))
    );

    private static final Map<String, List<String>> KEYWORD_SERVICES = Map.ofEntries(
            Map.entry("spring boot", List.of("spring-boot", "postgresql", "redis")),
            Map.entry("springboot", List.of("spring-boot", "postgresql", "redis")),
            Map.entry("spring", List.of("spring-boot", "postgresql", "redis")),
            Map.entry("java", List.of("spring-boot", "postgresql", "redis")),
            Map.entry("python", List.of("python", "postgresql", "redis")),
            Map.entry("node", List.of("nodejs", "postgresql", "redis")),
            Map.entry("nodejs", List.of("nodejs", "postgresql", "redis")),
            Map.entry("rag", List.of("ollama", "openwebui", "qdrant", "postgresql")),
            Map.entry("llm", List.of("ollama", "openwebui")),
            Map.entry("ai", List.of("ollama", "openwebui", "qdrant")),
            Map.entry("ollama", List.of("ollama", "openwebui")),
            Map.entry("kafka", List.of("kafka", "zookeeper")),
            Map.entry("microservice", List.of("spring-boot", "postgresql", "redis", "kafka", "nginx")),
            Map.entry("microservices", List.of("spring-boot", "postgresql", "redis", "kafka", "nginx")),
            Map.entry("微服务", List.of("spring-boot", "postgresql", "redis", "kafka", "nginx")),
            Map.entry("postgresql", List.of("postgresql")),
            Map.entry("postgres", List.of("postgresql")),
            Map.entry("mysql", List.of("mysql")),
            Map.entry("redis", List.of("redis")),
            Map.entry("mongodb", List.of("mongodb")),
            Map.entry("mongo", List.of("mongodb")),
            Map.entry("elasticsearch", List.of("elasticsearch")),
            Map.entry("minio", List.of("minio")),
            Map.entry("rabbitmq", List.of("rabbitmq")),
            Map.entry("nginx", List.of("nginx"))
    );

    public AiStatusResponse status(AiProviderOverrideRequest override) {
        List<AiProviderInfoResponse> providers = aiProviderRouter.listProviders(override);
        boolean ollamaUp = providers.stream()
                .anyMatch(p -> "ollama".equals(p.id()) && p.available());
        boolean openAiReady = providers.stream()
                .anyMatch(p -> "openai-compatible".equals(p.id()) && p.available());

        String message;
        if (ollamaUp) {
            message = "Default LLM: Ollama (available). OpenAI-compatible APIs also supported.";
        } else if (openAiReady) {
            message = "Ollama offline; OpenAI-compatible provider is configured.";
        } else {
            message = "No LLM available — using template matching and keyword rules. Configure Ollama or an API key.";
        }

        return AiStatusResponse.builder()
                .mode(aiProperties.getMode())
                .defaultLlm(aiProperties.getLlm())
                .providers(providers)
                .message(message)
                .build();
    }

    public AiGenerateResponse generate(String prompt, AiProviderOverrideRequest providerOverride) {
        if (shouldUseTemplate()) {
            Optional<TemplateResponse> template = matchTemplate(prompt);
            if (template.isPresent()) {
                Map<String, Object> topology = template.get().topology();
                return AiGenerateResponse.builder()
                        .topology(topology)
                        .composeYaml(composeService.generateYaml(topology))
                        .explanation("Matched template \"" + template.get().name() + "\": " + template.get().description())
                        .provider("template")
                        .build();
            }
        }

        if (shouldUseLlm()) {
            Optional<AiGenerateResponse> llmResult = generateWithLlm(prompt, providerOverride);
            if (llmResult.isPresent()) {
                return llmResult.get();
            }
            if ("llm".equals(aiProperties.getMode())) {
                return generateWithRules(prompt, "LLM could not produce a valid plan; fell back to keyword rules");
            }
        }

        return generateWithRules(prompt, null);
    }

    private boolean shouldUseTemplate() {
        return !"llm".equals(aiProperties.getMode()) && !"rules".equals(aiProperties.getMode());
    }

    private boolean shouldUseLlm() {
        String mode = aiProperties.getMode();
        return "auto".equals(mode) || "llm".equals(mode);
    }

    private Optional<TemplateResponse> matchTemplate(String prompt) {
        String lower = prompt.toLowerCase();
        String bestSlug = null;
        int bestScore = 0;

        for (TemplateMatch match : TEMPLATE_MATCHES) {
            int score = 0;
            for (String keyword : match.keywords()) {
                if (lower.contains(keyword.toLowerCase())) score++;
            }
            if (score > bestScore) {
                bestScore = score;
                bestSlug = match.slug();
            }
        }

        if (bestSlug == null) return Optional.empty();
        try {
            return Optional.of(templateService.getBySlug(bestSlug));
        } catch (IllegalArgumentException e) {
            return Optional.empty();
        }
    }

    private Optional<AiGenerateResponse> generateWithLlm(String prompt, AiProviderOverrideRequest providerOverride) {
        List<String> catalogIds = catalogService.listServices().stream()
                .map(CatalogServiceResponse::id)
                .toList();

        return aiProviderRouter.plan(prompt, catalogIds, providerOverride).map(plan -> {
            TopologyBuildResult built = buildTopology(
                    plan.serviceIds(),
                    plan.dependencies().stream()
                            .map(d -> new DependencyEdge(d.from(), d.to()))
                            .toList()
            );
            return AiGenerateResponse.builder()
                    .topology(built.topology())
                    .composeYaml(composeService.generateYaml(built.topology()))
                    .explanation(plan.explanation())
                    .provider(plan.providerId())
                    .build();
        });
    }

    private AiGenerateResponse generateWithRules(String prompt, String prefixExplanation) {
        String lower = prompt.toLowerCase();
        Set<String> serviceIds = new LinkedHashSet<>();

        for (Map.Entry<String, List<String>> entry : KEYWORD_SERVICES.entrySet()) {
            if (lower.contains(entry.getKey())) {
                serviceIds.addAll(entry.getValue());
            }
        }

        if (serviceIds.isEmpty()) {
            serviceIds.addAll(List.of("postgresql", "redis"));
        }

        TopologyBuildResult built = buildTopology(serviceIds, List.of());
        String explanation = prefixExplanation != null
                ? prefixExplanation
                : "Generated environment with: " + String.join(", ", serviceIds);

        return AiGenerateResponse.builder()
                .topology(built.topology())
                .composeYaml(composeService.generateYaml(built.topology()))
                .explanation(explanation)
                .provider("rules")
                .build();
    }

    private TopologyBuildResult buildTopology(Collection<String> serviceIds, List<DependencyEdge> explicitEdges) {
        List<Map<String, Object>> nodes = new ArrayList<>();
        List<Map<String, Object>> edges = new ArrayList<>();

        int x = 100, y = 100, index = 0;
        String appNodeId = null;
        Map<String, String> catalogIdToNodeId = new HashMap<>();

        for (String serviceId : serviceIds) {
            CatalogServiceResponse catalog = catalogService.getServiceOrNull(serviceId);
            if (catalog == null) continue;

            @SuppressWarnings("unchecked")
            Map<String, Object> defaults = catalog.defaults() != null
                    ? new LinkedHashMap<>(catalog.defaults())
                    : new LinkedHashMap<>();

            String serviceName = serviceId.replace("-", "");
            String nodeId = "svc-" + serviceName + "-" + index;

            Map<String, Object> data = new LinkedHashMap<>();
            data.put("catalogId", catalog.id());
            data.put("name", serviceName);
            data.put("image", defaults.getOrDefault("image", catalog.defaultImage()));
            data.put("ports", defaults.getOrDefault("ports", List.of()));
            data.put("volumes", defaults.getOrDefault("volumes", List.of()));
            data.put("environment", defaults.getOrDefault("environment", Map.of()));
            if (defaults.containsKey("healthcheck")) {
                data.put("healthcheck", defaults.get("healthcheck"));
            }

            nodes.add(Map.of(
                    "id", nodeId,
                    "type", "serviceNode",
                    "position", Map.of("x", x, "y", y),
                    "data", data
            ));

            catalogIdToNodeId.put(serviceId, nodeId);

            if (serviceId.equals("spring-boot") || serviceId.equals("python") || serviceId.equals("nodejs")) {
                appNodeId = nodeId;
            }

            x += 250;
            if (index % 3 == 2) {
                x = 100;
                y += 180;
            }
            index++;
        }

        if (!explicitEdges.isEmpty()) {
            for (DependencyEdge dep : explicitEdges) {
                String sourceId = catalogIdToNodeId.get(dep.from());
                String targetId = catalogIdToNodeId.get(dep.to());
                if (sourceId != null && targetId != null) {
                    edges.add(Map.of(
                            "id", "e-" + sourceId + "-" + targetId,
                            "source", sourceId,
                            "target", targetId,
                            "type", "dependency"
                    ));
                }
            }
        } else if (appNodeId != null) {
            for (Map<String, Object> node : nodes) {
                @SuppressWarnings("unchecked")
                Map<String, Object> data = (Map<String, Object>) node.get("data");
                String catalogId = (String) data.get("catalogId");
                if (List.of("postgresql", "mysql", "mongodb", "redis", "elasticsearch", "kafka").contains(catalogId)) {
                    String targetId = (String) node.get("id");
                    edges.add(Map.of(
                            "id", "e-" + appNodeId + "-" + targetId,
                            "source", appNodeId,
                            "target", targetId,
                            "type", "dependency"
                    ));
                }
            }
        }

        if (serviceIds.contains("kafka") && serviceIds.contains("zookeeper")) {
            String kafkaId = catalogIdToNodeId.get("kafka");
            String zkId = catalogIdToNodeId.get("zookeeper");
            if (kafkaId != null && zkId != null) {
                edges.add(Map.of(
                        "id", "e-" + kafkaId + "-" + zkId,
                        "source", kafkaId,
                        "target", zkId,
                        "type", "dependency"
                ));
            }
        }

        return new TopologyBuildResult(Map.of("nodes", nodes, "edges", edges));
    }

    private record TemplateMatch(String slug, List<String> keywords) {}

    private record DependencyEdge(String from, String to) {}

    private record TopologyBuildResult(Map<String, Object> topology) {}
}
