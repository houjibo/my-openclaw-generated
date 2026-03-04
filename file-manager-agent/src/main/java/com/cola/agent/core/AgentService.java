package com.cola.agent.core;

import com.cola.agent.intent.Intent;
import com.cola.agent.intent.IntentResult;
import com.cola.agent.intent.IntentService;
import com.cola.agent.intent.IntentType;
import com.cola.agent.memory.MemoryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

/**
 * Agent Service - High-level agent orchestration service
 *
 * Coordinates agent loading, intent analysis, memory management, and response generation
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AgentService {

    private final AgentLoader agentLoader;
    private final IntentService intentService;
    private final MemoryService memoryService;

    private Agent currentAgent;

    /**
     * Initialize default agent
     */
    public void initialize() {
        log.info("Initializing Agent Service...");
        
        // Load default agent
        this.currentAgent = agentLoader.loadDefaultAgent()
                .orElseGet(() -> {
                    log.warn("No default agent found, creating fallback");
                    return createFallbackAgent();
                });
        
        log.info("Agent Service initialized with agent: {}", currentAgent.getName());
    }

    /**
     * Process user message through full pipeline
     */
    public AgentResponse processMessage(String message) {
        long startTime = System.currentTimeMillis();
        
        log.info("Processing message: {}", message);

        // Step 1: Analyze intent
        Intent intent = intentService.analyze(message);
        
        // Step 2: Process based on intent
        IntentResult result = intentService.process(message);

        // Step 3: Generate response
        AgentResponse response = generateResponse(intent, result);

        // Step 4: Update memory
        updateMemory(message, intent, response);

        // Step 5: Record usage
        if (currentAgent != null) {
            currentAgent.recordUsage();
        }

        long processingTime = System.currentTimeMillis() - startTime;
        response.setProcessingTimeMs(processingTime);

        log.info("Message processed in {}ms", processingTime);
        return response;
    }

    /**
     * Process with intent clarification
     */
    public Optional<AgentResponse> processWithClarification(String message) {
        Optional<IntentResult> result = intentService.processWithClarification(message);
        
        if (result.isPresent()) {
            IntentResult intentResult = result.get();
            AgentResponse response = generateResponse(intentResult.getIntent(), intentResult);
            return Optional.of(response);
        }
        
        return Optional.empty();
    }

    /**
     * Generate response based on intent and result
     */
    private AgentResponse generateResponse(Intent intent, IntentResult result) {
        AgentResponse.AgentResponseBuilder builder = AgentResponse.builder()
                .intentType(intent.getType())
                .confidence(intent.getConfidence())
                .action(result.getAction())
                .success(result.isSuccess());

        if (result.isSuccess()) {
            builder.content(result.getMessage())
                   .suggestedNextSteps(generateSuggestions(intent));
        } else {
            builder.content(result.getMessage())
                   .requiresClarification(true);
        }

        return builder.build();
    }

    /**
     * Generate suggested next steps based on intent
     */
    private List<String> generateSuggestions(Intent intent) {
        return switch (intent.getType()) {
            case QUERY -> List.of(
                    "Tell me more",
                    "Show me examples",
                    "How does this work?"
            );
            case EXECUTE -> List.of(
                    "Confirm and proceed",
                    "Show me what you'll do",
                    "Modify the request"
            );
            case EXPLORE -> List.of(
                    "Start exploration",
                    "Set exploration depth",
                    "Focus on specific aspect"
            );
            case COLLABORATE -> List.of(
                    "Which agents to involve?",
                    "Set collaboration mode",
                    "Define success criteria"
            );
            case REMEMBER -> List.of(
                    "Confirm storage",
                    "Add tags",
                    "Set priority"
            );
            default -> List.of();
        };
    }

    /**
     * Update memory with interaction
     */
    private void updateMemory(String message, Intent intent, AgentResponse response) {
        try {
            // Add to daily context
            memoryService.addToDailyContext(String.format(
                    "[%s] User: %s | Intent: %s | Response: %s",
                    java.time.LocalDateTime.now(),
                    message,
                    intent.getType(),
                    response.getContent()
            ));

            // If it's a REMEMBER intent, store to deep knowledge
            if (intent.getType() == IntentType.REMEMBER) {
                String topic = intent.getEntity("quoted_1");
                if (topic != null) {
                    memoryService.storeToDeepKnowledge("topics", topic, message);
                }
            }
        } catch (Exception e) {
            log.error("Failed to update memory", e);
        }
    }

    /**
     * Switch to a different agent
     */
    public boolean switchAgent(String agentName) {
        Optional<Agent> agent = agentLoader.loadAgent(agentName);
        if (agent.isPresent()) {
            this.currentAgent = agent.get();
            log.info("Switched to agent: {}", agentName);
            return true;
        }
        log.warn("Failed to switch to agent: {}", agentName);
        return false;
    }

    /**
     * Get current agent
     */
    public Agent getCurrentAgent() {
        return currentAgent;
    }

    /**
     * List available agents
     */
    public List<String> listAvailableAgents() {
        return agentLoader.listAvailableAgents();
    }

    /**
     * Create fallback agent
     */
    private Agent createFallbackAgent() {
        AgentConfig config = new AgentConfig();
        config.setName("fallback");
        config.setProvider("openai");
        config.setModel("gpt-4o");
        config.setTemperature(0.7);
        config.setMaxTokens(4000);
        config.setSystemPrompt("You are a helpful assistant.");
        config.setRole("General purpose assistant");
        config.setCapabilities("General knowledge, task assistance");
        
        return new Agent(config);
    }

    /**
     * Check if message requires clarification
     */
    public boolean requiresClarification(String message) {
        Intent intent = intentService.analyze(message);
        return intent.requiresClarification();
    }

    /**
     * Get intent breakdown for debugging
     */
    public String getIntentBreakdown(String message) {
        Intent intent = intentService.analyze(message);
        
        StringBuilder sb = new StringBuilder();
        sb.append("Intent Analysis:\n");
        sb.append("  Type: ").append(intent.getType()).append("\n");
        sb.append("  Confidence: ").append(String.format("%.2f", intent.getConfidence())).append("\n");
        sb.append("  Method: ").append(intent.getAnalysisMethod()).append("\n");
        
        if (!intent.getParameters().isEmpty()) {
            sb.append("  Parameters:\n");
            intent.getParameters().forEach((k, v) -> 
                sb.append("    ").append(k).append(": ").append(v).append("\n")
            );
        }
        
        if (!intent.getEntities().isEmpty()) {
            sb.append("  Entities:\n");
            intent.getEntities().forEach((k, v) -> 
                sb.append("    ").append(k).append(": ").append(v).append("\n")
            );
        }
        
        if (!intent.getAlternatives().isEmpty()) {
            sb.append("  Alternatives:\n");
            intent.getAlternatives().forEach((type, conf) -> 
                sb.append("    ").append(type).append(": ").append(String.format("%.2f", conf)).append("\n")
            );
        }
        
        return sb.toString();
    }
}
