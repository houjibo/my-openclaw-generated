package com.cola.filemanager;

import com.cola.filemanager.agent.FileManagerAgent;
import com.cola.filemanager.service.FileService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
public class FileManagerAgentTest {

    @Autowired
    private FileManagerAgent agent;

    @Autowired
    private FileService fileService;

    @Test
    void testListFiles() {
        String response = agent.processRequest("List files in current directory", 
                System.getProperty("user.home"));
        
        assertNotNull(response);
        assertFalse(response.isEmpty());
        System.out.println("List files response: " + response);
    }

    @Test
    void testCreateAndDeleteFile() throws IOException {
        String testDir = System.getProperty("java.io.tmpdir") + "/test-agent";
        fileService.createDirectory(testDir);

        // Test create file
        String createResponse = agent.processRequest(
                "Create a file named test.txt", testDir);
        assertNotNull(createResponse);
        assertTrue(Files.exists(Path.of(testDir + "/test.txt")));

        // Test delete file
        String deleteResponse = agent.processRequest(
                "Delete file test.txt", testDir);
        assertNotNull(deleteResponse);
        assertFalse(Files.exists(Path.of(testDir + "/test.txt")));

        // Cleanup
        Files.deleteIfExists(Path.of(testDir));
    }

    @Test
    void testSearchFiles() throws IOException {
        String testDir = System.getProperty("java.io.tmpdir") + "/search-test";
        fileService.createDirectory(testDir);
        fileService.createFile(testDir + "/test-file.txt");

        String response = agent.processRequest(
                "Search for files containing 'test'", testDir);
        
        assertNotNull(response);
        assertTrue(response.contains("test-file.txt") || response.contains("No files"));

        // Cleanup
        fileService.delete(testDir);
    }

    @Test
    void testQueryDirectoryInfo() {
        String response = agent.processRequest(
                "Show me directory information", 
                System.getProperty("user.home"));
        
        assertNotNull(response);
        assertTrue(response.contains("Directory:") || response.contains("Total"));
    }
}
