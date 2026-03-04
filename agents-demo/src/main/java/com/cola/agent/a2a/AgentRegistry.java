package com.cola.agent.a2a;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Slf4j
@Component
public class AgentRegistry {
    private final Map<String, AgentDescriptor> agents = new ConcurrentHashMap<>();
    private final Map<String, Instant> lastHeartbeat = new ConcurrentHashMap<>();
    private static final long STALE_THRESHOLD_MS = 5 * 60 * 1000;

    public boolean register(AgentDescriptor descriptor) {
        if (descriptor == null || descriptor.getAgentId() == null) {
            log.warn("Cannot register null agent");
            return false;
        }
        descriptor.updateLastSeen();
        agents.put(descriptor.getAgentId(), descriptor);
        lastHeartbeat.put(descriptor.getAgentId(), Instant.now());
        log.info("Agent registered: {}", descriptor.getName());
        return true;
    }

    public boolean unregister(String agentId) {
        AgentDescriptor removed = agents.remove(agentId);
        lastHeartbeat.remove(agentId);
        return removed != null;
    }

    public Optional<AgentDescriptor> getAgent(String agentId) {
        return Optional.ofNullable(agents.get(agentId));
    }

    public List<AgentDescriptor> getAllAgents() {
        return new ArrayList<>(agents.values());
    }

    public List<AgentDescriptor> getAvailableAgents() {
        return agents.values().stream()
                .filter(AgentDescriptor::isAvailable)
                .collect(Collectors.toList());
    }

    public List<AgentDescriptor> findAgentsByCapability(String capability) {
        return agents.values().stream()
                .filter(a -> a.hasCapability(capability))
                .filter(AgentDescriptor::isAvailable)
                .collect(Collectors.toList());
    }

    public void updateHeartbeat(String agentId) {
        lastHeartbeat.put(agentId, Instant.now());
        getAgent(agentId).ifPresent(AgentDescriptor::updateLastSeen);
    }

    public void removeStaleAgents() {
        List<String> staleAgents = lastHeartbeat.entrySet().stream()
                .filter(e -> isStale(e.getValue()))
                .map(Map.Entry::getKey)
                .collect(Collectors.toList());
        
        staleAgents.forEach(id -> {
            log.warn("Removing stale agent: {}", id);
            unregister(id);
        });
    }

    private boolean isStale(Instant lastSeen) {
        return Instant.now().isAfter(lastSeen.plusMillis(STALE_THRESHOLD_MS));
    }

    public int getAgentCount() {
        return agents.size();
    }

    public boolean hasAgent(String agentId) {
        return agents.containsKey(agentId);
    }
}
