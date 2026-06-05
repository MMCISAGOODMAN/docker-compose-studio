package com.dockercompose.studio.service;

import com.dockercompose.studio.dto.ContainerInfoResponse;
import com.dockercompose.studio.dto.ContainerStatsResponse;
import com.dockercompose.studio.dto.DockerHealthResponse;
import com.dockercompose.studio.dto.RuntimeDeployResponse;
import com.github.dockerjava.api.DockerClient;
import com.github.dockerjava.api.model.Container;
import com.github.dockerjava.core.DefaultDockerClientConfig;
import com.github.dockerjava.core.DockerClientImpl;
import com.github.dockerjava.httpclient5.ApacheDockerHttpClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.yaml.snakeyaml.Yaml;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;
import java.util.function.Consumer;

@Service
@Slf4j
@RequiredArgsConstructor
public class DockerRuntimeService {

    private final DeploySessionManager sessionManager;

    @Value("${dcs.docker.enabled:false}")
    private boolean dockerEnabled;

    @Value("${dcs.docker.host:unix:///var/run/docker.sock}")
    private String dockerHost;

    @Value("${dcs.docker.deploy-dir:${java.io.tmpdir}/dcs-deployments}")
    private String deployBaseDir;

    private DockerClient dockerClient;
    private final Map<String, Thread> activeLogThreads = new ConcurrentHashMap<>();

    public DockerHealthResponse health() {
        if (!dockerEnabled) {
            return new DockerHealthResponse(false, "Docker integration disabled. Set DOCKER_ENABLED=true", null);
        }
        try {
            var version = getClient().versionCmd().exec();
            return new DockerHealthResponse(true, "Connected to Docker Engine", version.getVersion());
        } catch (Exception e) {
            log.warn("Docker health check failed: {}", e.getMessage());
            return new DockerHealthResponse(false, "Cannot connect: " + e.getMessage(), null);
        }
    }

    public RuntimeDeployResponse deploy(String composeYaml, String projectName) throws IOException, InterruptedException {
        ensureDockerEnabled();

        String composeProjectName = resolveProjectName(composeYaml, projectName);
        Path workDir = Path.of(deployBaseDir, composeProjectName + "-" + System.currentTimeMillis());
        DeploySession session = sessionManager.create(workDir, composeProjectName);

        Files.createDirectories(workDir);
        Path composeFile = workDir.resolve("docker-compose.yml");
        Files.writeString(composeFile, composeYaml);

        ProcessBuilder pb = new ProcessBuilder(
                "docker", "compose",
                "-f", composeFile.toString(),
                "-p", composeProjectName,
                "up", "-d", "--remove-orphans"
        );
        pb.directory(workDir.toFile());
        pb.redirectErrorStream(true);

        Process process = pb.start();
        String output = readProcessOutput(process);
        boolean finished = process.waitFor(5, TimeUnit.MINUTES);

        if (!finished) {
            process.destroyForcibly();
            session.setStatus("FAILED");
            throw new IOException("Docker compose up timed out");
        }

        if (process.exitValue() != 0) {
            session.setStatus("FAILED");
            throw new IOException("Docker compose up failed: " + output);
        }

        session.setStatus("RUNNING");
        return new RuntimeDeployResponse(
                session.getDeployId(),
                "RUNNING",
                "Environment deployed successfully",
                composeProjectName
        );
    }

    public void stop(String deployId) throws IOException, InterruptedException {
        ensureDockerEnabled();
        DeploySession session = sessionManager.get(deployId)
                .orElseThrow(() -> new IllegalArgumentException("Deploy session not found: " + deployId));

        stopLogStream(deployId);

        Path composeFile = session.getWorkDir().resolve("docker-compose.yml");
        if (Files.exists(composeFile)) {
            ProcessBuilder pb = new ProcessBuilder(
                    "docker", "compose",
                    "-f", composeFile.toString(),
                    "-p", session.getComposeProjectName(),
                    "down", "--remove-orphans"
            );
            pb.directory(session.getWorkDir().toFile());
            pb.redirectErrorStream(true);
            Process process = pb.start();
            process.waitFor(3, TimeUnit.MINUTES);
        }

        session.setStatus("STOPPED");
        sessionManager.remove(deployId);
    }

    public List<ContainerInfoResponse> listContainers(String deployId) {
        ensureDockerEnabled();
        DeploySession session = sessionManager.get(deployId)
                .orElseThrow(() -> new IllegalArgumentException("Deploy session not found: " + deployId));

        return getClient().listContainersCmd()
                .withShowAll(true)
                .withLabelFilter(Map.of("com.docker.compose.project", session.getComposeProjectName()))
                .exec()
                .stream()
                .map(this::toContainerInfo)
                .toList();
    }

    public ContainerStatsResponse getStats(String containerId) {
        ensureDockerEnabled();
        try {
            ProcessBuilder pb = new ProcessBuilder(
                    "docker", "stats", containerId, "--no-stream",
                    "--format", "{{.CPUPerc}},{{.MemUsage}},{{.MemPerc}}"
            );
            Process process = pb.start();
            String output = readProcessOutput(process);
            process.waitFor(5, TimeUnit.SECONDS);

            if (output.isBlank()) {
                return new ContainerStatsResponse(containerId, 0, 0, 0, 0);
            }

            String[] parts = output.trim().split(",");
            double cpu = parsePercent(parts.length > 0 ? parts[0] : "0");
            long memUsageMb = 0;
            long memLimitMb = 0;
            if (parts.length > 1) {
                String[] memParts = parts[1].split("/");
                memUsageMb = parseMemoryMb(memParts[0].trim());
                if (memParts.length > 1) {
                    memLimitMb = parseMemoryMb(memParts[1].trim());
                }
            }
            double memPercent = parts.length > 2 ? parsePercent(parts[2]) : 0;

            return new ContainerStatsResponse(containerId, cpu, memUsageMb, memLimitMb, memPercent);
        } catch (Exception e) {
            log.debug("Failed to get stats for {}: {}", containerId, e.getMessage());
            return new ContainerStatsResponse(containerId, 0, 0, 0, 0);
        }
    }

