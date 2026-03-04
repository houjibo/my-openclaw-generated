import { Intent } from '../../models/intent';
import { IntentRegistry } from '../registry';
import { RelationshipType } from '../types';
import * as fs from 'fs/promises';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Maven 项目场景意图定义
 */
export const mavenIntents: Intent[] = [
  {
    id: 'analyze_content',
    name: '分析项目内容',
    category: 'maven',
    confidence: 0,
    description: '分析 POM 文件的内容，提取项目信息',
    parameters: [
      {
        name: 'pomPath',
        type: 'path',
        required: true,
        description: 'POM 文件路径'
      }
    ],
    actions: [
      {
        id: 'analyze',
        name: '分析内容',
        description: '解析 POM 文件，提取关键信息',
        execute: async (params) => {
          const { pomPath } = params;

          try {
            const content = await fs.readFile(pomPath, 'utf-8');

            const groupIdMatch = content.match(/<groupId>(.*?)<\/groupId>/);
            const artifactIdMatch = content.match(/<artifactId>(.*?)<\/artifactId>/);
            const versionMatch = content.match(/<version>(.*?)<\/version>/);

            const projectInfo = {
              groupId: groupIdMatch?.[1] || 'Unknown',
              artifactId: artifactIdMatch?.[1] || 'Unknown',
              version: versionMatch?.[1] || 'Unknown',
              path: pomPath
            };

            return {
              success: true,
              message: '项目信息提取完成',
              data: projectInfo
            };
          } catch (error: any) {
            return {
              success: false,
              message: `解析失败: ${error.message}`
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
    id: 'analyze_dependencies',
    name: '分析依赖',
    category: 'maven',
    confidence: 0,
    description: '分析 Maven 项目的依赖关系',
    parameters: [
      {
        name: 'pomPath',
        type: 'path',
        required: true,
        description: 'POM 文件路径'
      },
      {
        name: 'format',
        type: 'string',
        required: false,
        description: '输出格式（tree/json）',
        defaultValue: 'json'
      }
    ],
    actions: [
      {
        id: 'analyze',
        name: '分析依赖',
        description: '使用 mvn dependency:tree 分析依赖',
        execute: async (params) => {
          const { pomPath, format } = params;
          const projectDir = pomPath.replace('/pom.xml', '');

          try {
            const { stdout } = await execAsync(
              `cd "${projectDir}" && mvn dependency:tree -DoutputFile=/dev/stdout`,
              { timeout: 30000 }
            );

            return {
              success: true,
              message: '依赖分析完成',
              data: stdout
            };
          } catch (error: any) {
            return {
              success: false,
              message: `依赖分析失败: ${error.message}`
            };
          }
        }
      }
    ],
    metadata: {
      tags: ['analysis', 'build'],
      priority: 2,
      cost: 0.5
    }
  },

  {
    id: 'test_project',
    name: '运行测试',
    category: 'maven',
    confidence: 0,
    description: '运行 Maven 项目的测试',
    parameters: [
      {
        name: 'pomPath',
        type: 'path',
        required: true,
        description: 'POM 文件路径'
      }
    ],
    actions: [
      {
        id: 'test',
        name: '运行测试',
        description: '执行 mvn test',
        execute: async (params) => {
          const { pomPath } = params;
          const projectDir = pomPath.replace('/pom.xml', '');

          try {
            const { stdout } = await execAsync(
              `cd "${projectDir}" && mvn test`,
              { timeout: 300000 }
            );

            return {
              success: true,
              message: '测试运行完成',
              data: stdout
            };
          } catch (error: any) {
            return {
              success: false,
              message: `测试失败: ${error.message}`
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
    id: 'build_project',
    name: '构建项目',
    category: 'maven',
    confidence: 0,
    description: '使用 Maven 构建项目',
    parameters: [
      {
        name: 'pomPath',
        type: 'path',
        required: true,
        description: 'POM 文件路径'
      },
      {
        name: 'skipTests',
        type: 'boolean',
        required: false,
        description: '是否跳过测试',
        defaultValue: false
      }
    ],
    actions: [
      {
        id: 'build',
        name: '构建项目',
        description: '执行 mvn compile 或 mvn package',
        execute: async (params) => {
          const { pomPath, skipTests } = params;
          const projectDir = pomPath.replace('/pom.xml', '');

          const skipFlag = skipTests ? '-DskipTests' : '';

          try {
            const { stdout } = await execAsync(
              `cd "${projectDir}" && mvn package ${skipFlag}`,
              { timeout: 300000 }
            );

            return {
              success: true,
              message: '项目构建完成',
              data: stdout
            };
          } catch (error: any) {
            return {
              success: false,
              message: `构建失败: ${error.message}`
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

/**
 * 注册 Maven 场景到意图网络
 */
export function registerMavenScenario(registry: IntentRegistry): void {
  // 注册意图
  registry.registerScenario('maven', mavenIntents);

  // 注册关系
  registry.registerRelationships([
    // analyze_content → analyze_dependencies (下一步）
    {
      from: 'analyze_content',
      to: 'analyze_dependencies',
      type: RelationshipType.NEXT_STEP,
      weight: 0.9,
      metadata: { reason: '分析内容后通常需要分析依赖' }
    },

    // analyze_content → build_project (下一步）
    {
      from: 'analyze_content',
      to: 'build_project',
      type: RelationshipType.NEXT_STEP,
      weight: 0.8,
      metadata: { reason: '分析内容后可能要构建' }
    },

    // analyze_dependencies → build_project (下一步）
    {
      from: 'analyze_dependencies',
      to: 'build_project',
      type: RelationshipType.NEXT_STEP,
      weight: 0.9,
      metadata: { reason: '分析依赖后通常要构建' }
    },

    // test_project 是 build_project 的前置条件
    {
      from: 'test_project',
      to: 'build_project',
      type: RelationshipType.PREREQUISITE,
      weight: 1.0,
      metadata: { reason: '测试通过后才能构建' }
    },

    // analyze_content → test_project (下一步）
    {
      from: 'analyze_content',
      to: 'test_project',
      type: RelationshipType.NEXT_STEP,
      weight: 0.7,
      metadata: { reason: '分析内容后可能要测试' }
    }
  ]);
}
