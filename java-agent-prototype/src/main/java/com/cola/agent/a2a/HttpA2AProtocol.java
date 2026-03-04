package com.cola.agent.a2a;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Optional;
import java.util.concurrent.CompletableFuture;

@Slf4j
public class HttpA2AProtocol implements A2AProtocol {
    private final String protocolId = "http-a2a";
    private final String version = "1.0";
    private final RestTemplate restTemplate;
    private final AgentRegistry registry;
    private boolean running = false;

    public HttpA2AProtocol(AgentRegistry registry) {
        this.registry = registry;
        this.restTemplate = new RestTemplate();
    }

    @Override
    public String getProtocolId() {
        return protocolId;
    }

    @Override
    public String getVersion() {
        return version;
    }

    @Override
    public A2AMessage send(A2AMessage message) {
        String targetEndpoint = getTargetEndpoint(message.getToAgent());
        if (targetEndpoint == null) {
            return A2AMessage.error(message.getFromAgent(), message.getToAgent(), 
                    message.getMessageId(), "Target agent not found");
        }

        try {
            ResponseEntity<String> response = restTemplate.postForEntity(
                    targetEndpoint + "/a2a/message", message, String.class);
            return parseResponse(response.getBody(), message);
        } catch (Exception e) {
            log.error("Failed to send message", e);
            return A2AMessage.error(message.getFromAgent(), message.getToAgent(),
                    message.getMessageId(), e.getMessage());
        }
    }

    @Override
    public CompletableFuture<A2AMessage> sendAsync(A2AMessage message) {
        return CompletableFuture.supplyAsync(() -> send(message));
    }

    @Override
    public List<A2AMessage> broadcast(A2AMessage message, List<String> targetAgents) {
        return targetAgents.stream()
                .map(agentId -> {
                    A2AMessage msg = A2AMessage.builder()
                            .fromAgent(message.getFromAgent())
                            .toAgent(agentId)
                            .type(A2AMessage.MessageType.BROADCAST)
                            .payload(message.getPayload())
                            .build();
                    return send(msg);
                })
                .toList();
    }

    @Override
    public List<AgentDescriptor> discoverAgents(String... capabilities) {
        registry.removeStaleAgents();
        if (capabilities.length == 0) {
            return registry.getAvailableAgents();
        }
        return registry.getAvailableAgents().stream()
                .filter(a -> a.hasAnyCapability(capabilities))
                .toList();
    }

    @Override
    public boolean registerAgent(AgentDescriptor descriptor) {
        return registry.register(descriptor);
    }

    @Override
    public boolean unregisterAgent(String agentId) {
        return registry.unregister(agentId);
    }

    @Override
    public boolean isAgentAvailable(String agentId) {
        return registry.getAgent(agentId)
                .map(AgentDescriptor::isAvailable)
                .orElse(false);
    }

    @Override
    public Optional<AgentDescriptor> getAgent(String agentId) {
        return registry.getAgent(agentId);
    }

    @Override
    public void start() {
        running = true;
        log.info("HTTP A2A Protocol started");
    }

    @Override
    public void stop() {
        running = false;
        log.info("HTTP A2A Protocol stopped");
    }

    @Override
    public boolean isRunning() {
        return running;
    }

    private String getTargetEndpoint(String agentId) {
        return registry.getAgent(agentId)
                .map(AgentDescriptor::getEndpoint)
                .orElse(null);
    }

    private A2AMessage parseResponse(String body, A2AMessage original) {
        // Simplified parsing - in production, use JSON deserialization
        return A2AMessage.response("system", original.getFromAgent(),
                original.getMessageId(), body);
    }
}
