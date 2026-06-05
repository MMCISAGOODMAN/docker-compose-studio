package com.dockercompose.studio.controller;

import com.dockercompose.studio.dto.DeployResponse;
import com.dockercompose.studio.dto.DockerHealthResponse;
import com.dockercompose.studio.service.DockerRuntimeService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/docker")
@RequiredArgsConstructor
public class DockerController {

    private final DockerRuntimeService dockerRuntimeService;

    @GetMapping("/health")
    public DockerHealthResponse health() {
        return dockerRuntimeService.health();
    }
}
