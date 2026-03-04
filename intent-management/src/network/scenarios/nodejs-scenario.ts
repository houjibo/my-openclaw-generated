import { Intent } from '../../models/intent';
import { IntentRegistry } from '../registry';
import { RelationshipType } from '../types';
import * as fs from 'fs/promises';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export const nodejsIntents: Intent[] = [
  {
    id: 'analyze_package',
    name: '分析 package.json',
    category: 'nodejs',
    confidence: 0,
    description: '分析 package.json 的内容和依赖',
    parameters: [
      {
        name: 'packagePath',
        type: 'path',
        required: true,
        description: 'package.json 文件路径'
      }
    ],
    actions: [
      {
        id: 'analyze',
        name: '分析内容',
        description: '解析 package.json，提取关键信息',
        execute: async (params) => {
          const { packagePath } = params;
          try {
            const content = await fs.readFile(packagePath, 'utf-8');
            const pkg = JSON.parse(content);

            const info = {
              name: pkg.name || 'Unknown',
              version: pkg.version || 'Unknown',
              description: pkg.description || '',
              dependencies: Object.keys(pkg.dependencies || {}).length,
              devDependencies: Object.keys(pkg.devDependencies || {}).length,
              scripts: Object.keys(pkg.scripts || {}),
              path: packagePath
            };

            return {
              success: true,
              message: 'package.json 分析完成',
              data: info
            };
          } catch (error: any) {
            return {
              success: false,
              message: '解析失败: ' + error.message
            };
          }
        }
      }
    ],
    metadata: {
      tags: ['analysis', 'basic'],
      priority: 1,
      cost: 0.1
    }
  },

  {
    id: 'install_dependencies',
    name: '安装依赖',
    category: 'nodejs',
    confidence: 0,
    description: '安装项目的依赖',
    parameters: [
      {
        name: 'packagePath',
        type: 'path',
        required: true,
        description: 'package.json 文件路径'
      },
      {
        name: 'dev',
        type: 'boolean',
        required: false,
        description: '是否安装开发依赖',
        defaultValue: false
      }
    ],
    actions: [
      {
        id: 'install',
        name: '安装依赖',
        description: '运行 npm install',
        execute: async (params) => {
          const { packagePath, dev } = params;
          const projectDir = packagePath.replace('/package.json', '');

          try {
            const cmd = dev ? 'npm install --save-dev' : 'npm install';
            const { stdout } = await execAsync('cd "' + projectDir + '" && ' + cmd, { timeout: 300000 });

            return {
              success: true,
              message: '依赖安装完成',
              data: stdout
            };
          } catch (error: any) {
            return {
              success: false,
              message: '安装失败: ' + error.message
            };
          }
        }
      }
    ],
    metadata: {
      tags: ['build', 'setup'],
      priority: 2,
      cost: 2.0
    }
  },

  {
    id: 'test_nodejs',
    name: '运行测试',
    category: 'nodejs',
    confidence: 0,
    description: '运行项目的测试',
    parameters: [
      {
        name: 'packagePath',
        type: 'path',
        required: true,
        description: 'package.json 文件路径'
      }
    ],
    actions: [
      {
        id: 'test',
        name: '运行测试',
        description: '运行 npm test',
        execute: async (params) => {
          const { packagePath } = params;
          const projectDir = packagePath.replace('/package.json', '');

          try {
            const { stdout } = await execAsync('cd "' + projectDir + '" && npm test', { timeout: 300000 });

            return {
              success: true,
              message: '测试运行完成',
              data: stdout
            };
          } catch (error: any) {
            return {
              success: false,
              message: '测试失败: ' + error.message
            };
          }
        }
      }
    ],
    metadata: {
      tags: ['build', 'verify'],
      priority: 3,
      cost: 1.0
    }
  },

  {
    id: 'build_nodejs',
    name: '构建项目',
    category: 'nodejs',
    confidence: 0,
    description: '构建 Node.js 项目',
    parameters: [
      {
        name: 'packagePath',
        type: 'path',
        required: true,
        description: 'package.json 文件路径'
      }
    ],
    actions: [
      {
        id: 'build',
        name: '构建项目',
        description: '运行 npm run build',
        execute: async (params) => {
          const { packagePath } = params;
          const projectDir = packagePath.replace('/package.json', '');

          try {
            const { stdout } = await execAsync('cd "' + projectDir + '" && npm run build', { timeout: 300000 });

            return {
              success: true,
              message: '项目构建完成',
              data: stdout
            };
          } catch (error: any) {
            return {
              success: false,
              message: '构建失败: ' + error.message
            };
          }
        }
      }
    ],
    metadata: {
      tags: ['build', 'package'],
      priority: 4,
      cost: 2.0
    }
  }
];

export function registerNodeJSScenario(registry: IntentRegistry): void {
  registry.registerScenario('nodejs', nodejsIntents);

  registry.registerRelationships([
    {
      from: 'analyze_package',
      to: 'install_dependencies',
      type: RelationshipType.NEXT_STEP,
      weight: 0.9,
      metadata: { reason: '分析后通常需要安装依赖' }
    },
    {
      from: 'analyze_package',
      to: 'test_nodejs',
      type: RelationshipType.NEXT_STEP,
      weight: 0.7,
      metadata: { reason: '分析后可能需要测试' }
    },
    {
      from: 'install_dependencies',
      to: 'build_nodejs',
      type: RelationshipType.NEXT_STEP,
      weight: 0.9,
      metadata: { reason: '安装依赖后通常要构建' }
    },
    {
      from: 'test_nodejs',
      to: 'build_nodejs',
      type: RelationshipType.PREREQUISITE,
      weight: 1.0,
      metadata: { reason: '测试通过后才能构建' }
    }
  ]);
}
