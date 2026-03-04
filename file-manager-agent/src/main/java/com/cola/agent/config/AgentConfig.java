package com.cola.agent.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;
import lombok.extern.slf4j.Slf4j;

/**
 * Agent Configuration
 *
 * Represents agent definition loaded from Markdown file
 */
@Slf4j
@Data
@Configuration
@ConfigurationProperties(prefix = "agent")
public class AgentConfig {

    /**
     * Agent name
     */
    private String name;

    /**
     * Model provider (openai, anthropic, deepseek)
     */
    private String provider;

    /**
     * Model name (gpt-5.2, claude-5-sonnet, etc.)
     */
    private String model;

    /**
     * Temperature for model responses
     */
    private Double temperature;

    /**
     * Maximum tokens for model responses
     */
    private Integer maxTokens;

    /**
     * System prompt for the agent
     */
    private String systemPrompt;

    /**
     * Agent role description
     */
    private String role;

    /**
     * Agent capabilities
     */
    private String capabilities;

    /**
     * Agent preferences
     */
    private String preferences;

    /**
     * Memory guidelines for the agent
     */
    private String memoryGuidelines;

    /**
     * Validate required fields
     */
    public boolean isValid() {
        if (name == null || name.isBlank()) {
            log.error("Agent name is required");
            return false;
        }
        if (model == null || model.isBlank()) {
            log.error("Agent model is required");
            return false;
        }
        return true;
    }
}
