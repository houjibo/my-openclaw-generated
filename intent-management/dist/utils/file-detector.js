"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileDetector = exports.FileType = void 0;
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
/**
 * 文件类型
 */
var FileType;
(function (FileType) {
    FileType["FILE"] = "file";
    FileType["DIRECTORY"] = "directory";
    FileType["NOT_FOUND"] = "not_found";
})(FileType || (exports.FileType = FileType = {}));
/**
 * 文件检测器
 */
class FileDetector {
    /**
     * 检测文件/文件夹类型
     */
    async detect(filePath) {
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
        }
        catch (error) {
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
    detectSpecialFile(name) {
        const specialFiles = ['pom.xml', 'package.json', 'build.gradle', 'requirements.txt'];
        if (specialFiles.includes(name)) {
            return name;
        }
        return undefined;
    }
    /**
     * 检测场景
     */
    detectScenario(name, ext) {
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
exports.FileDetector = FileDetector;
//# sourceMappingURL=file-detector.js.map