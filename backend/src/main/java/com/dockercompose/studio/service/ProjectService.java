package com.dockercompose.studio.service;

import com.dockercompose.studio.domain.Project;
import com.dockercompose.studio.domain.ProjectStatus;
import com.dockercompose.studio.dto.ProjectRequest;
import com.dockercompose.studio.dto.ProjectResponse;
import com.dockercompose.studio.repository.ProjectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ProjectService {

    private static final UUID DEFAULT_WORKSPACE = UUID.fromString("00000000-0000-0000-0000-000000000001");

    private final ProjectRepository projectRepository;
    private final ComposeService composeService;

    @Transactional(readOnly = true)
    public List<ProjectResponse> listProjects() {
        return projectRepository.findByWorkspaceIdOrderByUpdatedAtDesc(DEFAULT_WORKSPACE)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public ProjectResponse getProject(UUID id) {
        return toResponse(findOrThrow(id));
    }

    @Transactional
    public ProjectResponse createProject(ProjectRequest request) {
        String yaml = request.composeYaml();
        if (yaml == null || yaml.isBlank()) {
            yaml = composeService.generateYaml(request.topology());
        }

        Project project = Project.builder()
                .workspaceId(DEFAULT_WORKSPACE)
                .name(request.name())
                .description(request.description())
                .topology(new HashMap<>(request.topology()))
                .composeYaml(yaml)
                .status(ProjectStatus.DRAFT)
                .build();

        return toResponse(projectRepository.save(project));
    }

    @Transactional
    public ProjectResponse updateProject(UUID id, ProjectRequest request) {
        Project project = findOrThrow(id);
        project.setName(request.name());
        project.setDescription(request.description());
        project.setTopology(new HashMap<>(request.topology()));

        if (request.composeYaml() != null && !request.composeYaml().isBlank()) {
            project.setComposeYaml(request.composeYaml());
        } else {
            project.setComposeYaml(composeService.generateYaml(request.topology()));
        }

        return toResponse(projectRepository.save(project));
    }

    @Transactional
    public void deleteProject(UUID id) {
        projectRepository.delete(findOrThrow(id));
    }

    private Project findOrThrow(UUID id) {
        return projectRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Project not found: " + id));
    }

    private ProjectResponse toResponse(Project project) {
        return ProjectResponse.builder()
                .id(project.getId())
                .name(project.getName())
                .description(project.getDescription())
                .topology(project.getTopology())
                .composeYaml(project.getComposeYaml())
                .status(project.getStatus())
                .createdAt(project.getCreatedAt())
                .updatedAt(project.getUpdatedAt())
                .build();
    }
}
