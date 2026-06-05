package com.dockercompose.studio.service;

import org.springframework.stereotype.Service;

import java.nio.file.Path;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class DeploySessionManager {

    private final Map<String, DeploySession> sessions = new ConcurrentHashMap<>();

    public DeploySession create(Path workDir, String composeProjectName) {
        String deployId = UUID.randomUUID().toString().substring(0, 8);
        DeploySession session = new DeploySession(deployId, workDir, composeProjectName);
        sessions.put(deployId, session);
        return session;
    }

    public Optional<DeploySession> get(String deployId) {
        return Optional.ofNullable(sessions.get(deployId));
    }

    public void remove(String deployId) {
        sessions.remove(deployId);
    }
}
