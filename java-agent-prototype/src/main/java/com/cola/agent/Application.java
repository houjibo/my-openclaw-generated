package com.cola.agent;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.ConfigurableApplicationContext;
import lombok.extern.slf4j.Slf4j;

/**
 * Java Agent Prototype - Local AI Agent System
 *
 * Features:
 * - Agent definition via Markdown files
 * - Three-tier memory system (Always-Loaded, Daily, Deep Knowledge)
 * - Intent analysis and classification
 * - A2A Protocol for agent-to-agent communication
 * - Support for multiple LLM providers (OpenAI, Anthropic, DeepSeek)
 *
 * @author Cola
 * @version 0.1.0
 */
@Slf4j
@SpringBootApplication
public class Application {

    public static void main(String[] args) {
        log.info("========================================");
        log.info("Java Agent Prototype Starting...");
        log.info("========================================");

        ConfigurableApplicationContext context = SpringApplication.run(Application.class, args);

        // Display startup information
        displayStartupInfo(context);

        log.info("========================================");
        log.info("Java Agent Prototype Started Successfully!");
        log.info("========================================");
    }

    private static void displayStartupInfo(ConfigurableApplicationContext context) {
        log.info("Active Profiles: {}", String.join(", ", context.getEnvironment().getActiveProfiles()));
        log.info("Workspace Directory: {}", System.getenv("AGENT_WORKSPACE"));
        log.info("Agents Directory: {}", System.getenv("AGENTS_DIR"));
        log.info("Memory Directory: {}", System.getenv("MEMORY_DIR"));
        log.info("Default Model: {}", System.getenv("DEFAULT_MODEL"));
        log.info("A2A Protocol: {}", System.getenv("A2A_ENABLED"));
    }
}
