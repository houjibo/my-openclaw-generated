package com.cola.agent.llm;

import lombok.Builder;
import lombok.Data;

import java.time.Duration;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

/**
 * LLM Response - Standard response format from LLM
 */
@Data
@Builder
public class LLMResponse {

    private String content;
    private String model;
    private String provider;
    
    @Builder.Default
    private boolean success = true;
    private String error;

    // Token usage
    private int inputTokens;
    private int outputTokens;
    private int totalTokens;

    // Metadata
    @Builder.Default
    private Map<String, Object> metadata = new HashMap<>();

    // Timing
    private Instant timestamp;
    private Duration latency;

    // Finish reason
    private String finishReason;

    public static LLMResponse success(String content, String model, String provider) {
        return LLMResponse.builder()
                .content(content)
                .model(model)
                .provider(provider)
                .success(true)
                .timestamp(Instant.now())
                .build();
    }

    public static LLMResponse error(String error, String model, String provider) {
        return LLMResponse.builder()
                .error(error)
                .model(model)
                .provider(provider)
                .success(false)
                .timestamp(Instant.now())
                .build();
    }

    public boolean hasError() {
        return !success || error != null;
    }

    public double getCostEstimate() {
        // Rough estimate: $0.001 per 1K tokens
        return totalTokens * 0.000001;
    }
}
