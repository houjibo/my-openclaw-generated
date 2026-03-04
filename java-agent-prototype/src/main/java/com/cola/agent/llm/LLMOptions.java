package com.cola.agent.llm;

import lombok.Builder;
import lombok.Data;

import java.util.HashMap;
import java.util.Map;

/**
 * LLM Options - Configuration options for LLM requests
 */
@Data
@Builder
public class LLMOptions {

    private String model;
    
    @Builder.Default
    private Double temperature = 0.7;
    
    @Builder.Default
    private Integer maxTokens = 4000;
    
    @Builder.Default
    private Double topP = 1.0;
    
    private Integer topK;
    
    private Double frequencyPenalty;
    private Double presencePenalty;
    
    @Builder.Default
    private Boolean stream = false;
    
    @Builder.Default
    private Long timeoutMs = 60000L;
    
    @Builder.Default
    private Map<String, Object> additionalParams = new HashMap<>();

    public static LLMOptions defaults() {
        return LLMOptions.builder().build();
    }

    public static LLMOptions creative() {
        return LLMOptions.builder()
                .temperature(0.9)
                .topP(0.95)
                .build();
    }

    public static LLMOptions precise() {
        return LLMOptions.builder()
                .temperature(0.2)
                .topP(0.9)
                .build();
    }

    public static LLMOptions fast() {
        return LLMOptions.builder()
                .temperature(0.7)
                .maxTokens(1000)
                .timeoutMs(30000L)
                .build();
    }

    public LLMOptions withModel(String model) {
        this.model = model;
        return this;
    }

    public LLMOptions withTemperature(double temperature) {
        this.temperature = temperature;
        return this;
    }

    public LLMOptions withMaxTokens(int maxTokens) {
        this.maxTokens = maxTokens;
        return this;
    }
}
