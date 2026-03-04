/**
 * 文件类型
 */
export declare enum FileType {
    FILE = "file",
    DIRECTORY = "directory",
    NOT_FOUND = "not_found"
}
/**
 * 检测结果
 */
export interface DetectionResult {
    path: string;
    type: FileType;
    name: string;
    extension?: string;
    specialFile?: string;
    scenario: 'folder' | 'maven' | 'nodejs' | 'unknown';
}
/**
 * 文件检测器
 */
export declare class FileDetector {
    /**
     * 检测文件/文件夹类型
     */
    detect(filePath: string): Promise<DetectionResult>;
    /**
     * 检测特殊文件
     */
    private detectSpecialFile;
    /**
     * 检测场景
     */
    private detectScenario;
}
//# sourceMappingURL=file-detector.d.ts.map