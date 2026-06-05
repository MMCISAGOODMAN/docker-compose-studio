package com.dockercompose.studio.service;

import com.dockercompose.studio.dto.ComposeValidateResponse;
import com.dockercompose.studio.dto.ValidationIssueResponse;
import org.springframework.stereotype.Service;
import org.yaml.snakeyaml.Yaml;
import org.yaml.snakeyaml.error.MarkedYAMLException;

import java.util.*;
import java.util.regex.Pattern;

@Service
public class ComposeValidationService {

    private static final Pattern SERVICE_NAME = Pattern.compile("^[a-z][a-z0-9_-]*$");

    @SuppressWarnings("unchecked")
    public ComposeValidateResponse validateTopology(Map<String, Object> topology) {
        List<ValidationIssueResponse> errors = new ArrayList<>();
        List<ValidationIssueResponse> warnings = new ArrayList<>();

        List<Map<String, Object>> nodes = getList(topology, "nodes");
        List<Map<String, Object>> edges = getList(topology, "edges");

        if (nodes.isEmpty()) {
            warnings.add(issue("warning", "EMPTY_TOPOLOGY", "Canvas is empty — add at least one service", null, null, null));
            return response(errors, warnings);
        }

        Map<String, String> names = new HashMap<>();
        Map<Integer, String> hostPorts = new HashMap<>();

        for (Map<String, Object> node : nodes) {
            Map<String, Object> data = (Map<String, Object>) node.get("data");
            if (data == null) continue;

            String svc = stringVal(data.get("name"));
            if (svc.isBlank()) svc = stringVal(node.get("id"));

            if (stringVal(data.get("name")).isBlank()) {
                errors.add(issue("error", "MISSING_SERVICE_NAME", "Service name is required", "services." + node.get("id"), svc, null));
            } else if (!SERVICE_NAME.matcher(svc).matches()) {
                errors.add(issue("error", "INVALID_SERVICE_NAME",
                        "Service name \"" + svc + "\" must start with a lowercase letter and contain only [a-z0-9_-]",
                        "services." + svc, svc, null));
            }

            if (names.containsKey(svc)) {
                errors.add(issue("error", "DUPLICATE_SERVICE_NAME",
                        "Duplicate service name \"" + svc + "\"", "services." + svc, svc, null));
            } else {
                names.put(svc, stringVal(node.get("id")));
            }

            if (stringVal(data.get("image")).isBlank()) {
                errors.add(issue("error", "MISSING_IMAGE", "Docker image is required", "services." + svc + ".image", svc, null));
            }

            validatePorts(data, svc, errors, hostPorts);
            validateVolumes(data, svc, errors);
        }

        Map<String, String> idToName = new HashMap<>();
        for (Map<String, Object> node : nodes) {
            Map<String, Object> data = (Map<String, Object>) node.get("data");
            if (data != null) {
                idToName.put(stringVal(node.get("id")), stringVal(data.get("name")));
            }
        }

        Set<String> nameSet = new HashSet<>(names.keySet());
        Map<String, List<String>> graph = new HashMap<>();
        for (String n : nameSet) graph.put(n, new ArrayList<>());

        for (Map<String, Object> edge : edges) {
            String sourceName = idToName.get(stringVal(edge.get("source")));
            String targetName = idToName.get(stringVal(edge.get("target")));
            if (sourceName == null || targetName == null) {
                errors.add(issue("error", "INVALID_EDGE", "Dependency edge references a missing service", stringVal(edge.get("id")), null, null));
                continue;
            }
            if (!nameSet.contains(targetName)) {
                errors.add(issue("error", "MISSING_DEPENDENCY",
                        "Service \"" + sourceName + "\" depends on \"" + targetName + "\" which does not exist",
                        "services." + sourceName + ".depends_on", sourceName, null));
            } else {
                graph.computeIfAbsent(sourceName, k -> new ArrayList<>()).add(targetName);
            }
        }

        for (List<String> cycle : detectCycles(graph)) {
            errors.add(issue("error", "CIRCULAR_DEPENDENCY",
                    "Circular dependency: " + String.join(" → ", cycle) + " → " + cycle.get(0),
                    "services." + cycle.get(0) + ".depends_on", cycle.get(0), null));
        }

        return response(errors, warnings);
    }

