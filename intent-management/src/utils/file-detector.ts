import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * 文件类型
 */
export enum FileType {
  FILE = 'file',
  DIRECTORY = 'directory',
  NOT_FOUND = 'not_found'
}

/**
 * 检测结果
 */
export interface DetectionResult {
  path: string;
  type: FileType;
  name: string;
  extension?: string;
  specialFile?: string; // pom.xml, package.json 等
  scenario: 'folder' | 'maven' | 'nodejs' | 'unknown';
}

/**
 * 文件检测器
 */
export class FileDetector {
  /**
   * 检测文件/文件夹类型
   */
  async detect(filePath: string): Promise<DetectionResult> {
    try {
      const stats = await fs.stat(filePath);

      const name = path.basename(filePath);

      if (stats.isDirectory()) {
        return {
          path: filePath,
          type: FileType.DIRECTORY,
          name,
          scenario: 'folder'
        };
      }

      // 是文件
      const ext = path.extname(filePath).toLowerCase();
      const specialFile = this.detectSpecialFile(name);

      const scenario = this.detectScenario(name, ext);

      return {
        path: filePath,
        type: FileType.FILE,
        name,
        extension: ext || undefined,
        specialFile,
        scenario
      };
    } catch (error) {
      return {
        path: filePath,
        type: FileType.NOT_FOUND,
        name: path.basename(filePath),
        scenario: 'unknown'
      };
    }
  }

  /**
   * 检测特殊文件
   */
  private detectSpecialFile(name: string): string | undefined {
    const specialFiles = ['pom.xml', 'package.json', 'build.gradle', 'requirements.txt'];

    if (specialFiles.includes(name)) {
      return name;
    }

    return undefined;
  }

  /**
   * 检测场景
   */
  private detectScenario(name: string, ext: string): 'folder' | 'maven' | 'nodejs' | 'unknown' {
    if (name === 'pom.xml' || name === 'build.gradle') {
      return 'maven';
    }

    if (name === 'package.json') {
      return 'nodejs';
    }

    if (ext === '.xml' || ext === '.json') {
      return 'folder'; // 默认作为文件夹处理
    }

    return 'unknown';
  }
}
