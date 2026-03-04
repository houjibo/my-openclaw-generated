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
exports.folderIntents = void 0;
exports.registerFolderScenario = registerFolderScenario;
const types_1 = require("../types");
const fs = __importStar(require("fs/promises"));
const child_process_1 = require("child_process");
const util_1 = require("util");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
/**
 * 文件夹场景意图定义
 */
exports.folderIntents = [
    {
        id: 'open_folder',
        name: '打开文件夹',
        category: 'folder',
        confidence: 0,
        description: '在文件管理器中打开指定文件夹',
        parameters: [
            {
                name: 'path',
                type: 'path',
                required: true,
                description: '文件夹路径'
            }
        ],
        actions: [
            {
                id: 'open',
                name: '打开文件夹',
                description: '使用系统默认方式打开文件夹',
                execute: async (params) => {
                    const { path: folderPath } = params;
                    await execAsync(`open "${folderPath}"`);
                    return { success: true, message: `已打开: ${folderPath}` };
                }
            }
        ],
        metadata: {
            tags: ['view', 'basic'],
            priority: 1,
            cost: 0.1
        }
    },
    {
        id: 'explore_folder',
        name: '探索文件夹',
        category: 'folder',
        confidence: 0,
        description: '查看文件夹内容和结构',
        parameters: [
            {
                name: 'path',
                type: 'path',
                required: true,
                description: '文件夹路径'
            },
            {
                name: 'recursive',
                type: 'boolean',
                required: false,
                description: '是否递归显示子目录',
                defaultValue: false
            }
        ],
        actions: [
            {
                id: 'explore',
                name: '探索文件夹',
                description: '列出文件夹内容',
                execute: async (params) => {
                    const { path: folderPath, recursive } = params;
                    const items = await fs.readdir(folderPath, { withFileTypes: true });
                    const contents = items.map(item => ({
                        name: item.name,
                        isDirectory: item.isDirectory(),
                        isFile: item.isFile()
                    }));
                    return {
                        success: true,
                        message: `文件夹 ${folderPath} 的内容`,
                        data: contents
                    };
                }
            }
        ],
        metadata: {
            tags: ['view', 'analysis'],
            priority: 2,
            cost: 0.2
        }
    },
    {
        id: 'compress_folder',
        name: '压缩文件夹',
        category: 'folder',
        confidence: 0,
        description: '将文件夹压缩为 ZIP 文件',
        parameters: [
            {
                name: 'path',
                type: 'path',
                required: true,
                description: '要压缩的文件夹路径'
            },
            {
                name: 'output',
                type: 'path',
                required: false,
                description: '输出的 ZIP 文件路径',
                defaultValue: ''
            }
        ],
        actions: [
            {
                id: 'compress',
                name: '压缩文件夹',
                description: '使用 zip 命令压缩文件夹',
                execute: async (params) => {
                    const { path: folderPath, output } = params;
                    const outputPath = output || `${folderPath}.zip`;
                    await execAsync(`zip -r "${outputPath}" "${folderPath}"`);
                    return {
                        success: true,
                        message: `已压缩: ${folderPath} -> ${outputPath}`
                    };
                }
            }
        ],
        metadata: {
            tags: ['archive', 'transform'],
            priority: 3,
            cost: 0.5
        }
    },
    {
        id: 'delete_folder',
        name: '删除文件夹',
        category: 'folder',
        confidence: 0,
        description: '删除指定文件夹及其所有内容',
        parameters: [
            {
                name: 'path',
                type: 'path',
                required: true,
                description: '文件夹路径'
            },
            {
                name: 'confirm',
                type: 'boolean',
                required: false,
                description: '确认删除（需要用户确认）',
                defaultValue: false
            }
        ],
        actions: [
            {
                id: 'delete',
                name: '删除文件夹',
                description: '递归删除文件夹',
                execute: async (params) => {
                    const { path: folderPath, confirm } = params;
                    if (!confirm) {
                        return {
                            success: false,
                            message: '删除操作需要确认，请设置 confirm=true'
                        };
                    }
                    await execAsync(`rm -rf "${folderPath}"`);
                    return { success: true, message: `已删除: ${folderPath}` };
                }
            }
        ],
        metadata: {
            tags: ['dangerous', 'destructive'],
            priority: 10,
            cost: 0.1,
            risk: 0.9
        }
    }
];
/**
 * 注册文件夹场景到意图网络
 */
function registerFolderScenario(registry) {
    // 注册意图
    registry.registerScenario('folder', exports.folderIntents);
    // 注册关系
    registry.registerRelationships([
        // explore → open (下一步）
        {
            from: 'explore_folder',
            to: 'open_folder',
            type: types_1.RelationshipType.NEXT_STEP,
            weight: 0.8,
            metadata: { reason: '探索后可能想打开' }
        },
        // explore → compress (下一步）
        {
            from: 'explore_folder',
            to: 'compress_folder',
            type: types_1.RelationshipType.NEXT_STEP,
            weight: 0.6,
            metadata: { reason: '探索后可能想压缩' }
        },
        // open → explore (相关）
        {
            from: 'open_folder',
            to: 'explore_folder',
            type: types_1.RelationshipType.RELATED,
            weight: 0.7,
            metadata: { reason: '打开后可能想探索' }
        },
        // delete 与 compress 冲突
        {
            from: 'delete_folder',
            to: 'compress_folder',
            type: types_1.RelationshipType.CONFLICT,
            weight: 1.0,
            metadata: { reason: '删除和压缩不能同时执行' }
        }
    ]);
}
//# sourceMappingURL=folder-scenario.js.map