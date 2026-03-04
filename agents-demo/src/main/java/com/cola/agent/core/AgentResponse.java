package com.cola.agent.core;

import com.cola.agent.intent.IntentType;
import lombok.Builder;
import lombok.Data;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Agent Response - Response from agent processing
 *
 * Contains the response content, metadata, and suggested actions
 */
@Data
@Builder
public class AgentResponse {

    /**
     * Response content
     */
    private String content;

    /**
     * Intent type that triggered this response
     */
    private IntentType intentType;

    /**
     * Confidence score of intent classification
     */
    private double confidence;

    /**
     * Action to be taken
     */
    private String action;

    /**
     * Whether processing was successful
     */
    @Builder.Default
    private boolean success = true;

    /**
     * Whether clarification is required
     */
    @Builder.Default
    private boolean requiresClarification = false;

    /**
     * Suggested next steps
     */
    @Builder.Default
    private List<String> suggestedNextSteps = new ArrayList<>();

    /**
     * Additional metadata
     */
    @Builder.Default
    private Map<String, Object> metadata = new HashMap<>();

    /**
     * Processing time in milliseconds
     */
    private long processingTimeMs;

    /**
     * Error message (if failed)
     */
    private String error;

    /**
     * Create simple text response
     */
    public static AgentResponse text(String content) {
        return AgentResponse.builder()
                .content(content)
                .success(true)
                .build();
    }

    /**
     * Create error response
     */
    public static AgentResponse error(String errorMessage) {
        return AgentResponse.builder()
                .content("Sorry, an error occurred.")
                .success(false)
                .error(errorMessage)
                .build();
    }

    /**
     * Create clarification request
     */
    public static AgentResponse clarification(String message) {
        return AgentResponse.builder()
                .content(message)
                .success(false)
                .requiresClarification(true)
                .build();
    }

    /**
     * Add metadata
     */
    public AgentResponse withMetadata(String key, Object value) {
        this.metadata.put(key, value);
        return this;
    }

    /**
     * Add suggested step
     */
    public AgentResponse withSuggestion(String suggestion) {
        this.suggestedNextSteps.add(suggestion);
        return this;
    }

    /**
     * Check if response is ready for user
     */
    public boolean isReady() {
        return success && content != null && !content.isEmpty();
    }

    /**
     * Get formatted response with suggestions
     */
    public String getFormattedResponse() {
        StringBuilder sb = new StringBuilder();
        sb.append(content);
        
        if (!suggestedNextSteps.isEmpty()) {
            sb.append("\n\n**Suggested next steps:**\n");
            for (int i = 0; i < suggestedNextSteps.size(); i++) {
                sb.append(i + 1).append(". ").append(suggestedNextSteps.get(i)).append("\n");
            }
        }
        
        return sb.toString();
    }
}
