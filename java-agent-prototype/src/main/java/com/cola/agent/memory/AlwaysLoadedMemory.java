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

/**
 * Always-Loaded Memory - Tier 1 memory
 *
 * Core essentials (~100 lines max)
 * File: MEMORY.md
 * Behavior: Loaded into memory at startup, truncated if exceeds max size
 */
@Slf4j
@Component
public class AlwaysLoadedMemory implements MemoryStore {

    private static final String MEMORY_FILE = "MEMORY.md";
    private static final int MAX_LINES = 100;
    private static final int MAX_BYTES = 100 * 80; // ~100 lines x 80 chars

    private final WorkspaceConfig workspaceConfig;
    private String cachedContent;

    public AlwaysLoadedMemory(WorkspaceConfig workspaceConfig) {
        this.workspaceConfig = workspaceConfig;
        this.cachedContent = "";
        initialize();
    }

    /**
     * Initialize: Load MEMORY.md or create if doesn't exist
     */
    private void initialize() {
        Path memoryPath = Paths.get(workspaceConfig.getMemoryDirectoryPath(), MEMORY_FILE);
        File memoryFile = memoryPath.toFile();

        if (!memoryFile.exists()) {
            try {
                Files.createDirectories(memoryPath.getParent());
                Files.writeString(memoryPath, "# MEMORY.md - Long-term Memory\n\n", StandardOpenOption.CREATE, StandardOpenOption.WRITE);
                log.info("Created MEMORY.md at: {}", memoryPath);
                this.cachedContent = "";
            } catch (IOException e) {
                log.error("Failed to create MEMORY.md", e);
            }
        } else {
            try {
                String content = Files.readString(memoryPath);
                this.cachedContent = content;
                log.info("Loaded MEMORY.md: {} characters", content.length());
            } catch (IOException e) {
                log.error("Failed to load MEMORY.md", e);
                this.cachedContent = "";
            }
        }
    }

    @Override
    public String getAlwaysLoaded() {
        return cachedContent;
    }

    @Override
    public void updateAlwaysLoaded(String content) {
        // Truncate to max lines or bytes
        String truncated = truncateContent(content);

        // Update cache
        this.cachedContent = truncated;

        // Write to file
        Path memoryPath = Paths.get(workspaceConfig.getMemoryDirectoryPath(), MEMORY_FILE);
        try {
            Files.writeString(memoryPath, truncated, StandardOpenOption.WRITE, StandardOpenOption.TRUNCATE_EXISTING);
            log.debug("Updated MEMORY.md: {} characters", truncated.length());
        } catch (IOException e) {
            log.error("Failed to update MEMORY.md", e);
        }
    }

    /**
     * Truncate content to max size
     */
    private String truncateContent(String content) {
        // Check line count
        String[] lines = content.split("\n");
        if (lines.length > MAX_LINES) {
            // Keep first MAX_LINES
            StringBuilder sb = new StringBuilder();
            for (int i = 0; i < MAX_LINES; i++) {
                sb.append(lines[i]).append("\n");
            }
            content = sb.toString();
            log.warn("Truncated MEMORY.md to {} lines (max: {})", MAX_LINES, MAX_LINES);
        }

        // Check byte count
        if (content.getBytes().length > MAX_BYTES) {
            content = content.substring(0, MAX_BYTES);
            log.warn("Truncated MEMORY.md to {} bytes (max: {})", MAX_BYTES, MAX_BYTES);
        }

        return content;
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
        throw new UnsupportedOperationException("Deep knowledge is handled by DeepKnowledgeMemory");
    }

    @Override
    public void addDeepKnowledge(String topic, String content) {
        throw new UnsupportedOperationException("Deep knowledge is handled by DeepKnowledgeMemory");
    }

    @Override
    public MemoryDocument getDeepKnowledge(String topic) {
        throw new UnsupportedOperationException("Deep knowledge is handled by DeepKnowledgeMemory");
    }
}