    private double parsePercent(String value) {
        try {
            return Double.parseDouble(value.replace("%", "").trim());
        } catch (NumberFormatException e) {
            return 0;
        }
    }

    private long parseMemoryMb(String value) {
        try {
            value = value.toUpperCase().trim();
            if (value.endsWith("GIB") || value.endsWith("GB")) {
                return Math.round(Double.parseDouble(value.replaceAll("[^0-9.]", "")) * 1024);
            }
            if (value.endsWith("MIB") || value.endsWith("MB")) {
                return Math.round(Double.parseDouble(value.replaceAll("[^0-9.]", "")));
            }
            if (value.endsWith("KIB") || value.endsWith("KB")) {
                return Math.round(Double.parseDouble(value.replaceAll("[^0-9.]", "")) / 1024);
            }
            return Long.parseLong(value.replaceAll("[^0-9]", ""));
        } catch (NumberFormatException e) {
            return 0;
        }
    }

    public void streamLogs(String deployId, String containerId, Consumer<String> onLine, Runnable onComplete) {
        ensureDockerEnabled();
        String key = deployId + ":" + containerId;
        stopLogStream(key);

        Thread thread = new Thread(() -> {
            try {
                ProcessBuilder pb = new ProcessBuilder("docker", "logs", "-f", "--tail", "100", containerId);
                pb.redirectErrorStream(true);
                Process process = pb.start();
                try (var reader = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
                    String line;
                    while ((line = reader.readLine()) != null && !Thread.currentThread().isInterrupted()) {
                        onLine.accept(line);
                    }
                }
                process.destroyForcibly();
            } catch (Exception e) {
                log.debug("Log stream ended for {}: {}", containerId, e.getMessage());
            } finally {
                activeLogThreads.remove(key);
                onComplete.run();
            }
        }, "log-stream-" + containerId);
        thread.setDaemon(true);
        activeLogThreads.put(key, thread);
        thread.start();
    }

    public void stopLogStream(String key) {
        Thread thread = activeLogThreads.remove(key);
        if (thread != null && thread.isAlive()) {
            thread.interrupt();
        }
    }

    public void stopAllLogStreamsForDeploy(String deployId) {
        activeLogThreads.keySet().stream()
                .filter(k -> k.startsWith(deployId + ":"))
                .toList()
                .forEach(this::stopLogStream);
    }

    private ContainerInfoResponse toContainerInfo(Container c) {
        String service = "";
        if (c.getLabels() != null) {
            service = c.getLabels().getOrDefault("com.docker.compose.service", "");
        }

        String health = "none";
        if (c.getStatus() != null && c.getStatus().contains("(healthy)")) {
            health = "healthy";
        } else if (c.getStatus() != null && c.getStatus().contains("(unhealthy)")) {
            health = "unhealthy";
        } else if ("running".equalsIgnoreCase(c.getState())) {
            health = "running";
        }

        String ports = c.getPorts() != null
                ? Arrays.stream(c.getPorts())
                .map(p -> p.getPublicPort() + ":" + p.getPrivatePort())
                .reduce((a, b) -> a + ", " + b)
                .orElse("")
                : "";

        return new ContainerInfoResponse(
                c.getId(),
                c.getNames() != null && c.getNames().length > 0 ? c.getNames()[0].replaceFirst("/", "") : "",
                service,
                c.getImage(),
                c.getStatus(),
                c.getState(),
                health,
                ports
        );
    }

    @SuppressWarnings("unchecked")
    private String resolveProjectName(String composeYaml, String projectName) {
        if (projectName != null && !projectName.isBlank()) {
            return projectName.replaceAll("[^a-zA-Z0-9-]", "-").toLowerCase();
        }
        try {
            Yaml yaml = new Yaml();
            Map<String, Object> doc = yaml.load(composeYaml);
            if (doc != null && doc.get("name") != null) {
                return doc.get("name").toString().replaceAll("[^a-zA-Z0-9-]", "-").toLowerCase();
            }
        } catch (Exception ignored) {
        }
        return "dcs-env";
    }

    private void ensureDockerEnabled() {
        if (!dockerEnabled) {
            throw new IllegalStateException("Docker integration is disabled. Set DOCKER_ENABLED=true");
        }
    }

    private DockerClient getClient() {
        if (dockerClient == null) {
            var config = DefaultDockerClientConfig.createDefaultConfigBuilder()
                    .withDockerHost(dockerHost)
                    .build();

            var httpClient = new ApacheDockerHttpClient.Builder()
                    .dockerHost(config.getDockerHost())
                    .sslConfig(config.getSSLConfig())
                    .maxConnections(100)
                    .connectionTimeout(Duration.ofSeconds(30))
                    .responseTimeout(Duration.ofSeconds(45))
                    .build();

            dockerClient = DockerClientImpl.getInstance(config, httpClient);
        }
        return dockerClient;
    }

    private String readProcessOutput(Process process) throws IOException {
        try (var reader = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
            return reader.lines().reduce("", (a, b) -> a + b + "\n");
        }
    }
}
