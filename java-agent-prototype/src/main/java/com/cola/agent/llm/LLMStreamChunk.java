package com.cola.agent.llm;

import lombok.Builder;
import lombok.Data;

/**
 * LLM Stream Chunk - Single chunk from streaming response
 */
@Data
@Builder
public class LLMStreamChunk {

    private String content;
    private boolean last;
    private String finishReason;
    
    // Token counts (if available)
    private Integer inputTokens;
    private Integer outputTokens;

    public static LLMStreamChunk of(String content) {
        return LLMStreamChunk.builder()
                .content(content)
                .last(false)
                .build();
    }

    public static LLMStreamChunk last(String content) {
        return LLMStreamChunk.builder()
                .content(content)
                .last(true)
                .build();
    }

    public boolean isEmpty() {
        return content == null || content.isEmpty();
    }
}
