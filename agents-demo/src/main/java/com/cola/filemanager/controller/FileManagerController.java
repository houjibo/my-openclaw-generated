package com.cola.filemanager.controller;

import com.cola.filemanager.agent.FileManagerAgent;
import com.cola.filemanager.service.FileInfo;
import com.cola.filemanager.service.FileService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/files")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class FileManagerController {

    private final FileService fileService;
    private final FileManagerAgent agent;

    private String currentPath = System.getProperty("user.home");

    @PostMapping("/chat")
    public ResponseEntity<Map<String, String>> chat(@RequestBody Map<String, String> request) {
        String userInput = request.getOrDefault("message", "");
        
        String response = agent.processRequest(userInput, currentPath);
        
        Map<String, String> result = new HashMap<>();
        result.put("response", response);
        result.put("currentPath", currentPath);
        
        return ResponseEntity.ok(result);
    }

    @GetMapping("/list")
    public ResponseEntity<List<FileInfo>> listFiles(
            @RequestParam(defaultValue = ".") String path) {
        try {
            List<FileInfo> files = fileService.listFiles(path);
            return ResponseEntity.ok(files);
        } catch (IOException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/search")
    public ResponseEntity<List<FileInfo>> searchFiles(
            @RequestParam String pattern,
            @RequestParam(defaultValue = ".") String path) {
        try {
            List<FileInfo> files = fileService.searchFiles(path, pattern);
            return ResponseEntity.ok(files);
        } catch (IOException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/directory")
    public ResponseEntity<String> createDirectory(@RequestParam String path) {
        try {
            fileService.createDirectory(path);
            return ResponseEntity.ok("Directory created: " + path);
        } catch (IOException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/delete")
    public ResponseEntity<String> delete(@RequestParam String path) {
        try {
            fileService.delete(path);
            return ResponseEntity.ok("Deleted: " + path);
        } catch (IOException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/info")
    public ResponseEntity<FileInfo> getFileInfo(@RequestParam String path) {
        try {
            FileInfo info = fileService.getFileInfo(path);
            return ResponseEntity.ok(info);
        } catch (IOException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/current-path")
    public ResponseEntity<Map<String, String>> getCurrentPath() {
        Map<String, String> result = new HashMap<>();
        result.put("path", currentPath);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/change-path")
    public ResponseEntity<Map<String, String>> changePath(@RequestBody Map<String, String> request) {
        String newPath = request.get("path");
        if (newPath != null && !newPath.isEmpty()) {
            currentPath = newPath;
        }
        
        Map<String, String> result = new HashMap<>();
        result.put("path", currentPath);
        return ResponseEntity.ok(result);
    }
}
