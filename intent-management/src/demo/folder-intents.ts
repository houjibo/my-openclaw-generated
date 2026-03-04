import { Intent } from '../models/intent';
import * as fs from 'fs/promises';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * 文件夹场景的意图定义
 */
export const folderIntents: Intent[] = [
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
    ]
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
      tags: ['dangerous', 'needs_confirmation'],
      priority: 1
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
    ]
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
    ]
  }
];
