package com.dockercompose.studio.service;

import com.dockercompose.studio.dto.ComposeDiffResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.yaml.snakeyaml.DumperOptions;
import org.yaml.snakeyaml.Yaml;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.*;

@Service
@RequiredArgsConstructor
public class ComposeService {

    private final ObjectMapper objectMapper;

    @SuppressWarnings("unchecked")
    public String generateYaml(Map<String, Object> topology) {
        List<Map<String, Object>> nodes = getNodes(topology);
        List<Map<String, Object>> edges = getEdges(topology);

        Map<String, Object> compose = new LinkedHashMap<>();
        compose.put("name", "dcs-environment");

        Map<String, Object> services = new LinkedHashMap<>();
        Map<String, List<String>> dependsOnMap = buildDependsOnMap(edges, nodes);

        for (Map<String, Object> node : nodes) {
            Map<String, Object> data = (Map<String, Object>) node.get("data");
            if (data == null) continue;

            String serviceName = (String) data.getOrDefault("name", node.get("id"));
            Map<String, Object> service = buildServiceConfig(data, dependsOnMap.get(serviceName));
            services.put(serviceName, service);
        }

        compose.put("services", services);

        Map<String, Object> networks = new LinkedHashMap<>();
        networks.put("dcs-network", Map.of("driver", "bridge"));
        compose.put("networks", networks);

        Map<String, Object> volumes = collectNamedVolumes(nodes);
        if (!volumes.isEmpty()) {
            compose.put("volumes", volumes);
        }

        DumperOptions options = new DumperOptions();
        options.setDefaultFlowStyle(DumperOptions.FlowStyle.BLOCK);
        options.setIndent(2);
        options.setPrettyFlow(true);

        Yaml yaml = new Yaml(options);
        return yaml.dump(compose);
    }

    @SuppressWarnings("unchecked")
    public Map<String, Object> parseYaml(String yamlContent) {
        Yaml yaml = new Yaml();
        Map<String, Object> compose = yaml.load(yamlContent);
        if (compose == null || !compose.containsKey("services")) {
            throw new IllegalArgumentException("Invalid compose file: missing services section");
        }

        Map<String, Object> services = (Map<String, Object>) compose.get("services");
        List<Map<String, Object>> nodes = new ArrayList<>();
        List<Map<String, Object>> edges = new ArrayList<>();

        int x = 100;
        int y = 100;
        int index = 0;

        for (Map.Entry<String, Object> entry : services.entrySet()) {
            String name = entry.getKey();
            Map<String, Object> config = (Map<String, Object>) entry.getValue();

            Map<String, Object> data = new LinkedHashMap<>();
            data.put("catalogId", inferCatalogId(config));
            data.put("name", name);
            data.put("image", config.get("image"));
            data.put("ports", parsePorts(config.get("ports")));
            data.put("volumes", parseVolumes(config.get("volumes")));
            data.put("environment", config.getOrDefault("environment", Map.of()));
            if (config.containsKey("healthcheck")) {
                data.put("healthcheck", config.get("healthcheck"));
            }
            if (config.containsKey("deploy")) {
                data.put("resources", config.get("deploy"));
            }

            String nodeId = "svc-" + name + "-" + index;
            nodes.add(Map.of(
                    "id", nodeId,
                    "type", "serviceNode",
                    "position", Map.of("x", x, "y", y),
                    "data", data
            ));

            x += 250;
            if (index % 3 == 2) {
                x = 100;
                y += 180;
            }
            index++;
        }

        // Build edges from depends_on
        index = 0;
        for (Map.Entry<String, Object> entry : services.entrySet()) {
            String name = entry.getKey();
            Map<String, Object> config = (Map<String, Object>) entry.getValue();
            String sourceId = findNodeId(nodes, name);

            if (config.containsKey("depends_on")) {
                Object dependsOn = config.get("depends_on");
                List<String> deps = new ArrayList<>();
                if (dependsOn instanceof List<?> list) {
                    list.forEach(d -> deps.add(d.toString()));
                } else if (dependsOn instanceof Map<?, ?> map) {
                    map.keySet().forEach(k -> deps.add(k.toString()));
                }

                for (String dep : deps) {
                    String targetId = findNodeId(nodes, dep);
                    if (targetId != null) {
                        edges.add(Map.of(
                                "id", "e-" + sourceId + "-" + targetId,
                                "source", sourceId,
                                "target", targetId,
                                "type", "dependency"
                        ));
                    }
                }
            }
            index++;
        }

        return Map.of("nodes", nodes, "edges", edges);
    }

