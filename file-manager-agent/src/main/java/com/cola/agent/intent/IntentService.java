package com.cola.agent.intent;

import com.cola.agent.memory.MemoryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

/**
 * Intent Service - High-level intent processing service
 *
 * Coordinates intent analysis, memory integration, and action routing
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class IntentService {

    private final IntentAnalyzer analyzer;
    private final MemoryService memoryService;

    /**
     * Process user input through intent pipeline
     */
    public IntentResult process(String input) {
        log.info("Processing input: {}", input);

        // Step 1: Analyze intent
        Intent intent = analyzer.analyze(input);

        // Step 2: Enrich with context from memory
        enrichWithContext(intent);

        // Step 3: Route to appropriate handler
        return routeIntent(intent);
    }

    /**
     * Enrich intent with context from memory
     */
    private void enrichWithContext(Intent intent) {
        // Add recent context from daily memory
        List<String> recentContext = memoryService.getRecentContext(3);
        if (!recentContext.isEmpty()) {
            intent.setContext(String.join("\n", recentContext));
        }

        // Add always-loaded memory context if relevant
        String alwaysLoaded = memoryService.getAlwaysLoadedSummary();
        if (alwaysLoaded != null && !alwaysLoaded.isEmpty()) {
            intent.getParameters().put("memory_context", alwaysLoaded);
        }
    }

    /**
     * Route intent to appropriate handler
     */
    private IntentResult routeIntent(Intent intent) {
        IntentResult.IntentResultBuilder result = IntentResult.builder()
                .intent(intent)
                .success(true);

        switch (intent.getType()) {
            case QUERY:
                result.action("search_and_respond")
                      .message("I'll help you find information about that.");
                break;

            case EXECUTE:
                String action = intent.getParameter("action");
                String target = intent.getParameter("target");
                result.action("execute_task")
                      .message(String.format("I'll %s the %s for you.", action, target));
                break;

            case EXPLORE:
                String domain = intent.getParameter("domain");
                result.action("deep_research")
                      .message(String.format("I'll explore %s in depth for you.", 
                              domain != null ? domain : "this topic"));
                break;

            case COLLABORATE:
                result.action("coordinate_agents")
                      .message("I'll coordinate with the appropriate agents.");
                break;

            case REMEMBER:
                result.action("store_memory")
                      .message("I'll save this to your memory.");
                break;

            case NEGOTIATE:
                result.action("clarify_intent")
                      .message("Let me clarify what you need.");
                break;

            case UNKNOWN:
            default:
                result.action("ask_clarification")
                      .success(false)
                      .message("I'm not sure what you want. Could you clarify?");
                break;
        }

        return result.build();
    }

    /**
     * Process with clarification for low-confidence intents
     */
    public Optional<IntentResult> processWithClarification(String input) {
        Intent intent = analyzer.analyze(input);

        if (intent.requiresClarification()) {
            log.warn("Intent requires clarification: {} (confidence: {})", 
                    intent.getType(), intent.getConfidence());
            
            IntentResult clarification = IntentResult.builder()
                    .intent(intent)
                    .success(false)
                    .action("request_clarification")
                    .message(buildClarificationMessage(intent))
                    .build();
            
            return Optional.of(clarification);
        }

        return Optional.of(process(input));
    }

    /**
     * Build clarification message for ambiguous intents
     */
    private String buildClarificationMessage(Intent intent) {
        StringBuilder msg = new StringBuilder("I'm not entirely sure what you mean. ");
        
        if (intent.isLowConfidence()) {
            msg.append("Could you rephrase or provide more details?");
        } else if (!intent.getAlternatives().isEmpty()) {
            msg.append("Did you mean to:\n");
            intent.getAlternatives().forEach((type, conf) -> {
                msg.append(String.format("- %s (%.0f%% confidence)\n", type, conf * 100));
            });
        }
        
        return msg.toString();
    }

    /**
     * Quick intent check
     */
    public boolean isIntent(String input, IntentType type) {
        return analyzer.matches(input, type);
    }

    /**
     * Get intent without processing
     */
    public Intent analyze(String input) {
        return analyzer.analyze(input);
    }

    /**
     * Batch process multiple inputs
     */
    public List<IntentResult> processBatch(List<String> inputs) {
        return inputs.stream()
                .map(this::process)
                .toList();
    }
}
