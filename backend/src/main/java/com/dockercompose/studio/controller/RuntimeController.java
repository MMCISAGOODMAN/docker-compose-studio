package com.dockercompose.studio.controller;

import com.dockercompose.studio.dto.*;
import com.dockercompose.studio.service.DockerRuntimeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/runtime")
@RequiredArgsConstructor
public class RuntimeController {

    private final DockerRuntimeService dockerRuntimeService;

    @PostMapping("/deploy")
    @ResponseStatus(HttpStatus.CREATED)
    public RuntimeDeployResponse deploy(@Valid @RequestBody RuntimeDeployRequest request) throws Exception {
        return dockerRuntimeService.deploy(request.composeYaml(), request.projectName());
    }

    @PostMapping("/stop")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void stop(@Valid @RequestBody RuntimeStopRequest request) throws Exception {
        dockerRuntimeService.stop(request.deployId());
    }

    @GetMapping("/containers")
    public List<ContainerInfoResponse> listContainers(@RequestParam String deployId) {
        return dockerRuntimeService.listContainers(deployId);
    }

    @GetMapping("/containers/{containerId}/stats")
    public ContainerStatsResponse getStats(@PathVariable String containerId) {
        return dockerRuntimeService.getStats(containerId);
    }
}
