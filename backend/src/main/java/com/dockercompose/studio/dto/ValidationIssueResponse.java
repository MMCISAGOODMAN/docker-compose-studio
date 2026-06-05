package com.dockercompose.studio.dto;

import java.util.List;

public record ValidationIssueResponse(
        String severity,
        String code,
        String message,
        String path,
        String service,
        Integer line
) {}
