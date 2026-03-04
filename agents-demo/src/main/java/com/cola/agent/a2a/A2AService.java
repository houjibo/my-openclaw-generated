package com.cola.agent.a2a;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import javax.annotation.PostConstruct;
import javax.annotation.PreDestroy;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.CompletableFuture;

@Slf4j
@Service
@RequiredArgsConstructor
public class A2AService {
    private final AgentRegistry registry;
    private A2AProtocol protocol;

    @PostConstruct
    public void init() {
        this.protocol = new HttpA2AProtocol(registry);
        this.protocol.start();
        log.info("A2A Service initialized");
    }

    @PreDestroy
    public void shutdown() {
        if (protocol != null) {
            protocol.stop();
        }
        log.info("A2A Service shutdown");
    }

    public A2AMessage sendMessage(String fromAgent, String toAgent, String payload) {
        A2AMessage message = A2AMessage.request(fromAgent, toAgent, payload);
        return protocol.send(message);
    }

    public CompletableFuture<A2AMessage> sendMessageAsync(String fromAgent, String toAgent, String payload) {
        A2AMessage message = A2AMessage.request(fromAgent, toAgent, payload);
        return protocol.sendAsync(message);
    }

    public List<A2AMessage> broadcast(String fromAgent, List<String> toAgents, String payload) {
        A2AMessage message = A2AMessage.broadcast(fromAgent, payload);
        return protocol.broadcast(message, toAgents);
    }

    public boolean registerAgent(AgentDescriptor descriptor) {
        return protocol.registerAgent(descriptor);
    }

    public boolean unregisterAgent(String agentId) {
        return protocol.unregisterAgent(agentId);
    }

    public List<AgentDescriptor> discoverAgents(String... capabilities) {
        return protocol.discoverAgents(capabilities);
    }

    public Optional<AgentDescriptor> getAgent(String agentId) {
        return protocol.getAgent(agentId);
    }

    public boolean isAgentAvailable(String agentId) {
        return protocol.isAgentAvailable(agentId);
    }

    public void sendHeartbeat(String agentId) {
        registry.updateHeartbeat(agentId);
        A2AMessage heartbeat = A2AMessage.heartbeat(agentId);
        log.debug("Heartbeat sent for agent: {}", agentId);
    }

    public int getActiveAgentCount() {
        return registry.getAgentCount();
    }

    public List<AgentDescriptor> findAgentsByCapability(String capability) {
        return registry.findAgentsByCapability(capability);
    }
}
