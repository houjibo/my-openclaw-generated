package com.cola.agents.demo;

import com.cola.agent.core.Agent;
import com.cola.agent.core.AgentLoader;
import com.cola.agent.intent.*;
import com.cola.agent.llm.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import javax.annotation.PostConstruct;
import java.util.List;

/**
 * Multi-Agent Demo - 验证Agent框架的核心能力
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class MultiAgentDemo {

    private final AgentLoader agentLoader;
    private final IntentService intentService;
    private final LLMService llmService;

    @PostConstruct
    public void init() {
        log.info("Multi-Agent Demo initialized");
    }

    /**
     * 演示: 意图分析测试
     */
    public void demoIntentAnalysis() {
        log.info("=== Demo 1: Intent Analysis ===");
        
        String[] testInputs = {
            "List files in current directory",
            "Research Java 25 new features",
            "Write a README for this project",
            "Review this code for thread safety",
            "Create a new folder named test"
        };

        for (String input : testInputs) {
            Intent intent = intentService.analyze(input);
            log.info("Input: {} -> Intent: {} ({})", 
                    input, intent.getType(), intent.getConfidence());
        }
    }

    /**
     * 演示: 完整对话流程
     */
    public String demoConversation(String userInput) {
        // Step 1: 意图分析
        Intent intent = intentService.analyze(userInput);
        
        // Step 2: 选择Agent
        String agentId = selectAgentForIntent(intent);
        Agent agent = agentLoader.loadAgent(agentId).orElseThrow();
        
        // Step 3: 调用LLM
        List<LLMMessage> messages = List.of(
            LLMMessage.system(agent.buildFullSystemPrompt()),
            LLMMessage.user(userInput)
        );
        
        LLMResponse response = llmService.chat(messages);
        
        return String.format("Intent: %s | Agent: %s | Response: %s",
                intent.getType(), agent.getName(), 
                response.getContent().substring(0, Math.min(100, response.getContent().length())));
    }

    private String selectAgentForIntent(Intent intent) {
        return switch (intent.getType()) {
            case QUERY -> "file-manager";
            case EXECUTE -> "file-manager";
            case EXPLORE -> "researcher";
            default -> "assistant";
        };
    }
}
