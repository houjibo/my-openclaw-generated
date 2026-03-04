package com.cola.agent.core;

import com.cola.agent.config.AgentConfig;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import java.time.Instant;
import java.util.Map;
import java.util.HashMap;
import java.util.UUID;

/**
 * Agent - Core agent entity
 *
 * Represents an AI agent with configuration, state, and capabilities
 */
@Slf4j
@Data
public class Agent {

    private final String id;
    private final String name;
    private final String provider;
    private final String model;
    private final Double temperature;
    private final Integer maxTokens;
    private final String systemPrompt;
    private final String role;
    private final String capabilities;
    private final String preferences;
    private final String memoryGuidelines;

    private Instant createdAt;
    private Instant lastUsed;
    private long usageCount;
    private Map<String, Object> state;

    /**
     * Create agent from configuration
     */
    public Agent(AgentConfig config) {
        this.id = UUID.randomUUID().toString();
        this.name = config.getName();
        this.provider = config.getProvider();
        this.model = config.getModel();
        this.temperature = config.getTemperature();
        this.maxTokens = config.getMaxTokens();
        this.systemPrompt = config.getSystemPrompt();
        this.role = config.getRole();
        this.capabilities = config.getCapabilities();
        this.preferences = config.getPreferences();
        this.memoryGuidelines = config.getMemoryGuidelines();

        this.createdAt = Instant.now();
        this.lastUsed = null;
        this.usageCount = 0;
        this.state = new HashMap<>();

        log.info("Agent created: {} ({})", this.name, this.id);
    }

    /**
     * Record agent usage
     */
    public void recordUsage() {
        this.lastUsed = Instant.now();
        this.usageCount++;
        log.debug("Agent usage recorded: {} (total: {})", this.name, this.usageCount);
    }

    /**
     * Update agent state
     */
    public void updateState(String key, Object value) {
        if (this.state == null) {
            this.state = new HashMap<>();
        }
        this.state.put(key, value);
        log.debug("Agent state updated: {} -> {}: {}", this.name, key, value);
    }

    /**
     * Get agent state value
     */
    public Object getState(String key) {
        if (this.state == null) {
            return null;
        }
        return this.state.get(key);
    }

    /**
     * Build system prompt with role and guidelines
     */
    public String buildFullSystemPrompt() {
        StringBuilder sb = new StringBuilder();

        if (systemPrompt != null && !systemPrompt.isBlank()) {
            sb.append(systemPrompt).append("\n\n");
        }

        if (role != null && !role.isBlank()) {
            sb.append("## Role\n").append(role).append("\n\n");
        }

        if (capabilities != null && !capabilities.isBlank()) {
            sb.append("## Capabilities\n").append(capabilities).append("\n\n");
        }

        if (preferences != null && !preferences.isBlank()) {
            sb.append("## Preferences\n").append(preferences).append("\n\n");
        }

        if (memoryGuidelines != null && !memoryGuidelines.isBlank()) {
            sb.append("## Memory Guidelines\n").append(memoryGuidelines).append("\n\n");
        }

        return sb.toString();
    }

    /**
     * Get model identifier
     */
    public String getModelIdentifier() {
        return provider + ":" + model;
    }
}
