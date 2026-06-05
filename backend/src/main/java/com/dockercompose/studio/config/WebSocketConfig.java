package com.dockercompose.studio.config;

import com.dockercompose.studio.websocket.RuntimeWebSocketHandler;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

@Configuration
@EnableWebSocket
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketConfigurer {

    private final RuntimeWebSocketHandler runtimeWebSocketHandler;

    @Value("${dcs.cors.allowed-origins}")
    private String allowedOrigins;

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(runtimeWebSocketHandler, "/ws/runtime/{deployId}")
                .setAllowedOrigins(allowedOrigins.split(","));
    }
}
