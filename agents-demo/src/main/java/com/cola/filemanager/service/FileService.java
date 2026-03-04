package com.cola.filemanager.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.*;
import java.nio.file.attribute.BasicFileAttributes;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
public class FileService {

    /**
     * List files in directory
     */
    public List<FileInfo> listFiles(String path) throws IOException {
        Path dir = Paths.get(path);
        List<FileInfo> files = new ArrayList<>();
        
        try (DirectoryStream<Path> stream = Files.newDirectoryStream(dir)) {
            for (Path file : stream) {
                files.add(createFileInfo(file));
            }
        }
        
        return files;
    }

    /**
     * Search files by name pattern
     */
    public List<FileInfo> searchFiles(String startPath, String pattern) throws IOException {
        List<FileInfo> results = new ArrayList<>();
        Path start = Paths.get(startPath);
        
        Files.walkFileTree(start, new SimpleFileVisitor<Path>() {
            @Override
            public FileVisitResult visitFile(Path file, BasicFileAttributes attrs) {
                if (file.getFileName().toString().contains(pattern)) {
                    try {
                        results.add(createFileInfo(file));
                    } catch (IOException e) {
                        log.error("Error reading file: {}", file, e);
                    }
                }
                return FileVisitResult.CONTINUE;
            }
        });
        
        return results;
    }

    /**
     * Create directory
     */
    public boolean createDirectory(String path) throws IOException {
        Path dir = Paths.get(path);
        Files.createDirectories(dir);
        log.info("Created directory: {}", path);
        return true;
    }

    /**
     * Create empty file
     */
    public boolean createFile(String path) throws IOException {
        Path file = Paths.get(path);
        Files.createFile(file);
        log.info("Created file: {}", path);
        return true;
    }

    /**
     * Delete file or directory
     */
    public boolean delete(String path) throws IOException {
        Path target = Paths.get(path);
        if (Files.isDirectory(target)) {
            deleteDirectory(target);
        } else {
            Files.delete(target);
        }
        log.info("Deleted: {}", path);
        return true;
    }

    /**
     * Read file content
     */
    public String readFile(String path) throws IOException {
        Path file = Paths.get(path);
        return Files.readString(file);
    }

    /**
     * Write file content
     */
    public boolean writeFile(String path, String content) throws IOException {
        Path file = Paths.get(path);
        Files.writeString(file, content);
        log.info("Wrote to file: {}", path);
        return true;
    }

    /**
     * Get file info
     */
    public FileInfo getFileInfo(String path) throws IOException {
        return createFileInfo(Paths.get(path));
    }

    /**
     * Get directory size
     */
    public long getDirectorySize(String path) throws IOException {
        Path dir = Paths.get(path);
        final long[] size = {0};
        
        Files.walkFileTree(dir, new SimpleFileVisitor<Path>() {
            @Override
            public FileVisitResult visitFile(Path file, BasicFileAttributes attrs) {
                size[0] += attrs.size();
                return FileVisitResult.CONTINUE;
            }
        });
        
        return size[0];
    }

    private FileInfo createFileInfo(Path path) throws IOException {
        BasicFileAttributes attrs = Files.readAttributes(path, BasicFileAttributes.class);
        
        return FileInfo.builder()
                .name(path.getFileName().toString())
                .path(path.toAbsolutePath().toString())
                .size(attrs.size())
                .isDirectory(attrs.isDirectory())
                .creationTime(attrs.creationTime().toMillis())
                .lastModifiedTime(attrs.lastModifiedTime().toMillis())
                .build();
    }

    private void deleteDirectory(Path dir) throws IOException {
        Files.walkFileTree(dir, new SimpleFileVisitor<Path>() {
            @Override
            public FileVisitResult visitFile(Path file, BasicFileAttributes attrs) throws IOException {
                Files.delete(file);
                return FileVisitResult.CONTINUE;
            }

            @Override
            public FileVisitResult postVisitDirectory(Path dir, IOException exc) throws IOException {
                Files.delete(dir);
                return FileVisitResult.CONTINUE;
            }
        });
    }
}
