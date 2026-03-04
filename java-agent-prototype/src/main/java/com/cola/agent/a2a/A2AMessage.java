package com.cola.agent.a2a;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * A2A Message - Standard message format for agent communication
 *
 * Supports various message types and carries metadata for routing and processing.
 */
@Data
@Builder
public class A2AMessage {

    /**
     * Message types
     */
    public enum MessageType {
        REQUEST,      // Request for action/information
        RESPONSE,     // Response to a request
        EVENT,        // Event notification
        BROADCAST,    // Broadcast to multiple agents
        HEARTBEAT,    // Keep-alive signal
        DISCOVERY,    // Agent discovery
        CAPABILITY,   // Capability advertisement
        ERROR         // Error message
    }

    /**
     * Message priorities
     */
    public enum Priority {
        LOW(1),
        NORMAL(2),
        HIGH(3),
        CRITICAL(4);

        private final int level;

        Priority(int level) {
            this.level = level;
        }

        public int getLevel() {
            return level;
        }
    }

    /**
     * Unique message ID
     */
    @Builder.Default
    private String messageId = UUID.randomUUID().toString();

    /**
     * Message type
     */
    @Builder.Default
    private MessageType type = MessageType.REQUEST;

    /**
     * Sender agent ID
     */
    private String fromAgent;

    /**
     * Recipient agent ID (null for broadcast)
     */
    private String toAgent;

    /**
     * Correlation ID (for request-response pairing)
     */
    private String correlationId;

    /**
     * Message timestamp
     */
    @Builder.Default
    private Instant timestamp = Instant.now();

    /**
     * Message priority
     */
    @Builder.Default
    private Priority priority = Priority.NORMAL;

    /**
     * Message payload (JSON string or structured data)
     */
    private String payload;

    /**
     * Message metadata
     */
    @Builder.Default
    private Map<String, String> metadata = new HashMap<>();

    /**
     * Timeout in milliseconds (0 for no timeout)
     */
    @Builder.Default
    private long timeoutMs = 30000;

    /**
     * Create a request message
     */
    public static A2AMessage request(String from, String to, String payload) {
        return A2AMessage.builder()
                .type(MessageType.REQUEST)
                .fromAgent(from)
                .toAgent(to)
                .payload(payload)
                .correlationId(UUID.randomUUID().toString())
                .build();
    }

    /**
     * Create a response message
     */
    public static A2AMessage response(String from, String to, String correlationId, String payload) {
        return A2AMessage.builder()
                .type(MessageType.RESPONSE)
                .fromAgent(from)
                .toAgent(to)
                .correlationId(correlationId)
                .payload(payload)
                .build();
    }

    /**
     * Create an event message
     */
    public static A2AMessage event(String from, String eventType, String payload) {
        A2AMessage msg = A2AMessage.builder()
                .type(MessageType.EVENT)
                .fromAgent(from)
                .payload(payload)
                .build();
        msg.getMetadata().put("eventType", eventType);
        return msg;
    }

    /**
     * Create a broadcast message
     */
    public static A2AMessage broadcast(String from, String payload) {
        return A2AMessage.builder()
                .type(MessageType.BROADCAST)
                .fromAgent(from)
                .payload(payload)
                .build();
    }

    /**
     * Create an error message
     */
    public static A2AMessage error(String from, String to, String correlationId, String errorMessage) {
        A2AMessage msg = A2AMessage.builder()
                .type(MessageType.ERROR)
                .fromAgent(from)
                .toAgent(to)
                .correlationId(correlationId)
                .payload(errorMessage)
                .build();
        msg.getMetadata().put("error", "true");
        return msg;
    }

    /**
     * Create a heartbeat message
     */
    public static A2AMessage heartbeat(String from) {
        return A2AMessage.builder()
                .type(MessageType.HEARTBEAT)
                .fromAgent(from)
                .payload("{\"status\":\"alive\"}")
                .build();
    }

    /**
     * Check if this is a request message
     */
    public boolean isRequest() {
        return type == MessageType.REQUEST;
    }

    /**
     * Check if this is a response message
     */
    public boolean isResponse() {
        return type == MessageType.RESPONSE;
    }

    /**
     * Check if this is an error message
     */
    public boolean isError() {
        return type == MessageType.ERROR;
    }

    /**
     * Add metadata
     */
    public A2AMessage withMetadata(String key, String value) {
        this.metadata.put(key, value);
        return this;
    }

    /**
     * Get metadata value
     */
    public String getMetadataValue(String key) {
        return metadata.get(key);
    }

    /**
     * Check if message has expired
     */
    public boolean isExpired() {
        if (timeoutMs <= 0) return false;
        return Instant.now().isAfter(timestamp.plusMillis(timeoutMs));
    }

    /**
     * Create response to this message
     */
    public A2AMessage createResponse(String from, String payload) {
        return response(from, this.fromAgent, this.messageId, payload);
    }

    /**
     * Create error response to this message
     */
    public A2AMessage createErrorResponse(String from, String errorMessage) {
        return error(from, this.fromAgent, this.messageId, errorMessage);
    }
}
