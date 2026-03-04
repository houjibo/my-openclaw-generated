package com.cola.agent.llm;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.function.Consumer;

@Slf4j
@Component
@RequiredArgsConstructor
public class MoonshotClient implements LLMClient {

    @Value("${moonshot.api.key:}")
    private String apiKey;

    @Value("${moonshot.api.url:https://api.moonshot.cn/v1}")
    private String apiUrl;

    private final RestTemplate restTemplate = new RestTemplate();
    private static final String PROVIDER = "moonshot";
    private static final String DEFAULT_MODEL = "kimi-k2.5";

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
        return List.of("kimi-k2.5", "kimi-k2-0905-preview", "kimi-k2-turbo-preview", 
                      "kimi-k2-thinking", "kimi-k2-thinking-turbo", "moonshot-v1-8k",
                      "moonshot-v1-32k", "moonshot-v1-128k");
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
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("Authorization", "Bearer " + apiKey);

            Map<String, Object> requestBody = Map.of(
                    "model", options.getModel() != null ? options.getModel() : DEFAULT_MODEL,
                    "messages", messages.stream().map(this::convertMessage).toList(),
                    "temperature", options.getTemperature(),
                    "max_tokens", options.getMaxTokens(),
                    "stream", false
            );

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);
            
            @SuppressWarnings("unchecked")
            Map<String, Object> response = restTemplate.postForObject(
                    apiUrl + "/chat/completions", request, Map.class);

            @SuppressWarnings("unchecked")
            List<Map<String, Object>> choices = (List<Map<String, Object>>) response.get("choices");
            @SuppressWarnings("unchecked")
            Map<String, Object> message = (Map<String, Object>) choices.get(0).get("message");
            String content = (String) message.get("content");
            String finishReason = (String) choices.get(0).get("finish_reason");

            @SuppressWarnings("unchecked")
            Map<String, Object> usage = (Map<String, Object>) response.get("usage");
            Integer inputTokens = (Integer) usage.get("prompt_tokens");
            Integer outputTokens = (Integer) usage.get("completion_tokens");

            return LLMResponse.builder()
                    .content(content)
                    .model(options.getModel())
                    .provider(PROVIDER)
                    .success(true)
                    .inputTokens(inputTokens != null ? inputTokens : 0)
                    .outputTokens(outputTokens != null ? outputTokens : 0)
                    .totalTokens(inputTokens != null && outputTokens != null ? 
                            inputTokens + outputTokens : 0)
                    .finishReason(finishReason)
                    .timestamp(Instant.now())
                    .latency(Duration.between(start, Instant.now()))
                    .build();

        } catch (Exception e) {
            log.error("Moonshot chat failed", e);
            return LLMResponse.error(e.getMessage(), options.getModel(), PROVIDER);
        }
    }

    @Override
    public void chatStream(List<LLMMessage> messages, Consumer<LLMStreamChunk> chunkHandler) {
        log.warn("Streaming not yet implemented for Moonshot client");
    }

    @Override
    public CompletableFuture<LLMResponse> chatAsync(List<LLMMessage> messages) {
        return CompletableFuture.supplyAsync(() -> chat(messages));
    }

    @Override
    public int countTokens(String text) {
        // Rough estimate for Chinese: 1 token ≈ 1.5-2 characters
        return text.length() / 2;
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
            case "kimi-k2.5", "kimi-k2-0905-preview", "kimi-k2-turbo-preview",
                 "kimi-k2-thinking", "kimi-k2-thinking-turbo" -> 262144;
            case "moonshot-v1-128k" -> 131072;
            case "moonshot-v1-32k" -> 32768;
            case "moonshot-v1-8k" -> 8192;
            default -> 4096;
        };
    }

    @Override
    public boolean validateConfiguration() {
        return apiKey != null && !apiKey.isEmpty();
    }

    @Override
    public boolean isHealthy() {
        if (!validateConfiguration()) {
            return false;
        }
        try {
            chat(List.of(LLMMessage.user("Hi")));
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    private Map<String, String> convertMessage(LLMMessage message) {
        String role = switch (message.getRole()) {
            case SYSTEM -> "system";
            case USER -> "user";
            case ASSISTANT -> "assistant";
            case TOOL -> "tool";
        };
        return Map.of("role", role, "content", message.getContent());
    }
}
