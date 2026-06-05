package com.dockercompose.studio.repository;

import com.dockercompose.studio.domain.DeployRun;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface DeployRunRepository extends JpaRepository<DeployRun, UUID> {
    List<DeployRun> findByProjectIdOrderByStartedAtDesc(UUID projectId);
}
