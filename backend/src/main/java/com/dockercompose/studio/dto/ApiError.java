package com.dockercompose.studio.dto;

import java.util.Map;

public record ApiError(String code, String message, Map<String, Object> details) {}