    @SuppressWarnings("unchecked")
    public ComposeDiffResponse diff(String sourceYaml, String targetYaml) {
        Yaml yaml = new Yaml();
        Map<String, Object> source = yaml.load(sourceYaml);
        Map<String, Object> target = yaml.load(targetYaml);

        if (source == null) source = Map.of();
        if (target == null) target = Map.of();

        List<String> added = new ArrayList<>();
        List<String> removed = new ArrayList<>();
        List<ComposeDiffResponse.ChangeItem> changed = new ArrayList<>();

        diffMaps("", flatten(source), flatten(target), added, removed, changed);

        return ComposeDiffResponse.builder()
                .added(added)
                .removed(removed)
                .changed(changed)
                .build();
    }

    private void diffMaps(String prefix, Map<String, String> source, Map<String, String> target,
                          List<String> added, List<String> removed,
                          List<ComposeDiffResponse.ChangeItem> changed) {
        Set<String> allKeys = new TreeSet<>();
        allKeys.addAll(source.keySet());
        allKeys.addAll(target.keySet());

        for (String key : allKeys) {
            String path = prefix.isEmpty() ? key : prefix + "." + key;
            boolean inSource = source.containsKey(key);
            boolean inTarget = target.containsKey(key);

            if (inSource && !inTarget) {
                removed.add(path);
            } else if (!inSource && inTarget) {
                added.add(path);
            } else if (inSource && inTarget && !Objects.equals(source.get(key), target.get(key))) {
                changed.add(ComposeDiffResponse.ChangeItem.builder()
                        .path(path)
                        .from(source.get(key))
                        .to(target.get(key))
                        .build());
            }
        }
    }

    @SuppressWarnings("unchecked")
    private Map<String, String> flatten(Map<String, Object> map) {
        Map<String, String> result = new LinkedHashMap<>();
        flattenRecursive("", map, result);
        return result;
    }

