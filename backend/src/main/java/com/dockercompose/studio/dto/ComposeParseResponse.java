package com.dockercompose.studio.dto;

import java.util.Map;

public record ComposeParseResponse(Map<String, Object> topology, String composeYaml) {}
