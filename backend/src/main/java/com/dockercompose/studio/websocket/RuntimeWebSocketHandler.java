package com.dockercompose.studio.websocket;

import com.dockercompose.studio.dto.ContainerInfoResponse;
import com.dockercompose.studio.dto.ContainerStatsResponse;
import com.dockercompose.studio.service.DeploySessionManager;
import com.dockercompose.studio.service.DockerRuntimeService;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.concurrent.*;

@Component
@Slf4j
@RequiredArgsConstructor
public class RuntimeWebSocketHandler extends TextWebSocketHandler {

    private final DockerRuntimeService dockerRuntimeService;
    private final DeploySessionManager sessionManager;
    private final ObjectMapper objectMapper = new ObjectMapper();

    private final ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(2);
    private final Map<String, ScheduledFuture<?>> statusPollers = new ConcurrentHashMap<>();
    private final Map<String, String> activeLogStreams = new ConcurrentHashMap<>();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        String deployId = extractDeployId(session);
        if (deployId == null || sessionManager.get(deployId).isEmpty()) {
            closeWithError(session, "Invalid deploy session");
            return;
        }

        sendEvent(session, "deploy.connected", Map.of("deployId", deployId, "message", "Connected to runtime stream"));

        ScheduledFuture<?> poller = scheduler.scheduleAtFixedRate(() -> {
            if (!session.isOpen()) return;
            try {
                List<ContainerInfoResponse> containers = dockerRuntimeService.listContainers(deployId);
                sendEvent(session, "container.status", Map.of("containers", containers));

                for (ContainerInfoResponse c : containers) {
                    if ("running".equalsIgnoreCase(c.state())) {
                        ContainerStatsResponse stats = dockerRuntimeService.getStats(c.id());
                        sendEvent(session, "container.stats", stats);
                    }
                }
            } catch (Exception e) {
                log.debug("Status poll error for {}: {}", deployId, e.getMessage());
            }
        }, 0, 3, TimeUnit.SECONDS);

        statusPollers.put(session.getId(), poller);
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        String deployId = extractDeployId(session);
        if (deployId == null) return;

        @SuppressWarnings("unchecked")
        Map<String, Object> payload = objectMapper.readValue(message.getPayload(), Map.class);
        String type = (String) payload.get("type");

        if ("subscribe.logs".equals(type)) {
            String containerId = (String) payload.get("containerId");
            if (containerId == null) return;

            String streamKey = session.getId() + ":" + containerId;
            activeLogStreams.put(streamKey, containerId);

            dockerRuntimeService.streamLogs(deployId, containerId, line -> {
                if (session.isOpen()) {
                    sendEvent(session, "container.logs", Map.of(
                            "containerId", containerId,
                            "line", line,
                            "timestamp", System.currentTimeMillis()
                    ));
                }
            }, () -> activeLogStreams.remove(streamKey));
        } else if ("unsubscribe.logs".equals(type)) {
            String containerId = (String) payload.get("containerId");
            if (containerId != null) {
                dockerRuntimeService.stopLogStream(deployId + ":" + containerId);
                activeLogStreams.remove(session.getId() + ":" + containerId);
            }
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        ScheduledFuture<?> poller = statusPollers.remove(session.getId());
        if (poller != null) poller.cancel(false);

        String deployId = extractDeployId(session);
        if (deployId != null) {
            dockerRuntimeService.stopAllLogStreamsForDeploy(deployId);
        }
        activeLogStreams.keySet().removeIf(k -> k.startsWith(session.getId()));
    }

    private String extractDeployId(WebSocketSession session) {
        var uri = session.getUri();
        if (uri == null) return null;
        String path = uri.getPath();
        int idx = path.lastIndexOf('/');
        return idx >= 0 ? path.substring(idx + 1) : null;
    }

    private void sendEvent(WebSocketSession session, String type, Object payload) {
        try {
            if (session.isOpen()) {
                session.sendMessage(new TextMessage(objectMapper.writeValueAsString(Map.of(
                        "type", type,
                        "payload", payload
                ))));
            }
        } catch (IOException e) {
            log.debug("Failed to send WS message: {}", e.getMessage());
        }
    }

    private void closeWithError(WebSocketSession session, String message) {
        try {
            sendEvent(session, "error", Map.of("message", message));
            session.close(CloseStatus.BAD_DATA);
        } catch (IOException e) {
            log.debug("Failed to close WS session: {}", e.getMessage());
        }
    }
}
