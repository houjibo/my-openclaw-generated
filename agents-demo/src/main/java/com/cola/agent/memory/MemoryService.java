package com.cola.agent.memory;

import com.cola.agent.config.WorkspaceConfig;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

/**
 * Memory Service - Unified service for three-tier memory system
 *
 * Provides a single entry point for all memory operations
 * Coordinates between the three memory tiers
 */
@Slf4j
@Service
public class MemoryService {

    private final AlwaysLoadedMemory alwaysLoadedMemory;
    private final DailyContextMemory dailyContextMemory;
    private final DeepKnowledgeMemory deepKnowledgeMemory;

    public MemoryService(
            AlwaysLoadedMemory alwaysLoadedMemory,
            DailyContextMemory dailyContextMemory,
            DeepKnowledgeMemory deepKnowledgeMemory
    ) {
        this.alwaysLoadedMemory = alwaysLoadedMemory;
        this.dailyContextMemory = dailyContextMemory;
        this.deepKnowledgeMemory = deepKnowledgeMemory;
    }

    /**
     * Get all memory context for AI
     *
     * Combines:
     * - Always-Loaded (Tier 1)
     * - Daily Context (Tier 2, today + yesterday)
     * - Deep Knowledge (Tier 3, top matches from search)
     */
    public String getAllMemoryContext() {
        StringBuilder context = new StringBuilder();

        // Tier 1: Always-Loaded
        String alwaysLoaded = alwaysLoadedMemory.getAlwaysLoaded();
        if (!alwaysLoaded.isEmpty()) {
            context.append("## Always-Loaded Memory\n\n");
            context.append(alwaysLoaded);
            context.append("\n\n");
        }

        // Tier 2: Daily Context
        String dailyContext = dailyContextMemory.getTodayAndYesterdayContext();
        if (!dailyContext.isEmpty()) {
            context.append(dailyContext);
            context.append("\n\n");
        }

        // Tier 3: Deep Knowledge (optional, can be added separately)
        // Not including in default context to save tokens
        // Use search() method to retrieve specific deep knowledge

        return context.toString();
    }

    /**
     * Search deep knowledge
     */
    public List<MemoryDocument> searchDeepKnowledge(String query, int topK) {
        log.debug("Searching deep knowledge: {} (top {})", query, topK);
        List<MemoryDocument> results = deepKnowledgeMemory.searchDeepKnowledge(query, topK);
        log.debug("Found {} documents matching: {}", results.size(), query);
        return results;
    }

    /**
     * Add deep knowledge document
     */
    public void addDeepKnowledge(String topic, String content) {
        deepKnowledgeMemory.addDeepKnowledge(topic, content);
    }

    /**
     * Update always-loaded memory
     */
    public void updateAlwaysLoaded(String content) {
        alwaysLoadedMemory.updateAlwaysLoaded(content);
    }

    /**
     * Append to daily context
     */
    public void appendDailyContext(String content) {
        LocalDate today = LocalDate.now();
        dailyContextMemory.appendDailyContext(today, content);
    }

    /**
     * Get deep knowledge document
     */
    public MemoryDocument getDeepKnowledge(String topic) {
        return deepKnowledgeMemory.getDeepKnowledge(topic);
    }

    /**
     * Get memory statistics
     */
    public MemoryStatistics getStatistics() {
        int alwaysLoadedSize = alwaysLoadedMemory.getAlwaysLoaded().length();
        String today = LocalDate.now().format(java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd"));
        String yesterday = LocalDate.now().minusDays(1).format(java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd"));
        int dailyContextSize = dailyContextMemory.getDailyContext(LocalDate.now()).length() +
                             dailyContextMemory.getDailyContext(LocalDate.now().minusDays(1)).length();
        Map<String, Integer> deepKnowledgeStats = deepKnowledgeMemory.getStatistics();

        return new MemoryStatistics(
            alwaysLoadedSize,
            dailyContextSize,
            deepKnowledgeStats
        );
    }

    /**
     * Memory statistics record
     */
    public record MemoryStatistics(
        int alwaysLoadedSize,
        int dailyContextSize,
        Map<String, Integer> deepKnowledgeStats
    ) {}
}
