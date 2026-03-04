package com.cola.agent.llm;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.messages.*;
import org.springframework.ai.chat.model.ChatResponse;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.ai.openai.OpenAiChatModel;
import org.springframework.ai.openai.OpenAiChatOptions;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.function.Consumer;
import java.util.stream.Collectors;

@Slf4j
@Component
@RequiredArgsConstructor
public class OpenAIClient implements LLMClient {

    private final OpenAiChatModel chatModel;
    private static final String PROVIDER = "openai";
    private static final String DEFAULT_MODEL = "gpt-4o";

    @Override
    public String getProvider() {
        return PROVIDER;
    }

    @Override
    public String getDefaultModel() {
        return DEFAULT_MODEL;
    }

    @Override
    public List<String> listModels() {
        return List.of("gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-4", "gpt-3.5-turbo");
    }

    @Override
    public boolean isModelAvailable(String model) {
        return listModels().contains(model);
    }

    @Override
    public LLMResponse complete(String prompt) {
        return complete(prompt, DEFAULT_MODEL);
    }

    @Override
    public LLMResponse complete(String prompt, String model) {
        return chat(List.of(LLMMessage.user(prompt)), model);
    }

    @Override
    public LLMResponse chat(List<LLMMessage> messages) {
        return chat(messages, DEFAULT_MODEL);
    }

    @Override
    public LLMResponse chat(List<LLMMessage> messages, String model) {
        LLMOptions options = LLMOptions.builder().model(model).build();
        return chat(messages, options);
    }

    @Override
    public LLMResponse chat(List<LLMMessage> messages, LLMOptions options) {
        Instant start = Instant.now();
        
        try {
            List<Message> springMessages = messages.stream()
                    .map(this::convertMessage)
                    .collect(Collectors.toList());

            OpenAiChatOptions chatOptions = OpenAiChatOptions.builder()
                    .model(options.getModel() != null ? options.getModel() : DEFAULT_MODEL)
                    .temperature(options.getTemperature())
                    .maxTokens(options.getMaxTokens())
                    .topP(options.getTopP())
                    .build();

            Prompt prompt = new Prompt(springMessages, chatOptions);
            ChatResponse response = chatModel.call(prompt);

            String content = response.getResult().getOutput().getText();
            String finishReason = response.getResult().getMetadata().getFinishReason();

            return LLMResponse.builder()
                    .content(content)
                    .model(options.getModel())
                    .provider(PROVIDER)
                    .success(true)
                    .finishReason(finishReason)
                    .timestamp(Instant.now())
                    .latency(Duration.between(start, Instant.now()))
                    .build();

        } catch (Exception e) {
            log.error("OpenAI chat failed", e);
            return LLMResponse.error(e.getMessage(), options.getModel(), PROVIDER);
        }
    }

    @Override
    public void chatStream(List<LLMMessage> messages, Consumer<LLMStreamChunk> chunkHandler) {
        // Implementation for streaming
        log.warn("Streaming not yet implemented for OpenAI client");
    }

    @Override
    public CompletableFuture<LLMResponse> chatAsync(List<LLMMessage> messages) {
        return CompletableFuture.supplyAsync(() -> chat(messages));
    }

    @Override
    public int countTokens(String text) {
        // Rough estimate: 1 token ≈ 4 characters
        return text.length() / 4;
    }

    @Override
    public int countTokens(List<LLMMessage> messages) {
        return messages.stream()
                .mapToInt(m -> countTokens(m.getContent()))
                .sum();
    }

    @Override
    public int getContextWindow(String model) {
        return switch (model) {
            case "gpt-4o", "gpt-4o-mini", "gpt-4-turbo" -> 128000;
            case "gpt-4" -> 8192;
            case "gpt-3.5-turbo" -> 16385;
            default -> 4096;
        };
    }

    @Override
    public boolean validateConfiguration() {
        try {
            chatModel.call(new Prompt("Hi"));
            return true;
        } catch (Exception e) {
            log.error("OpenAI configuration invalid", e);
            return false;
        }
    }

    @Override
    public boolean isHealthy() {
        return validateConfiguration();
    }

    private Message convertMessage(LLMMessage message) {
        return switch (message.getRole()) {
            case SYSTEM -> new SystemMessage(message.getContent());
            case USER -> new UserMessage(message.getContent());
            case ASSISTANT -> new AssistantMessage(message.getContent());
            case TOOL -> new ToolResponseMessage(message.getToolCallId(), message.getName(), message.getContent());
        };
    }
}
