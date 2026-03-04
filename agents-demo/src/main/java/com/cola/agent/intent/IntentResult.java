package com.cola.agent.intent;

import lombok.Builder;
import lombok.Data;

import java.util.HashMap;
import java.util.Map;

/**
 * Intent Result - Result of intent processing
 *
 * Contains the processed intent, action to take, and response message
 */
@Data
@Builder
public class IntentResult {

    /**
     * The analyzed intent
     */
    private Intent intent;

    /**
     * Whether processing was successful
     */
    @Builder.Default
    private boolean success = true;

    /**
     * Action to take
     */
    private String action;

    /**
     * Response message to user
     */
    private String message;

    /**
     * Additional data
     */
    @Builder.Default
    private Map<String, Object> data = new HashMap<>();

    /**
     * Error message (if failed)
     */
    private String error;

    /**
     * Processing time in milliseconds
     */
    private long processingTimeMs;

    /**
     * Create success result
     */
    public static IntentResult success(Intent intent, String action, String message) {
        return IntentResult.builder()
                .intent(intent)
                .success(true)
                .action(action)
                .message(message)
                .build();
    }

    /**
     * Create failure result
     */
    public static IntentResult failure(Intent intent, String error) {
        return IntentResult.builder()
                .intent(intent)
                .success(false)
                .error(error)
                .message("Sorry, I couldn't process that request.")
                .build();
    }

    /**
     * Create clarification result
     */
    public static IntentResult clarification(Intent intent, String message) {
        return IntentResult.builder()
                .intent(intent)
                .success(false)
                .action("clarify")
                .message(message)
                .build();
    }

    /**
     * Check if result requires user clarification
     */
    public boolean requiresClarification() {
        return !success && "clarify".equals(action);
    }

    /**
     * Check if result is ready for execution
     */
    public boolean isReady() {
        return success && action != null && !action.isEmpty();
    }

    /**
     * Add data
     */
    public IntentResult withData(String key, Object value) {
        this.data.put(key, value);
        return this;
    }

    /**
     * Get typed data
     */
    @SuppressWarnings("unchecked")
    public <T> T getData(String key) {
        return (T) data.get(key);
    }
}
