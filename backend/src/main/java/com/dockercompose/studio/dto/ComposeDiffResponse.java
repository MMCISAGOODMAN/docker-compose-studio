package com.dockercompose.studio.dto;

import lombok.Builder;

import java.util.List;

@Builder
public record ComposeDiffResponse(
        List<String> added,
        List<String> removed,
        List<ChangeItem> changed
) {
    @Builder
    public record ChangeItem(String path, String from, String to) {}
}
