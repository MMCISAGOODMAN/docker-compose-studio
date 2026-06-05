package com.dockercompose.studio.service;

import com.dockercompose.studio.domain.Project;
import com.dockercompose.studio.domain.ProjectStatus;
import com.dockercompose.studio.domain.Template;
import com.dockercompose.studio.dto.ProjectRequest;
import com.dockercompose.studio.dto.ProjectResponse;
import com.dockercompose.studio.dto.TemplateResponse;
import com.dockercompose.studio.repository.TemplateRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class TemplateService {

    private final TemplateRepository templateRepository;
    private final ProjectService projectService;
    private final ComposeService composeService;
    private final com.fasterxml.jackson.databind.ObjectMapper objectMapper =
            new com.fasterxml.jackson.databind.ObjectMapper();

    @PostConstruct
    void seedTemplates() {
        if (templateRepository.count() > 0) {
            return;
        }
        loadBuiltinTemplates();
    }

    @Transactional(readOnly = true)
    public List<TemplateResponse> listTemplates(String category) {
        List<Template> templates = category == null || category.isBlank()
                ? templateRepository.findAllByOrderByCategoryAscNameAsc()
                : templateRepository.findByCategoryOrderByNameAsc(category);

        return templates.stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public TemplateResponse getBySlug(String slug) {
        return templateRepository.findBySlug(slug)
                .map(this::toResponse)
                .orElseThrow(() -> new IllegalArgumentException("Template not found: " + slug));
    }

    @Transactional
    public ProjectResponse instantiate(String slug) {
        Template template = templateRepository.findBySlug(slug)
                .orElseThrow(() -> new IllegalArgumentException("Template not found: " + slug));

        return projectService.createProject(new ProjectRequest(
                template.getName(),
                template.getDescription(),
                new HashMap<>(template.getTopology()),
                template.getComposeYaml()
        ));
    }

    private void loadBuiltinTemplates() {
        String[] slugs = {
                "spring-boot-dev", "python-dev", "rag-dev",
                "microservices-dev", "kafka-cluster", "ai-dev"
        };

        for (String slug : slugs) {
            try {
                ClassPathResource resource = new ClassPathResource("templates/" + slug + ".json");
                if (!resource.exists()) continue;

                String json = resource.getContentAsString(StandardCharsets.UTF_8);
                Map<String, Object> data = objectMapper.readValue(json, Map.class);

                @SuppressWarnings("unchecked")
                Map<String, Object> topology = (Map<String, Object>) data.get("topology");
                String composeYaml = (String) data.get("composeYaml");
                if (composeYaml == null || composeYaml.isBlank()) {
                    composeYaml = composeService.generateYaml(topology);
                }

                Template template = Template.builder()
                        .slug(slug)
                        .name((String) data.get("name"))
                        .category((String) data.get("category"))
                        .description((String) data.get("description"))
                        .topology(topology)
                        .composeYaml(composeYaml)
                        .builtin(true)
                        .build();

                templateRepository.save(template);
                log.info("Seeded template: {}", slug);
            } catch (IOException e) {
                log.warn("Failed to seed template {}: {}", slug, e.getMessage());
            }
        }
    }

    private TemplateResponse toResponse(Template template) {
        return TemplateResponse.builder()
                .id(template.getId())
                .slug(template.getSlug())
                .name(template.getName())
                .category(template.getCategory())
                .description(template.getDescription())
                .topology(template.getTopology())
                .composeYaml(template.getComposeYaml())
                .build();
    }
}
