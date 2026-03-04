package com.cola.agent.core;

import com.cola.agent.config.WorkspaceConfig;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.HashMap;

/**
 * Agent Loader - Load agent definitions from Markdown files
 *
 * Scans the agents directory, parses Markdown files with frontmatter,
 * and creates Agent instances
 */
@Slf4j
@Component
public class AgentLoader {

    private final WorkspaceConfig workspaceConfig;

    public AgentLoader(WorkspaceConfig workspaceConfig) {
        this.workspaceConfig = workspaceConfig;
    }

    /**
     * Load all agents from the agents directory
     */
    public Map<String, Agent> loadAllAgents() {
        Map<String, Agent> agents = new HashMap<>();

        String agentsDir = workspaceConfig.getAgentsDirectoryPath();
        File dir = new File(agentsDir);

        if (!dir.exists() || !dir.isDirectory()) {
            log.warn("Agents directory does not exist: {}", agentsDir);
            return agents;
        }

        log.info("Loading agents from directory: {}", agentsDir);

        // Find all Markdown files
        File[] files = dir.listFiles((d, name) -> name.endsWith(".md") || name.endsWith(".markdown"));

        if (files == null || files.length == 0) {
            log.warn("No agent definition files found in: {}", agentsDir);
            return agents;
        }

        // Parse each file
        for (File file : files) {
            try {
                Agent agent = loadAgentFromFile(file);
                if (agent != null) {
                    agents.put(agent.getId(), agent);
                }
            } catch (Exception e) {
                log.error("Failed to load agent from file: {}", file.getName(), e);
            }
        }

        log.info("Successfully loaded {} agents", agents.size());
        return agents;
    }

    /**
     * Load agent from a single Markdown file
     */
    public Agent loadAgentFromFile(File file) throws IOException {
        log.info("Loading agent from file: {}", file.getName());

        // Read file content
        String content = Files.readString(file.toPath());

        // Parse frontmatter and markdown body
        AgentMarkdown markdown = parseAgentMarkdown(content);

        // Create AgentConfig
        com.cola.agent.config.AgentConfig config = new com.cola.agent.config.AgentConfig();
        config.setName(markdown.name);
        config.setProvider(markdown.provider);
        config.setModel(markdown.model);
        config.setTemperature(markdown.temperature);
        config.setMaxTokens(markdown.maxTokens);
        config.setSystemPrompt(markdown.body);

        // Parse role, capabilities, preferences, memory guidelines from body
        parseAgentBody(markdown.body, config);

        // Validate and create agent
        if (!config.isValid()) {
            log.error("Invalid agent configuration in file: {}", file.getName());
            return null;
        }

        return new Agent(config);
    }

    /**
     * Parse Markdown frontmatter and body
     */
    private AgentMarkdown parseAgentMarkdown(String content) {
        AgentMarkdown markdown = new AgentMarkdown();

        // Simple frontmatter parser (--- delimited)
        String[] parts = content.split("---", 3);

        if (parts.length >= 2 && !parts[0].trim().isEmpty()) {
            // Parse YAML frontmatter
            String frontmatter = parts[1].trim();
            markdown.body = parts.length > 2 ? parts[2].trim() : "";

            // Parse key-value pairs
            for (String line : frontmatter.split("\n")) {
                String[] kv = line.split(":", 2);
                if (kv.length == 2) {
                    String key = kv[0].trim();
                    String value = kv[1].trim();

                    switch (key) {
                        case "name":
                            markdown.name = value;
                            break;
                        case "model":
                            String[] modelParts = value.split(":");
                            markdown.provider = modelParts[0];
                            markdown.model = modelParts.length > 1 ? modelParts[1] : value;
                            break;
                        case "temperature":
                            markdown.temperature = Double.parseDouble(value);
                            break;
                        case "max_tokens":
                            markdown.maxTokens = Integer.parseInt(value);
                            break;
                        case "system_prompt":
                            markdown.systemPrompt = value;
                            markdown.body = markdown.body; // Use as prefix to body
                            break;
                        default:
                            break;
                    }
                }
            }
        } else {
            // No frontmatter, entire content is body
            markdown.body = content.trim();
        }

        return markdown;
    }

    /**
     * Parse agent body sections (Role, Capabilities, Preferences, Memory Guidelines)
     */
    private void parseAgentBody(String body, com.cola.agent.config.AgentConfig config) {
        String[] sections = body.split("##");

        for (String section : sections) {
            String trimmed = section.trim();

            if (trimmed.toLowerCase().startsWith("role")) {
                config.setRole(trimmed.substring(4).trim());
            } else if (trimmed.toLowerCase().startsWith("capabilities")) {
                config.setCapabilities(trimmed.substring(12).trim());
            } else if (trimmed.toLowerCase().startsWith("preferences")) {
                config.setPreferences(trimmed.substring(11).trim());
            } else if (trimmed.toLowerCase().startsWith("memory guidelines") || trimmed.toLowerCase().startsWith("memory")) {
                config.setMemoryGuidelines(trimmed.substring(16).trim());
            }
        }
    }

    /**
     * Internal class for parsed Markdown content
     */
    @lombok.Data
    private static class AgentMarkdown {
        private String name;
        private String provider;
        private String model;
        private Double temperature;
        private Integer maxTokens;
        private String systemPrompt;
        private String body;
    }
}
