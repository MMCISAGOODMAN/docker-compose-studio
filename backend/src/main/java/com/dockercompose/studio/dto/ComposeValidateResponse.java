package com.dockercompose.studio.dto;

import java.util.List;

public record ComposeValidateResponse(
        boolean valid,
        List<ValidationIssueResponse> errors,
        List<ValidationIssueResponse> warnings
) {}
