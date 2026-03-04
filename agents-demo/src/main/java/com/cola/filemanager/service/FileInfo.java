package com.cola.filemanager.service;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class FileInfo {
    private String name;
    private String path;
    private long size;
    private boolean isDirectory;
    private long creationTime;
    private long lastModifiedTime;

    public String getFormattedSize() {
        if (size < 1024) return size + " B";
        if (size < 1024 * 1024) return String.format("%.2f KB", size / 1024.0);
        if (size < 1024 * 1024 * 1024) return String.format("%.2f MB", size / (1024.0 * 1024));
        return String.format("%.2f GB", size / (1024.0 * 1024 * 1024));
    }

    public String toMarkdown() {
        String type = isDirectory ? "📁" : "📄";
        return String.format("%s **%s** (%s) - %s",
                type, name, getFormattedSize(), path);
    }
}
