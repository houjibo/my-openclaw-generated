package com.cola.agent.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;
import lombok.extern.slf4j.Slf4j;

/**
 * LLM Configuration
 *
 * Defines default LLM parameters and provider settings
 */
@Slf4j
@Data
@Configuration
@ConfigurationProperties(prefix = "agent")
public class LLMConfig {

    /**
     * Default model to use (format: provider:model)
     * Examples: openai:gpt-5.2, anthropic:claude-5-sonnet
     */
    private String defaultModel = "openai:gpt-5.2";

    /**
     * Default temperature for model responses
     * Range: 0.0 (more deterministic) to 1.0 (more random)
     */
    private double defaultTemperature = 0.7;

    /**
     * Default maximum tokens for model responses
     */
    private int defaultMaxTokens = 4000;

    /**
     * Parse provider and model from model string
     */
    public ModelConfig parseModelConfig() {
        String[] parts = defaultModel.split(":");
        if (parts.length != 2) {
            log.warn("Invalid model format: {}, using default", defaultModel);
            return new ModelConfig("openai", "gpt-5.2");
        }
        return new ModelConfig(parts[0], parts[1]);
    }

    @Data
    public static class ModelConfig {
        private final String provider;
        private final String model;
    }
}
