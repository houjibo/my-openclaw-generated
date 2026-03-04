package com.cola.agent.memory;

import com.cola.agent.config.WorkspaceConfig;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardOpenOption;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Deep Knowledge Memory - Tier 3 memory
 *
 * Long-term knowledge with simple keyword-based search
 * Directories: people/, projects/, topics/, decisions/
 * File structure:
 *   - people/{name}.md
 *   - projects/{name}.md
 *   - topics/{name}.md
 *   - decisions/{name}.md
 *
 * Note: Vector search using Spring AI VectorStore will be added later
 */
@Slf4j
@Component
public class DeepKnowledgeMemory implements MemoryStore {

    private static final int DEFAULT_TOP_K = 5;
    private static final Map<String, String> SUBDIRECTORIES = Map.of(
        "people", "people",
        "projects", "projects",
        "topics", "topics",
        "decisions", "decisions"
    );

    private final WorkspaceConfig workspaceConfig;
    private final Map<String, MemoryDocument> cache;

    public DeepKnowledgeMemory(WorkspaceConfig workspaceConfig) {
        this.workspaceConfig = workspaceConfig;
        this.cache = new HashMap<>();
        initialize();
    }

    /**
     * Initialize: Create subdirectories and load cache
     */
    private void initialize() {
        String baseDir = workspaceConfig.getMemoryDirectoryPath();

        // Create subdirectories
        for (String subDirName : SUBDIRECTORIES.values()) {
            Path subDirPath = Paths.get(baseDir, subDirName);
            File subDir = subDirPath.toFile();
            if (!subDir.exists()) {
                try {
                    Files.createDirectories(subDirPath);
                    log.info("Created subdirectory: {}", subDirPath);
                } catch (IOException e) {
                    log.error("Failed to create subdirectory: {}", subDirPath, e);
                }
            }
        }

        // Load cache
        reloadCache();
    }

    /**
     * Reload cache from files
     */
    private void reloadCache() {
        cache.clear();
        String baseDir = workspaceConfig.getMemoryDirectoryPath();

        for (Map.Entry<String, String> entry : SUBDIRECTORIES.entrySet()) {
            String category = entry.getKey();
            String subDirName = entry.getValue();
            Path subDirPath = Paths.get(baseDir, subDirName);
            File subDir = subDirPath.toFile();

            if (!subDir.exists()) {
                continue;
            }

            File[] files = subDir.listFiles((d, name) -> name.endsWith(".md"));
            if (files != null) {
                for (File file : files) {
                    try {
                        String topic = file.getName().replace(".md", "");
                        String content = Files.readString(file.toPath());
                        MemoryDocument doc = new MemoryDocument(
                            category + ":" + topic,
                            content,
                            file.getAbsolutePath(),
                            LocalDate.now()
                        );
                        cache.put(doc.topic(), doc);
                    } catch (IOException e) {
                        log.error("Failed to load file: {}", file.getName(), e);
                    }
                }
            }
        }

        log.info("Loaded {} documents into deep knowledge cache", cache.size());
    }

    @Override
    public String getAlwaysLoaded() {
        throw new UnsupportedOperationException("Always-loaded is handled by AlwaysLoadedMemory");
    }

    @Override
    public void updateAlwaysLoaded(String content) {
        throw new UnsupportedOperationException("Always-loaded is handled by AlwaysLoadedMemory");
    }

    @Override
    public String getDailyContext(LocalDate date) {
        throw new UnsupportedOperationException("Daily context is handled by DailyContextMemory");
    }

    @Override
    public void appendDailyContext(LocalDate date, String content) {
        throw new UnsupportedOperationException("Daily context is handled by DailyContextMemory");
    }

    @Override
    public List<MemoryDocument> searchDeepKnowledge(String query, int topK) {
        List<MemoryDocument> results = new ArrayList<>();

        // Simple keyword-based search (for now)
        String[] keywords = query.toLowerCase().split("\\s+");

        for (MemoryDocument doc : cache.values()) {
            String content = doc.content().toLowerCase();
            int matchCount = 0;

            for (String keyword : keywords) {
                if (content.contains(keyword)) {
                    matchCount++;
                }
            }

            if (matchCount > 0) {
                results.add(doc);
            }
        }

        // Sort by match count (descending)
        results.sort((a, b) -> {
            int countA = countMatches(a.content().toLowerCase(), keywords);
            int countB = countMatches(b.content().toLowerCase(), keywords);
            return Integer.compare(countB, countA);
        });

        // Return top K results
        int limit = Math.min(topK, results.size());
        return results.subList(0, limit);
    }

    /**
     * Count keyword matches in content
     */
    private int countMatches(String content, String[] keywords) {
        int count = 0;
        for (String keyword : keywords) {
            if (content.contains(keyword)) {
                count++;
            }
        }
        return count;
    }

    @Override
    public void addDeepKnowledge(String topic, String content) {
        // Parse topic (e.g., "person:John" -> "people/John.md")
        String[] parts = topic.split(":", 2);
        if (parts.length != 2) {
            log.error("Invalid topic format: {}. Expected: 'category:name'", topic);
            return;
        }

        String category = parts[0];
        String name = parts[1];

        String subDirName = SUBDIRECTORIES.get(category);
        if (subDirName == null) {
            log.error("Invalid category: {}. Expected one of: {}", category, SUBDIRECTORIES.keySet());
            return;
        }

        Path filePath = Paths.get(workspaceConfig.getMemoryDirectoryPath(), subDirName, name + ".md");
        File file = filePath.toFile();

        try {
            Files.createDirectories(filePath.getParent());
            Files.writeString(filePath, content, StandardOpenOption.CREATE, StandardOpenOption.WRITE);
            log.info("Saved deep knowledge: {}", filePath);

            // Update cache
            MemoryDocument doc = new MemoryDocument(topic, content, filePath.toString(), LocalDate.now());
            cache.put(topic, doc);
        } catch (IOException e) {
            log.error("Failed to save deep knowledge: {}", filePath, e);
        }
    }

    @Override
    public MemoryDocument getDeepKnowledge(String topic) {
        return cache.get(topic);
    }

    /**
     * Get all documents in a category
     */
    public List<MemoryDocument> getDocumentsByCategory(String category) {
        List<MemoryDocument> results = new ArrayList<>();

        for (MemoryDocument doc : cache.values()) {
            if (doc.topic().startsWith(category + ":")) {
                results.add(doc);
            }
        }

        return results;
    }

    /**
     * Get statistics
     */
    public Map<String, Integer> getStatistics() {
        Map<String, Integer> stats = new HashMap<>();

        for (String category : SUBDIRECTORIES.keySet()) {
            int count = getDocumentsByCategory(category).size();
            stats.put(category, count);
        }

        return stats;
    }
}