    public ComposeValidateResponse validateYaml(String yamlContent) {
        List<ValidationIssueResponse> errors = new ArrayList<>();
        List<ValidationIssueResponse> warnings = new ArrayList<>();

        if (yamlContent == null || yamlContent.isBlank()) {
            errors.add(issue("error", "EMPTY_YAML", "Compose file is empty", null, null, null));
            return response(errors, warnings);
        }

        Map<String, Object> doc;
        try {
            doc = new Yaml().load(yamlContent);
        } catch (MarkedYAMLException e) {
            Integer line = e.getProblemMark() != null ? e.getProblemMark().getLine() + 1 : null;
            errors.add(issue("error", "YAML_SYNTAX", "YAML syntax error: " + e.getProblem(), null, null, line));
            return response(errors, warnings);
        } catch (Exception e) {
            errors.add(issue("error", "YAML_SYNTAX", "YAML syntax error: " + e.getMessage(), null, null, null));
            return response(errors, warnings);
        }

        if (doc == null || !(doc instanceof Map)) {
            errors.add(issue("error", "INVALID_ROOT", "Compose file must be a YAML mapping", null, null, null));
            return response(errors, warnings);
        }

        if (!doc.containsKey("services") || !(doc.get("services") instanceof Map)) {
            errors.add(issue("error", "MISSING_SERVICES", "Compose file must contain a top-level \"services\" section", "services", null, null));
            return response(errors, warnings);
        }

        @SuppressWarnings("unchecked")
        Map<String, Map<String, Object>> services = (Map<String, Map<String, Object>>) doc.get("services");
        List<String> serviceNames = new ArrayList<>(services.keySet());

        if (serviceNames.isEmpty()) {
            warnings.add(issue("warning", "EMPTY_SERVICES", "No services defined", "services", null, null));
        }

        Map<Integer, String> hostPorts = new HashMap<>();
        Map<String, List<String>> graph = new HashMap<>();

        for (Map.Entry<String, Map<String, Object>> entry : services.entrySet()) {
            String name = entry.getKey();
            Map<String, Object> config = entry.getValue();

            if (!SERVICE_NAME.matcher(name).matches()) {
                errors.add(issue("error", "INVALID_SERVICE_NAME",
                        "Service name \"" + name + "\" must start with a lowercase letter and contain only [a-z0-9_-]",
                        "services." + name, name, null));
            }

            if (config.get("image") == null || config.get("image").toString().isBlank()) {
                errors.add(issue("error", "MISSING_IMAGE", "Docker image is required", "services." + name + ".image", name, null));
            }

            if (config.get("ports") instanceof List<?> ports) {
                for (Object p : ports) {
                    if (p instanceof String s && s.contains(":")) {
                        try {
                            int host = Integer.parseInt(s.split(":")[0]);
                            String existing = hostPorts.get(host);
                            if (existing != null && !existing.equals(name)) {
                                errors.add(issue("error", "PORT_CONFLICT",
                                        "Host port " + host + " is used by both \"" + existing + "\" and \"" + name + "\"",
                                        "services." + name + ".ports", name, null));
                            } else {
                                hostPorts.put(host, name);
                            }
                        } catch (NumberFormatException ignored) {
                        }
                    }
                }
            }

            if (config.containsKey("depends_on")) {
                List<String> deps = normalizeDependsOn(config.get("depends_on"));
                graph.put(name, deps);
                for (String dep : deps) {
                    if (!serviceNames.contains(dep)) {
                        errors.add(issue("error", "MISSING_DEPENDENCY",
                                "Service \"" + name + "\" depends on \"" + dep + "\" which is not defined",
                                "services." + name + ".depends_on", name, null));
                    }
                }
            }
        }

        for (List<String> cycle : detectCycles(graph)) {
            errors.add(issue("error", "CIRCULAR_DEPENDENCY",
                    "Circular dependency: " + String.join(" → ", cycle) + " → " + cycle.get(0),
                    "services." + cycle.get(0) + ".depends_on", cycle.get(0), null));
        }

        return response(errors, warnings);
    }

