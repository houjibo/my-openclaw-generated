package com.cola.agent.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;
import lombok.extern.slf4j.Slf4j;

/**
 * Workspace Configuration
 *
 * Defines the workspace directory structure for agents and memory
 */
@Slf4j
@Data
@Configuration
@ConfigurationProperties(prefix = "spring.workspace")
public class WorkspaceConfig {

    /**
     * Base directory for the workspace
     * Default: ~/.openclaw/workspace
     */
    private String baseDir = System.getProperty("user.home") + "/.openclaw/workspace";

    /**
     * Directory containing agent definitions (Markdown files)
     * Relative to baseDir
     */
    private String agentsDir = "agents";

    /**
     * Directory containing memory files
     * Relative to baseDir
     */
    private String memoryDir = "workspace/memory";

    /**
     * Get full path to agents directory
     */
    public String getAgentsDirectoryPath() {
        return baseDir + "/" + agentsDir;
    }

    /**
     * Get full path to memory directory
     */
    public String getMemoryDirectoryPath() {
        return baseDir + "/" + memoryDir;
    }

    /**
     * Initialize directories if they don't exist
     */
    public void initializeDirectories() {
        java.io.File agentsDir = new java.io.File(getAgentsDirectoryPath());
        java.io.File memoryDir = new java.io.File(getMemoryDirectoryPath());

        if (!agentsDir.exists()) {
            log.info("Creating agents directory: {}", agentsDir.getAbsolutePath());
            agentsDir.mkdirs();
        }

        if (!memoryDir.exists()) {
            log.info("Creating memory directory: {}", memoryDir.getAbsolutePath());
            memoryDir.mkdirs();
        }

        log.info("Workspace configured - Base: {}, Agents: {}, Memory: {}",
                baseDir, getAgentsDirectoryPath(), getMemoryDirectoryPath());
    }
}
