package com.cola.agent.a2a;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AgentCoordinator {
    private final A2AService a2aService;

    public enum CoordinationPattern {
        BROADCAST,      // Send to all agents
        ROUND_ROBIN,    // Distribute among agents
        LOAD_BALANCED,  // Send to least busy agent
        PIPELINE,       // Chain agents sequentially
        PARALLEL        // Execute in parallel
    }

    public List<A2AMessage> coordinate(String task, CoordinationPattern pattern, 
                                       List<String> agentIds) {
        switch (pattern) {
            case BROADCAST:
                return broadcast(task, agentIds);
            case ROUND_ROBIN:
                return roundRobin(task, agentIds);
            case LOAD_BALANCED:
                return loadBalanced(task, agentIds);
            case PIPELINE:
                return pipeline(task, agentIds);
            case PARALLEL:
                return parallel(task, agentIds);
            default:
                throw new IllegalArgumentException("Unknown pattern: " + pattern);
        }
    }

    private List<A2AMessage> broadcast(String task, List<String> agentIds) {
        log.info("Broadcasting task to {} agents", agentIds.size());
        return a2aService.broadcast("coordinator", agentIds, task);
    }

    private List<A2AMessage> roundRobin(String task, List<String> agentIds) {
        // Simple round-robin: pick first available
        for (String agentId : agentIds) {
            if (a2aService.isAgentAvailable(agentId)) {
                A2AMessage response = a2aService.sendMessage("coordinator", agentId, task);
                return Collections.singletonList(response);
            }
        }
        log.warn("No available agents for round-robin");
        return Collections.emptyList();
    }

    private List<A2AMessage> loadBalanced(String task, List<String> agentIds) {
        // Find agent with lowest load (simplified: just pick first available)
        Optional<String> availableAgent = agentIds.stream()
                .filter(a2aService::isAgentAvailable)
                .findFirst();

        if (availableAgent.isPresent()) {
            A2AMessage response = a2aService.sendMessage("coordinator", availableAgent.get(), task);
            return Collections.singletonList(response);
        }
        log.warn("No available agents for load balancing");
        return Collections.emptyList();
    }

    private List<A2AMessage> pipeline(String task, List<String> agentIds) {
        log.info("Executing pipeline with {} agents", agentIds.size());
        String currentInput = task;
        List<A2AMessage> results = new ArrayList<>();

        for (String agentId : agentIds) {
            if (!a2aService.isAgentAvailable(agentId)) {
                log.warn("Agent {} not available in pipeline", agentId);
                continue;
            }

            A2AMessage response = a2aService.sendMessage("coordinator", agentId, currentInput);
            results.add(response);

            if (response.isError()) {
                log.error("Pipeline failed at agent {}", agentId);
                break;
            }

            // Use output as next input
            currentInput = response.getPayload();
        }

        return results;
    }

    private List<A2AMessage> parallel(String task, List<String> agentIds) {
        log.info("Executing parallel task on {} agents", agentIds.size());

        List<CompletableFuture<A2AMessage>> futures = agentIds.stream()
                .filter(a2aService::isAgentAvailable)
                .map(agentId -> a2aService.sendMessageAsync("coordinator", agentId, task))
                .collect(Collectors.toList());

        CompletableFuture<Void> allDone = CompletableFuture.allOf(
                futures.toArray(new CompletableFuture[0]));

        try {
            allDone.join();
            return futures.stream()
                    .map(CompletableFuture::join)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Parallel execution failed", e);
            return Collections.emptyList();
        }
    }

    public String aggregateResults(List<A2AMessage> responses, AggregationStrategy strategy) {
        switch (strategy) {
            case FIRST_SUCCESS:
                return responses.stream()
                        .filter(r -> !r.isError())
                        .findFirst()
                        .map(A2AMessage::getPayload)
                        .orElse("No successful response");

            case CONCATENATE:
                return responses.stream()
                        .map(A2AMessage::getPayload)
                        .collect(Collectors.joining("\n---\n"));

            case VOTE:
                // Simple voting: return most common response
                return responses.stream()
                        .collect(Collectors.groupingBy(A2AMessage::getPayload, Collectors.counting()))
                        .entrySet().stream()
                        .max(Map.Entry.comparingByValue())
                        .map(Map.Entry::getKey)
                        .orElse("No consensus");

            default:
                return CONCATENATE.toString();
        }
    }

    public enum AggregationStrategy {
        FIRST_SUCCESS,
        CONCATENATE,
        VOTE
    }
}
