package com.cola.agents.demo.controller;

import com.cola.agent.core.AgentLoader;
import com.cola.agent.intent.Intent;
import com.cola.agent.intent.IntentService;
import com.cola.agents.demo.MultiAgentDemo;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/demo")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class DemoController {

    private final MultiAgentDemo demo;
    private final IntentService intentService;
    private final AgentLoader agentLoader;

    @GetMapping("/agents")
    public ResponseEntity<List<String>> listAgents() {
        return ResponseEntity.ok(agentLoader.listAvailableAgents());
    }

    @PostMapping("/intent")
    public ResponseEntity<Map<String, Object>> testIntent(@RequestBody Map<String, String> request) {
        String input = request.getOrDefault("input", "");
        Intent intent = intentService.analyze(input);
        
        Map<String, Object> result = new HashMap<>();
        result.put("input", input);
        result.put("intent", intent.getType().toString());
        result.put("confidence", intent.getConfidence());
        result.put("parameters", intent.getParameters());
        
        return ResponseEntity.ok(result);
    }

    @PostMapping("/chat")
    public ResponseEntity<Map<String, String>> chat(@RequestBody Map<String, String> request) {
        String input = request.getOrDefault("message", "");
        String response = demo.demoConversation(input);
        
        Map<String, String> result = new HashMap<>();
        result.put("input", input);
        result.put("response", response);
        
        return ResponseEntity.ok(result);
    }

    @PostMapping("/batch")
    public ResponseEntity<String> runBatchTest() {
        demo.demoIntentAnalysis();
        return ResponseEntity.ok("Batch test completed. Check logs.");
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> health() {
        Map<String, Object> health = new HashMap<>();
        health.put("status", "UP");
        health.put("agents", agentLoader.listAvailableAgents().size());
        return ResponseEntity.ok(health);
    }
}
