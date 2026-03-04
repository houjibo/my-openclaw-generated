package com.cola.filemanager;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication(scanBasePackages = {"com.cola.filemanager", "com.cola.agent"})
public class FileManagerApplication {
    public static void main(String[] args) {
        SpringApplication.run(FileManagerApplication.class, args);
        System.out.println("========================================");
        System.out.println("File Manager Agent Started!");
        System.out.println("========================================");
        System.out.println("API Endpoints:");
        System.out.println("  POST /api/files/chat       - Chat with agent");
        System.out.println("  GET  /api/files/list       - List files");
        System.out.println("  GET  /api/files/search     - Search files");
        System.out.println("  POST /api/files/directory  - Create directory");
        System.out.println("  DELETE /api/files/delete   - Delete file/directory");
        System.out.println("========================================");
    }
}
