package com.cola.agents.demo;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication(scanBasePackages = {"com.cola.agents.demo", "com.cola.agent"})
public class AgentsDemoApplication {
    public static void main(String[] args) {
        SpringApplication.run(AgentsDemoApplication.class, args);
        System.out.println("========================================");
        System.out.println("Agents Demo Application Started!");
        System.out.println("========================================");
        System.out.println("API Endpoints:");
        System.out.println("  GET  /api/demo/agents      - List available agents");
        System.out.println("  POST /api/demo/intent      - Test intent analysis");
        System.out.println("  POST /api/demo/chat        - Test agent conversation");
        System.out.println("  POST /api/demo/batch       - Run batch tests");
        System.out.println("  GET  /api/demo/health      - Health check");
        System.out.println("========================================");
        System.out.println("Test commands:");
        System.out.println("  curl http://localhost:8080/api/demo/agents");
        System.out.println("  curl -X POST http://localhost:8080/api/demo/intent \\");
        System.out.println("    -d '{\"input\":\"List files\"}'");
        System.out.println("========================================");
    }
}
