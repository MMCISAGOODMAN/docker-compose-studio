package com.dockercompose.studio.repository;

import com.dockercompose.studio.domain.Project;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ProjectRepository extends JpaRepository<Project, UUID> {
    List<Project> findByWorkspaceIdOrderByUpdatedAtDesc(UUID workspaceId);
}