    @SuppressWarnings("unchecked")
    private void flattenRecursive(String prefix, Map<String, Object> map, Map<String, String> result) {
        for (Map.Entry<String, Object> entry : map.entrySet()) {
            String key = prefix.isEmpty() ? entry.getKey() : prefix + "." + entry.getKey();
            Object value = entry.getValue();
            if (value instanceof Map<?, ?> nested) {
                flattenRecursive(key, (Map<String, Object>) nested, result);
            } else if (value instanceof List<?> list) {
                result.put(key, list.toString());
            } else if (value != null) {
                result.put(key, value.toString());
            }
        }
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> buildServiceConfig(Map<String, Object> data, List<String> dependsOn) {
        Map<String, Object> service = new LinkedHashMap<>();
        service.put("image", data.get("image"));

        if (data.get("ports") instanceof List<?> ports && !ports.isEmpty()) {
            service.put("ports", formatPorts(ports));
        }

        if (data.get("volumes") instanceof List<?> volumes && !volumes.isEmpty()) {
            service.put("volumes", formatVolumes(volumes));
        }

        if (data.get("environment") instanceof Map<?, ?> env && !env.isEmpty()) {
            service.put("environment", env);
        }

        if (dependsOn != null && !dependsOn.isEmpty()) {
            Map<String, Object> deps = new LinkedHashMap<>();
            for (String dep : dependsOn) {
                deps.put(dep, Map.of("condition", "service_healthy"));
            }
            service.put("depends_on", deps);
        }

        if (data.get("healthcheck") instanceof Map<?, ?> hc) {
            service.put("healthcheck", hc);
        }

        if (data.get("command") != null) {
            service.put("command", data.get("command"));
        }

        service.put("networks", List.of("dcs-network"));
        service.put("restart", "unless-stopped");

        return service;
    }

    @SuppressWarnings("unchecked")
    private Map<String, List<String>> buildDependsOnMap(List<Map<String, Object>> edges,
                                                         List<Map<String, Object>> nodes) {
        Map<String, String> idToName = new HashMap<>();
        for (Map<String, Object> node : nodes) {
            Map<String, Object> data = (Map<String, Object>) node.get("data");
            idToName.put((String) node.get("id"), (String) data.get("name"));
        }

        Map<String, List<String>> result = new HashMap<>();
        for (Map<String, Object> edge : edges) {
            String sourceName = idToName.get(edge.get("source"));
            String targetName = idToName.get(edge.get("target"));
            if (sourceName != null && targetName != null) {
                result.computeIfAbsent(sourceName, k -> new ArrayList<>()).add(targetName);
            }
        }
        return result;
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> collectNamedVolumes(List<Map<String, Object>> nodes) {
        Map<String, Object> volumes = new LinkedHashMap<>();
        for (Map<String, Object> node : nodes) {
            Map<String, Object> data = (Map<String, Object>) node.get("data");
            if (data.get("volumes") instanceof List<?> volList) {
                for (Object vol : volList) {
                    if (vol instanceof Map<?, ?> volMap) {
                        String name = (String) volMap.get("name");
                        if (name != null && !name.isBlank()) {
                            volumes.putIfAbsent(name, Map.of());
                        }
                    }
                }
            }
        }
        return volumes;
    }

    @SuppressWarnings("unchecked")
    private List<String> formatPorts(List<?> ports) {
        List<String> result = new ArrayList<>();
        for (Object port : ports) {
            if (port instanceof Map<?, ?> p) {
                result.add(p.get("host") + ":" + p.get("container"));
            } else {
                result.add(port.toString());
            }
        }
        return result;
    }

    @SuppressWarnings("unchecked")
    private List<String> formatVolumes(List<?> volumes) {
        List<String> result = new ArrayList<>();
        for (Object vol : volumes) {
            if (vol instanceof Map<?, ?> v) {
                String name = (String) v.get("name");
                String path = (String) v.get("path");
                if (name != null && path != null) {
                    result.add(name + ":" + path);
                }
            } else {
                result.add(vol.toString());
            }
        }
        return result;
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> getNodes(Map<String, Object> topology) {
        Object nodes = topology.get("nodes");
        return nodes instanceof List<?> list ? (List<Map<String, Object>>) list : List.of();
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> getEdges(Map<String, Object> topology) {
        Object edges = topology.get("edges");
        return edges instanceof List<?> list ? (List<Map<String, Object>>) list : List.of();
    }

    private String findNodeId(List<Map<String, Object>> nodes, String serviceName) {
        for (Map<String, Object> node : nodes) {
            Map<String, Object> data = (Map<String, Object>) node.get("data");
            if (serviceName.equals(data.get("name"))) {
                return (String) node.get("id");
            }
        }
        return null;
    }

    @SuppressWarnings("unchecked")
    private String inferCatalogId(Map<String, Object> config) {
        String image = config.getOrDefault("image", "").toString().toLowerCase();
        if (image.contains("postgres")) return "postgresql";
        if (image.contains("mysql")) return "mysql";
        if (image.contains("mongo")) return "mongodb";
        if (image.contains("redis")) return "redis";
        if (image.contains("kafka")) return "kafka";
        if (image.contains("rabbitmq")) return "rabbitmq";
        if (image.contains("minio")) return "minio";
        if (image.contains("elastic")) return "elasticsearch";
        if (image.contains("nginx")) return "nginx";
        if (image.contains("ollama")) return "ollama";
        if (image.contains("open-webui")) return "openwebui";
        if (image.contains("qdrant")) return "qdrant";
        return "custom";
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> parsePorts(Object ports) {
        if (!(ports instanceof List<?> list)) return List.of();
        List<Map<String, Object>> result = new ArrayList<>();
        for (Object p : list) {
            if (p instanceof String s && s.contains(":")) {
                String[] parts = s.split(":");
                result.add(Map.of("host", Integer.parseInt(parts[0]), "container", Integer.parseInt(parts[1])));
            }
        }
        return result;
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> parseVolumes(Object volumes) {
        if (!(volumes instanceof List<?> list)) return List.of();
        List<Map<String, Object>> result = new ArrayList<>();
        for (Object v : list) {
            if (v instanceof String s && s.contains(":")) {
                String[] parts = s.split(":", 2);
                result.add(Map.of("name", parts[0], "path", parts[1]));
            }
        }
        return result;
    }
}
