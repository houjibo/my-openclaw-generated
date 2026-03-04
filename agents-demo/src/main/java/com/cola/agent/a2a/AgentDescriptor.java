package com.cola.agent.a2a;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Agent Descriptor - Describes an agent's identity, capabilities, and endpoint
 *
 * Used for agent registration and discovery in the A2A protocol.
 */
@Data
@Builder
public class AgentDescriptor {

    /**
     * Unique agent ID
     */
    private String agentId;

    /**
     * Agent name
     */
    private String name;

    /**
     * Agent description
     */
    private String description;

    /**
     * Agent version
     */
    @Builder.Default
    private String version = "1.0.0";

    /**
     * Agent capabilities (e.g., "coding", "research", "writing")
     */
    @Builder.Default
    private List<String> capabilities = new ArrayList<>();

    /**
     * Communication endpoint (URL or address)
     */
    private String endpoint;

    /**
     * Protocol type (http, grpc, websocket)
     */
    @Builder.Default
    private String protocol = "http";

    /**
     * Agent status
     */
    @Builder.Default
    private Status status = Status.ONLINE;

    /**
     * Last seen timestamp
     */
    @Builder.Default
    private Instant lastSeen = Instant.now();

    /**
     * Agent metadata
     */
    @Builder.Default
    private Map<String, String> metadata = new HashMap<>();

    /**
     * Supported A2A protocol version
     */
    @Builder.Default
    private String a2aVersion = "1.0";

    /**
     * Agent status enum
     */
    public enum Status {
        ONLINE,      // Agent is online and available
        BUSY,        // Agent is online but busy
        OFFLINE,     // Agent is offline
        UNKNOWN      // Agent status unknown
    }

    /**
     * Check if agent has specific capability
     */
    public boolean hasCapability(String capability) {
        return capabilities.stream()
                .anyMatch(c -> c.equalsIgnoreCase(capability));
    }

    /**
     * Check if agent has any of the specified capabilities
     */
    public boolean hasAnyCapability(String... capabilities) {
        for (String cap : capabilities) {
            if (hasCapability(cap)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Check if agent is available
     */
    public boolean isAvailable() {
        return status == Status.ONLINE;
    }

    /**
     * Update last seen timestamp
     */
    public void updateLastSeen() {
        this.lastSeen = Instant.now();
    }

    /**
     * Mark agent as offline
     */
    public void markOffline() {
        this.status = Status.OFFLINE;
    }

    /**
     * Mark agent as online
     */
    public void markOnline() {
        this.status = Status.ONLINE;
        updateLastSeen();
    }

    /**
     * Mark agent as busy
     */
    public void markBusy() {
        this.status = Status.BUSY;
        updateLastSeen();
    }

    /**
     * Add capability
     */
    public AgentDescriptor withCapability(String capability) {
        this.capabilities.add(capability);
        return this;
    }

    /**
     * Add metadata
     */
    public AgentDescriptor withMetadata(String key, String value) {
        this.metadata.put(key, value);
        return this;
    }

    /**
     * Check if agent is stale (not seen for a while)
     */
    public boolean isStale(long thresholdMs) {
        return Instant.now().isAfter(lastSeen.plusMillis(thresholdMs));
    }

    /**
     * Create simple descriptor
     */
    public static AgentDescriptor simple(String agentId, String name, String endpoint) {
        return AgentDescriptor.builder()
                .agentId(agentId)
                .name(name)
                .endpoint(endpoint)
                .build();
    }

    /**
     * Create descriptor with capabilities
     */
    public static AgentDescriptor withCapabilities(String agentId, String name, 
                                                    String endpoint, String... capabilities) {
        AgentDescriptor desc = simple(agentId, name, endpoint);
        for (String cap : capabilities) {
            desc.withCapability(cap);
        }
        return desc;
    }
}
