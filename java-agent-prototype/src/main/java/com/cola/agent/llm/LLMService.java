package com.cola.agent.llm;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import javax.annotation.PostConstruct;
import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.function.Consumer;

@Slf4j
@Service
@RequiredArgsConstructor
public class LLMService {

    private final List<LLMClient> clients;
    private final Map<String, LLMClient> clientMap = new HashMap<>();
    
    private String defaultProvider = "moonshot";
    private String defaultModel = "kimi-k2.5";

    @PostConstruct
    public void init() {
        for (LLMClient client : clients) {
            clientMap.put(client.getProvider(), client);
            log.info("Registered LLM client: {}", client.getProvider());
        }
        
        // Set default to first available client if moonshot not available
        if (!clientMap.containsKey(defaultProvider) && !clients.isEmpty()) {
            defaultProvider = clients.get(0).getProvider();
            defaultModel = clients.get(0).getDefaultModel();
        }
        
        log.info("LLM Service initialized with {} clients, default: {}", 
                clients.size(), defaultProvider);
    }

    public LLMResponse chat(String message) {
        return chat(List.of(LLMMessage.user(message)));
    }

    public LLMResponse chat(List<LLMMessage> messages) {
        return getDefaultClient().chat(messages, defaultModel);
    }

    public LLMResponse chat(List<LLMMessage> messages, String provider, String model) {
        LLMClient client = getClient(provider);
        if (model != null) {
            LLMOptions options = LLMOptions.builder().model(model).build();
            return client.chat(messages, options);
        }
        return client.chat(messages);
    }

    public LLMResponse chatWithOptions(List<LLMMessage> messages, LLMOptions options) {
        String provider = options.getModel() != null && options.getModel().contains(":") 
                ? options.getModel().split(":")[0] 
                : defaultProvider;
        
        LLMClient client = getClient(provider);
        return client.chat(messages, options);
    }

    public CompletableFuture<LLMResponse> chatAsync(String message) {
        return chatAsync(List.of(LLMMessage.user(message)));
    }

    public CompletableFuture<LLMResponse> chatAsync(List<LLMMessage> messages) {
        return getDefaultClient().chatAsync(messages);
    }

    public void chatStream(String message, Consumer<LLMStreamChunk> chunkHandler) {
        chatStream(List.of(LLMMessage.user(message)), chunkHandler);
    }

    public void chatStream(List<LLMMessage> messages, Consumer<LLMStreamChunk> chunkHandler) {
        getDefaultClient().chatStream(messages, chunkHandler);
    }

    public LLMClient getClient(String provider) {
        LLMClient client = clientMap.get(provider);
        if (client == null) {
            throw new IllegalArgumentException("Unknown provider: " + provider);
        }
        return client;
    }

    public LLMClient getDefaultClient() {
        return getClient(defaultProvider);
    }

    public void setDefaultProvider(String provider) {
        if (!clientMap.containsKey(provider)) {
            throw new IllegalArgumentException("Provider not available: " + provider);
        }
        this.defaultProvider = provider;
        this.defaultModel = clientMap.get(provider).getDefaultModel();
        log.info("Default provider changed to: {}", provider);
    }

    public List<String> listProviders() {
        return new ArrayList<>(clientMap.keySet());
    }

    public List<String> listModels(String provider) {
        return getClient(provider).listModels();
    }

    public boolean isProviderAvailable(String provider) {
        return clientMap.containsKey(provider) && clientMap.get(provider).isHealthy();
    }

    public Map<String, Boolean> getHealthStatus() {
        Map<String, Boolean> status = new HashMap<>();
        for (Map.Entry<String, LLMClient> entry : clientMap.entrySet()) {
            status.put(entry.getKey(), entry.getValue().isHealthy());
        }
        return status;
    }

    public int estimateTokens(String text, String provider) {
        return getClient(provider).countTokens(text);
    }

    public int estimateTokens(List<LLMMessage> messages, String provider) {
        return getClient(provider).countTokens(messages);
    }

    public boolean validateConfiguration(String provider) {
        return getClient(provider).validateConfiguration();
    }

    public LLMResponse routeToBestProvider(List<LLMMessage> messages, String requirement) {
        // Simple routing logic based on requirements
        return switch (requirement.toLowerCase()) {
            case "fast", "speed" -> routeToFastest(messages);
            case "cheap", "economy" -> routeToCheapest(messages);
            case "quality", "best" -> routeToBestQuality(messages);
            case "long_context", "large_context" -> routeToLongContext(messages);
            default -> chat(messages);
        };
    }

    private LLMResponse routeToFastest(List<LLMMessage> messages) {
        // Prioritize turbo models
        if (clientMap.containsKey("moonshot")) {
            return clientMap.get("moonshot").chat(messages, "kimi-k2-turbo-preview");
        }
        return chat(messages);
    }

    private LLMResponse routeToCheapest(List<LLMMessage> messages) {
        // Use smaller/cheaper models
        if (clientMap.containsKey("openai")) {
            return clientMap.get("openai").chat(messages, "gpt-4o-mini");
        }
        return chat(messages);
    }

    private LLMResponse routeToBestQuality(List<LLMMessage> messages) {
        // Use best available model
        if (clientMap.containsKey("moonshot")) {
            return clientMap.get("moonshot").chat(messages, "kimi-k2.5");
        }
        return chat(messages);
    }

    private LLMResponse routeToLongContext(List<LLMMessage> messages) {
        // Use models with largest context
        if (clientMap.containsKey("moonshot")) {
            return clientMap.get("moonshot").chat(messages, "kimi-k2.5");
        }
        return chat(messages);
    }
}
