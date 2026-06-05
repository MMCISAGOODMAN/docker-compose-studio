package com.dockercompose.studio.controller;

import com.dockercompose.studio.dto.*;
import com.dockercompose.studio.service.AiTopologyService;
import com.dockercompose.studio.service.CatalogService;
import com.dockercompose.studio.service.ComposeService;
import com.dockercompose.studio.service.ComposeValidationService;
import com.dockercompose.studio.service.TemplateService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class ComposeController {

    private final ComposeService composeService;
    private final ComposeValidationService composeValidationService;
    private final CatalogService catalogService;
    private final TemplateService templateService;
    private final AiTopologyService aiTopologyService;

    @PostMapping("/compose/generate")
    public ComposeGenerateResponse generate(@Valid @RequestBody ComposeGenerateRequest request) {
        return new ComposeGenerateResponse(composeService.generateYaml(request.topology()));
    }

    @PostMapping("/compose/parse")
    public ComposeParseResponse parse(@Valid @RequestBody ComposeParseRequest request) {
        Map<String, Object> topology = composeService.parseYaml(request.yaml());
        return new ComposeParseResponse(topology, request.yaml());
    }

    @PostMapping("/compose/diff")
    public ComposeDiffResponse diff(@Valid @RequestBody ComposeDiffRequest request) {
        return composeService.diff(request.source(), request.target());
    }

    @PostMapping("/compose/validate/yaml")
    public ComposeValidateResponse validateYaml(@Valid @RequestBody ComposeValidateYamlRequest request) {
        return composeValidationService.validateYaml(request.yaml());
    }

    @PostMapping("/compose/validate/topology")
    public ComposeValidateResponse validateTopology(@Valid @RequestBody ComposeValidateTopologyRequest request) {
        return composeValidationService.validateTopology(request.topology());
    }

    @GetMapping("/catalog/services")
    public List<CatalogServiceResponse> listCatalog() {
        return catalogService.listServices();
    }

    @GetMapping("/catalog/services/{id}")
    public CatalogServiceResponse getCatalogService(@PathVariable String id) {
        return catalogService.getService(id);
    }

    @GetMapping("/templates")
    public List<TemplateResponse> listTemplates(@RequestParam(required = false) String category) {
        return templateService.listTemplates(category);
    }

    @GetMapping("/templates/{slug}")
    public TemplateResponse getTemplate(@PathVariable String slug) {
        return templateService.getBySlug(slug);
    }

    @PostMapping("/templates/{slug}/instantiate")
    @ResponseStatus(HttpStatus.CREATED)
    public ProjectResponse instantiateTemplate(@PathVariable String slug) {
        return templateService.instantiate(slug);
    }

    @PostMapping("/ai/generate-topology")
    public AiGenerateResponse generateTopology(@Valid @RequestBody AiGenerateRequest request) {
        return aiTopologyService.generate(request.prompt(), request.provider());
    }

    @GetMapping("/ai/status")
    public AiStatusResponse aiStatus() {
        return aiTopologyService.status(null);
    }

    @PostMapping("/ai/status")
    public AiStatusResponse aiStatusWithOverride(@RequestBody(required = false) AiProviderOverrideRequest override) {
        return aiTopologyService.status(override);
    }
}
