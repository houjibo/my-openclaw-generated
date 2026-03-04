package com.cola.agent.memory;

import java.time.LocalDate;
import java.util.List;

/**
 * Memory Store - Unified interface for three-tier memory system
 *
 * Three tiers:
 * - Tier 1: Always-Loaded (~100 lines max, in-memory)
 * - Tier 2: Daily Context (today + yesterday, file-based)
 * - Tier 3: Deep Knowledge (vector search, file-based)
 */
public interface MemoryStore {

    /**
     * Tier 1: Always-Loaded Memory
     * Core essentials (~100 lines max)
     * Loaded into memory at startup
     */
    String getAlwaysLoaded();

    /**
     * Update always-loaded memory
     * Truncates to max size if needed
     */
    void updateAlwaysLoaded(String content);

    /**
     * Tier 2: Daily Context Memory
     * Recent context (today + yesterday)
     * File-based storage: YYYY-MM-DD.md
     */
    String getDailyContext(LocalDate date);

    /**
     * Append to daily context memory
     */
    void appendDailyContext(LocalDate date, String content);

    /**
     * Tier 3: Deep Knowledge Memory
     * Long-term knowledge with vector search
     * Directories: people/, projects/, topics/, decisions/
     */
    List<MemoryDocument> searchDeepKnowledge(String query, int topK);

    /**
     * Add document to deep knowledge
     */
    void addDeepKnowledge(String topic, String content);

    /**
     * Get document by topic
     */
    MemoryDocument getDeepKnowledge(String topic);

    /**
     * Memory document
     */
    record MemoryDocument(
        String topic,
        String content,
        String path,
        LocalDate createdAt
    ) {}
}
