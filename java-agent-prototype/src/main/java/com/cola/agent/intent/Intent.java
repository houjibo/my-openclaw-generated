package com.cola.agent.intent;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * Intent - Represents a classified user intent
 *
 * Captures the type, confidence, parameters, and metadata of an intent
 */
@Data
@Builder
public class Intent {

    /**
     * Intent type classification
     */
    private IntentType type;

    /**
     * Confidence score (0.0 - 1.0)
     */
    private double confidence;

    /**
     * Original user input
     */
    private String originalInput;

    /**
     * Extracted parameters
     */
    @Builder.Default
    private Map<String, Object> parameters = new HashMap<>();

    /**
     * Extracted entities (e.g., names, dates, topics)
     */
    @Builder.Default
    private Map<String, String> entities = new HashMap<>();

    /**
     * Context information
     */
    private String context;

    /**
     * Timestamp when intent was analyzed
     */
    @Builder.Default
    private LocalDateTime timestamp = LocalDateTime.now();

    /**
     * Analysis method used (rule-based, llm-based, hybrid)
     */
    private String analysisMethod;

    /**
     * Alternative intents (if confidence is low)
     */
    @Builder.Default
    private Map<IntentType, Double> alternatives = new HashMap<>();

    /**
     * Check if confidence is high enough to proceed
     */
    public boolean isConfident(double threshold) {
        return confidence >= threshold;
    }

    /**
     * Check if this is a high-confidence intent
     */
    public boolean isHighConfidence() {
        return confidence >= 0.8;
    }

    /**
     * Check if this is a medium-confidence intent
     */
    public boolean isMediumConfidence() {
        return confidence >= 0.5 && confidence < 0.8;
    }

    /**
     * Check if this is a low-confidence intent
     */
    public boolean isLowConfidence() {
        return confidence < 0.5;
    }

    /**
     * Get parameter value
     */
    @SuppressWarnings("unchecked")
    public <T> T getParameter(String key) {
        return (T) parameters.get(key);
    }

    /**
     * Get entity value
     */
    public String getEntity(String key) {
        return entities.get(key);
    }

    /**
     * Add alternative intent with confidence
     */
    public void addAlternative(IntentType type, double confidence) {
        alternatives.put(type, confidence);
    }

    /**
     * Check if intent requires clarification
     */
    public boolean requiresClarification() {
        return isLowConfidence() || alternatives.size() > 2;
    }

    /**
     * Create unknown intent
     */
    public static Intent unknown(String input) {
        return Intent.builder()
                .type(IntentType.UNKNOWN)
                .confidence(0.0)
                .originalInput(input)
                .analysisMethod("none")
                .build();
    }

    /**
     * Create simple intent
     */
    public static Intent of(IntentType type, String input) {
        return Intent.builder()
                .type(type)
                .confidence(1.0)
                .originalInput(input)
                .analysisMethod("simple")
                .build();
    }
}
