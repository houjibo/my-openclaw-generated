package com.cola.agent;

import com.cola.agent.a2a.*;
import com.cola.agent.intent.*;
import com.cola.agent.llm.*;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;
import java.util.List;

/**
 * Quick validation test - verifies all components are working
 */
public class QuickValidationTest {

    @Test
    void testIntentSystem() {
        IntentAnalyzer analyzer = new IntentAnalyzer();
        
        // Test classification
        Intent query = analyzer.analyze("What is Java?");
        assertEquals(IntentType.QUERY, query.getType());
        
        Intent execute = analyzer.analyze("Create a file");
        assertEquals(IntentType.EXECUTE, execute.getType());
        
        Intent explore = analyzer.analyze("Explore AI trends");
        assertEquals(IntentType.EXPLORE, explore.getType());
        
        System.out.println("✅ Intent system working");
    }

    @Test
    void testA2ASystem() {
        AgentRegistry registry = new AgentRegistry();
        
        // Register agent
        AgentDescriptor agent = AgentDescriptor.withCapabilities(
            "test-agent", "Test", "http://localhost:8080",
            "test"
        );
        assertTrue(registry.register(agent));
        
        // Verify registration
        assertEquals(1, registry.getAgentCount());
        assertTrue(registry.getAgent("test-agent").isPresent());
        
        // Test message creation
        A2AMessage msg = A2AMessage.request("sender", "receiver", "Hello");
        assertEquals(A2AMessage.MessageType.REQUEST, msg.getType());
        
        System.out.println("✅ A2A system working");
    }

    @Test
    void testLLMSystem() {
        // Test message creation
        LLMMessage system = LLMMessage.system("You are helpful");
        assertEquals(LLMMessage.Role.SYSTEM, system.getRole());
        
        LLMMessage user = LLMMessage.user("Hello");
        assertEquals(LLMMessage.Role.USER, user.getRole());
        
        // Test options
        LLMOptions options = LLMOptions.defaults();
        assertEquals(0.7, options.getTemperature());
        assertEquals(4000, options.getMaxTokens());
        
        // Test response
        LLMResponse response = LLMResponse.success("Hello!", "kimi-k2.5", "moonshot");
        assertTrue(response.isSuccess());
        assertEquals("Hello!", response.getContent());
        
        System.out.println("✅ LLM system working");
    }

    @Test
    void testIntegration() {
        // Simulate: Intent -> A2A -> Response flow
        
        // 1. Analyze intent
        IntentAnalyzer analyzer = new IntentAnalyzer();
        Intent intent = analyzer.analyze("Send message to agent1");
        
        // 2. Create A2A message
        A2AMessage a2aMsg = A2AMessage.request("coordinator", "agent1", intent.getOriginalInput());
        
        // 3. Create LLM context
        List<LLMMessage> context = List.of(
            LLMMessage.system("You are a coordinator"),
            LLMMessage.user("Route this message: " + a2aMsg.getPayload())
        );
        
        // Verify flow completed
        assertNotNull(intent);
        assertNotNull(a2aMsg);
        assertEquals(2, context.size());
        
        System.out.println("✅ Integration flow working");
    }

    @Test
    void testAllIntentTypes() {
        IntentAnalyzer analyzer = new IntentAnalyzer();
        
        // Test all intent types
        assertEquals(IntentType.QUERY, analyzer.analyze("What is this?").getType());
        assertEquals(IntentType.EXECUTE, analyzer.analyze("Do this").getType());
        assertEquals(IntentType.EXPLORE, analyzer.analyze("Explore that").getType());
        assertEquals(IntentType.REMEMBER, analyzer.analyze("Remember this").getType());
        assertEquals(IntentType.COLLABORATE, analyzer.analyze("Work with agent").getType());
        assertEquals(IntentType.NEGOTIATE, analyzer.analyze("Actually, no").getType());
        
        System.out.println("✅ All intent types working");
    }
}
