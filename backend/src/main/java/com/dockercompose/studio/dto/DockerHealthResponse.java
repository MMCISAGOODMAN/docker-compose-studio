package com.dockercompose.studio.dto;

public record DockerHealthResponse(boolean connected, String message, String version) {}
