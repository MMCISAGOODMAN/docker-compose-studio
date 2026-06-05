package com.dockercompose.studio.service;

import com.dockercompose.studio.dto.AiGenerateResponse;
import com.dockercompose.studio.dto.CatalogServiceResponse;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.*;

@Service
@RequiredArgsConstructor
public class CatalogService {

    private final ObjectMapper objectMapper;
    private List<CatalogServiceResponse> catalog = List.of();

    @PostConstruct
    void loadCatalog() throws IOException {
        ClassPathResource resource = new ClassPathResource("catalog/services.json");
        catalog = objectMapper.readValue(
                resource.getContentAsString(StandardCharsets.UTF_8),
                new TypeReference<List<CatalogServiceResponse>>() {}
        );
    }

    public List<CatalogServiceResponse> listServices() {
        return catalog;
    }

    public CatalogServiceResponse getService(String id) {
        return catalog.stream()
                .filter(s -> s.id().equals(id))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Service not found: " + id));
    }

    public CatalogServiceResponse getServiceOrNull(String id) {
        return catalog.stream()
                .filter(s -> s.id().equals(id))
                .findFirst()
                .orElse(null);
    }
}
