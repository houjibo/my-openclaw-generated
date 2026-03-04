package com.cola.agent;

import com.cola.agent.a2a.AgentDescriptor;
import com.cola.agent.a2a.AgentRegistry;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;
import java.util.List;
import java.util.Optional;

public class AgentRegistryTest {

    private AgentRegistry registry;

    @BeforeEach
    void setUp() {
        registry = new AgentRegistry();
    }

    @Test
    void testRegisterAgent() {
        AgentDescriptor agent = AgentDescriptor.simple("agent1", "Test Agent", "http://localhost:8080");
        assertTrue(registry.register(agent));
        assertEquals(1, registry.getAgentCount());
    }

    @Test
    void testUnregisterAgent() {
        AgentDescriptor agent = AgentDescriptor.simple("agent1", "Test Agent", "http://localhost:8080");
        registry.register(agent);
        assertTrue(registry.unregister("agent1"));
        assertEquals(0, registry.getAgentCount());
    }

    @Test
    void testGetAgent() {
        AgentDescriptor agent = AgentDescriptor.simple("agent1", "Test Agent", "http://localhost:8080");
        registry.register(agent);
        
        Optional<AgentDescriptor> found = registry.getAgent("agent1");
        assertTrue(found.isPresent());
        assertEquals("Test Agent", found.get().getName());
    }

    @Test
    void testFindByCapability() {
        AgentDescriptor agent = AgentDescriptor.withCapabilities(
            "agent1", "Researcher", "http://localhost:8080",
            "research", "analysis"
        );
        registry.register(agent);
        
        List<AgentDescriptor> researchers = registry.findAgentsByCapability("research");
        assertEquals(1, researchers.size());
    }

    @Test
    void testNullAgentRegistration() {
        assertFalse(registry.register(null));
    }
}