    @SuppressWarnings("unchecked")
    private void validatePorts(Map<String, Object> data, String svc, List<ValidationIssueResponse> errors, Map<Integer, String> hostPorts) {
        if (!(data.get("ports") instanceof List<?> ports)) return;
        for (Object p : ports) {
            if (p instanceof Map<?, ?> portMap) {
                int host = toInt(portMap.get("host"));
                int container = toInt(portMap.get("container"));
                if (host < 1 || host > 65535) {
                    errors.add(issue("error", "INVALID_PORT", "Host port " + host + " is out of range (1–65535)", "services." + svc + ".ports", svc, null));
                }
                if (container < 1 || container > 65535) {
                    errors.add(issue("error", "INVALID_PORT", "Container port " + container + " is out of range (1–65535)", "services." + svc + ".ports", svc, null));
                }
                String existing = hostPorts.get(host);
                if (existing != null && !existing.equals(svc)) {
                    errors.add(issue("error", "PORT_CONFLICT",
                            "Host port " + host + " is used by both \"" + existing + "\" and \"" + svc + "\"",
                            "services." + svc + ".ports", svc, null));
                } else if (host > 0) {
                    hostPorts.put(host, svc);
                }
            }
        }
    }

    @SuppressWarnings("unchecked")
    private void validateVolumes(Map<String, Object> data, String svc, List<ValidationIssueResponse> errors) {
        if (!(data.get("volumes") instanceof List<?> volumes)) return;
        for (Object v : volumes) {
            if (v instanceof Map<?, ?> volMap) {
                if (stringVal(volMap.get("name")).isBlank() || stringVal(volMap.get("path")).isBlank()) {
                    errors.add(issue("error", "INVALID_VOLUME",
                            "Volume mapping requires both a name and container path (name:/path)",
                            "services." + svc + ".volumes", svc, null));
                }
            }
        }
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> getList(Map<String, Object> map, String key) {
        Object val = map.get(key);
        return val instanceof List<?> list ? (List<Map<String, Object>>) list : List.of();
    }

    private List<String> normalizeDependsOn(Object dependsOn) {
        if (dependsOn instanceof List<?> list) {
            return list.stream().map(Object::toString).toList();
        }
        if (dependsOn instanceof Map<?, ?> map) {
            return map.keySet().stream().map(Object::toString).toList();
        }
        return List.of();
    }

    private List<List<String>> detectCycles(Map<String, List<String>> graph) {
        List<List<String>> cycles = new ArrayList<>();
        Set<String> visited = new HashSet<>();
        Set<String> stack = new HashSet<>();

        for (String node : graph.keySet()) {
            dfs(node, graph, visited, stack, new ArrayList<>(), cycles);
        }
        return cycles;
    }

    private void dfs(String node, Map<String, List<String>> graph, Set<String> visited, Set<String> stack,
                     List<String> path, List<List<String>> cycles) {
        if (stack.contains(node)) {
            int idx = path.indexOf(node);
            if (idx >= 0) cycles.add(new ArrayList<>(path.subList(idx, path.size())));
            return;
        }
        if (visited.contains(node)) return;
        visited.add(node);
        stack.add(node);
        List<String> newPath = new ArrayList<>(path);
        newPath.add(node);
        for (String next : graph.getOrDefault(node, List.of())) {
            dfs(next, graph, visited, stack, newPath, cycles);
        }
        stack.remove(node);
    }

    private ValidationIssueResponse issue(String severity, String code, String message, String path, String service, Integer line) {
        return new ValidationIssueResponse(severity, code, message, path, service, line);
    }

    private ComposeValidateResponse response(List<ValidationIssueResponse> errors, List<ValidationIssueResponse> warnings) {
        return new ComposeValidateResponse(errors.isEmpty(), errors, warnings);
    }

    private String stringVal(Object o) {
        return o != null ? o.toString() : "";
    }

    private int toInt(Object o) {
        if (o instanceof Number n) return n.intValue();
        try {
            return Integer.parseInt(stringVal(o));
        } catch (NumberFormatException e) {
            return 0;
        }
    }
}
