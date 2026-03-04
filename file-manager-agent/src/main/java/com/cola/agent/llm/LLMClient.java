package com.cola.agent.llm;

import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.function.Consumer;

/**
 * LLM Client - Unified interface for LLM providers
 *
 * Abstracts different LLM providers (OpenAI, Anthropic, DeepSeek, Moonshot) 
 * behind a common interface.
 */
public interface LLMClient {

    /**
     * Provider identifier
     */
    String getProvider();

    /**
     * Default model for this provider
     */
    String getDefaultModel();

    /**
     * List available models
     */
    List<String> listModels();

    /**
     * Check if model is available
     */
    boolean isModelAvailable(String model);

    /**
     * Send a simple completion request
     */
    LLMResponse complete(String prompt);

    /**
     * Send a completion request with specific model
     */
    LLMResponse complete(String prompt, String model);

    /**
     * Send a chat completion request
     */
    LLMResponse chat(List<LLMMessage> messages);

    /**
     * Send a chat completion request with specific model
     */
    LLMResponse chat(List<LLMMessage> messages, String model);

    /**
     * Send a chat completion with options
     */
    LLMResponse chat(List<LLMMessage> messages, LLMOptions options);

    /**
     * Stream chat completion (SSE)
     */
    void chatStream(List<LLMMessage> messages, Consumer<LLMStreamChunk> chunkHandler);

    /**
     * Async chat completion
     */
    CompletableFuture<LLMResponse> chatAsync(List<LLMMessage> messages);

    /**
     * Count tokens in text
     */
    int countTokens(String text);

    /**
     * Count tokens in messages
     */
    int countTokens(List<LLMMessage> messages);

    /**
     * Get context window size for model
     */
    int getContextWindow(String model);

    /**
     * Validate API key/configuration
     */
    boolean validateConfiguration();

    /**
     * Check if client is healthy
     */
    boolean isHealthy();
}
