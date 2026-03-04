package com.cola.agent.memory;

import com.cola.agent.config.WorkspaceConfig;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardOpenOption;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

/**
 * Daily Context Memory - Tier 2 memory
 *
 * Recent context (today + yesterday)
 * File: YYYY-MM-DD.md
 * Behavior: Append-only, file-based
 */
@Slf4j
@Component
public class DailyContextMemory implements MemoryStore {

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    private final WorkspaceConfig workspaceConfig;

    public DailyContextMemory(WorkspaceConfig workspaceConfig) {
        this.workspaceConfig = workspaceConfig;
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
        Path dailyPath = getDailyPath(date);
        File dailyFile = dailyPath.toFile();

        if (!dailyFile.exists()) {
            log.debug("Daily context file not found: {}", dailyPath);
            return "";
        }

        try {
            String content = Files.readString(dailyPath);
            log.debug("Loaded daily context for {}: {} characters", date, content.length());
            return content;
        } catch (IOException e) {
            log.error("Failed to load daily context for: {}", date, e);
            return "";
        }
    }

    @Override
    public void appendDailyContext(LocalDate date, String content) {
        Path dailyPath = getDailyPath(date);
        File dailyFile = dailyPath.toFile();

        try {
            // Create parent directories if needed
            if (!dailyFile.exists()) {
                Files.createDirectories(dailyPath.getParent());
            }

            // Append content with separator
            String separator = "\n\n---\n\n";
            String newContent;
            if (dailyFile.exists()) {
                String existing = Files.readString(dailyPath);
                newContent = existing + separator + content;
            } else {
                newContent = "# Daily Context: " + date.format(DATE_FORMATTER) + "\n\n" + content;
            }

            Files.writeString(dailyPath, newContent, StandardOpenOption.CREATE, StandardOpenOption.WRITE);
            log.debug("Appended {} characters to daily context: {}", content.length(), date);
        } catch (IOException e) {
            log.error("Failed to append daily context for: {}", date, e);
        }
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

    /**
     * Get daily file path
     */
    private Path getDailyPath(LocalDate date) {
        String filename = date.format(DATE_FORMATTER) + ".md";
        return Paths.get(workspaceConfig.getMemoryDirectoryPath(), filename);
    }

    /**
     * Get today and yesterday context
     */
    public String getTodayAndYesterdayContext() {
        LocalDate today = LocalDate.now();
        LocalDate yesterday = today.minusDays(1);

        String todayContent = getDailyContext(today);
        String yesterdayContent = getDailyContext(yesterday);

        StringBuilder sb = new StringBuilder();
        sb.append("## Today (").append(today.format(DATE_FORMATTER)).append(")\n\n");
        sb.append(todayContent);
        sb.append("\n\n");
        sb.append("## Yesterday (").append(yesterday.format(DATE_FORMATTER)).append(")\n\n");
        sb.append(yesterdayContent);

        return sb.toString();
    }
}
