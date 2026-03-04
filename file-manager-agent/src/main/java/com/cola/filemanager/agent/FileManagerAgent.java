package com.cola.filemanager.agent;

import com.cola.agent.intent.*;
import com.cola.agent.llm.*;
import com.cola.filemanager.service.FileInfo;
import com.cola.filemanager.service.FileService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class FileManagerAgent {

    private final FileService fileService;
    private final IntentService intentService;
    private final LLMService llmService;

    private static final String SYSTEM_PROMPT = """
        You are a File Manager AI Agent. Your job is to help users manage files and directories.
        
        Available operations:
        - LIST: List files in a directory
        - SEARCH: Search for files by name
        - CREATE: Create new files or directories
        - DELETE: Delete files or directories
        - READ: Read file content
        - WRITE: Write content to files
        - INFO: Get file information
        
        When responding:
        1. Confirm the operation you understood
        2. Show the result in a clear format
        3. Suggest next possible actions
        """;

    /**
     * Process user request
     */
    public String processRequest(String userInput, String currentPath) {
        try {
            // 1. Analyze intent
            Intent intent = intentService.analyze(userInput);
            log.info("Intent: {} (confidence: {})", intent.getType(), intent.getConfidence());

            // 2. Execute based on intent
            String result = executeIntent(intent, currentPath);

            // 3. Generate natural language response using LLM
            return generateResponse(userInput, intent, result);

        } catch (Exception e) {
            log.error("Error processing request", e);
            return "Error: " + e.getMessage();
        }
    }

    private String executeIntent(Intent intent, String currentPath) throws IOException {
        return switch (intent.getType()) {
            case QUERY -> handleQuery(intent, currentPath);
            case EXECUTE -> handleExecute(intent, currentPath);
            case EXPLORE -> handleExplore(intent, currentPath);
            default -> "I'm not sure how to handle that request. Could you be more specific?";
        };
    }

    private String handleQuery(Intent intent, String currentPath) throws IOException {
        String input = intent.getOriginalInput().toLowerCase();

        if (input.contains("list") || input.contains("show") || input.contains("what")) {
            // List files
            List<FileInfo> files = fileService.listFiles(currentPath);
            return formatFileList(files);
        }

        if (input.contains("search") || input.contains("find")) {
            // Search files
            String pattern = extractPattern(intent.getOriginalInput());
            List<FileInfo> files = fileService.searchFiles(currentPath, pattern);
            return formatFileList(files);
        }

        if (input.contains("size") || input.contains("how big")) {
            // Get directory size
            long size = fileService.getDirectorySize(currentPath);
            return String.format("Directory size: %.2f MB", size / (1024.0 * 1024));
        }

        return "I can list files, search for files, or show directory size. What would you like?";
    }

    private String handleExecute(Intent intent, String currentPath) throws IOException {
        String input = intent.getOriginalInput().toLowerCase();
        String target = intent.getParameter("target");

        if (input.contains("create") || input.contains("make") || input.contains("new")) {
            if (input.contains("directory") || input.contains("folder")) {
                String dirName = extractName(input);
                String newPath = currentPath + "/" + dirName;
                fileService.createDirectory(newPath);
                return "Created directory: " + newPath;
            } else {
                String fileName = extractName(input);
                String newPath = currentPath + "/" + fileName;
                fileService.createFile(newPath);
                return "Created file: " + newPath;
            }
        }

        if (input.contains("delete") || input.contains("remove")) {
            String name = extractName(input);
            String targetPath = currentPath + "/" + name;
            fileService.delete(targetPath);
            return "Deleted: " + targetPath;
        }

        return "I can create or delete files and directories. What would you like to do?";
    }

    private String handleExplore(Intent intent, String currentPath) throws IOException {
        // For exploration, provide a summary of the directory
        List<FileInfo> files = fileService.listFiles(currentPath);
        long totalSize = fileService.getDirectorySize(currentPath);
        int fileCount = (int) files.stream().filter(f -> !f.isDirectory()).count();
        int dirCount = (int) files.stream().filter(FileInfo::isDirectory).count();

        return String.format(
            "Directory: %s\nTotal items: %d\nFiles: %d\nDirectories: %d\nTotal size: %.2f MB",
            currentPath,
            files.size(),
            fileCount,
            dirCount,
            totalSize / (1024.0 * 1024)
        );
    }

    private String generateResponse(String userInput, Intent intent, String result) {
        // Use LLM to generate natural language response
        List<LLMMessage> messages = List.of(
            LLMMessage.system(SYSTEM_PROMPT),
            LLMMessage.user("User request: " + userInput),
            LLMMessage.user("Intent: " + intent.getType()),
            LLMMessage.user("Result: " + result),
            LLMMessage.user("Please provide a helpful response summarizing the result.")
        );

        try {
            LLMResponse response = llmService.chat(messages, "moonshot", "kimi-k2.5");
            return response.getContent();
        } catch (Exception e) {
            // Fallback to raw result if LLM fails
            return result;
        }
    }

    private String formatFileList(List<FileInfo> files) {
        if (files.isEmpty()) {
            return "No files found.";
        }

        StringBuilder sb = new StringBuilder();
        sb.append("Found ").append(files.size()).append(" items:\n\n");

        for (FileInfo file : files) {
            sb.append(file.toMarkdown()).append("\n");
        }

        return sb.toString();
    }

    private String extractPattern(String input) {
        // Simple pattern extraction - look for quoted text or last word
        if (input.contains("\"")) {
            int start = input.indexOf('"') + 1;
            int end = input.indexOf('"', start);
            if (end > start) {
                return input.substring(start, end);
            }
        }
        // Return last word as fallback
        String[] words = input.split(" ");
        return words[words.length - 1];
    }

    private String extractName(String input) {
        // Extract file/directory name from input
        if (input.contains("\"")) {
            int start = input.indexOf('"') + 1;
            int end = input.indexOf('"', start);
            if (end > start) {
                return input.substring(start, end);
            }
        }
        if (input.contains("named")) {
            int idx = input.indexOf("named") + 6;
            return input.substring(idx).trim().split(" ")[0];
        }
        // Return last word
        String[] words = input.split(" ");
        return words[words.length - 1].replaceAll("[^a-zA-Z0-9.-]", "");
    }
}
