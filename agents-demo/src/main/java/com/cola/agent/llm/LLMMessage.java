package com.cola.agent.llm;

import lombok.Builder;
import lombok.Data;

import java.util.HashMap;
import java.util.Map;

/**
 * LLM Message - Standard message format for LLM chat
 */
@Data
@Builder
public class LLMMessage {

    public enum Role {
        SYSTEM,     // System instructions
        USER,       // User input
        ASSISTANT,  // Assistant response
        TOOL        // Tool/function result
    }

    private Role role;
    private String content;
    
    @Builder.Default
    private Map<String, Object> metadata = new HashMap<>();

    // Optional: for tool calls
    private String toolCallId;
    private String name;

    public static LLMMessage system(String content) {
        return LLMMessage.builder()
                .role(Role.SYSTEM)
                .content(content)
                .build();
    }

    public static LLMMessage user(String content) {
        return LLMMessage.builder()
                .role(Role.USER)
                .content(content)
                .build();
    }

    public static LLMMessage assistant(String content) {
        return LLMMessage.builder()
                .role(Role.ASSISTANT)
                .content(content)
                .build();
    }

    public static LLMMessage tool(String content, String toolCallId) {
        return LLMMessage.builder()
                .role(Role.TOOL)
                .content(content)
                .toolCallId(toolCallId)
                .build();
    }

    public boolean isSystem() {
        return role == Role.SYSTEM;
    }

    public boolean isUser() {
        return role == Role.USER;
    }

    public boolean isAssistant() {
        return role == Role.ASSISTANT;
    }
}
