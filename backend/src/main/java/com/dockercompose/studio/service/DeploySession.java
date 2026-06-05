package com.dockercompose.studio.service;

import lombok.Getter;

import java.nio.file.Path;
import java.time.Instant;

@Getter
public class DeploySession {
    private final String deployId;
    private final Path workDir;
    private final String composeProjectName;
    private final Instant createdAt;
    private volatile String status;

    public DeploySession(String deployId, Path workDir, String composeProjectName) {
        this.deployId = deployId;
        this.workDir = workDir;
        this.composeProjectName = composeProjectName;
        this.createdAt = Instant.now();
        this.status = "DEPLOYING";
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
