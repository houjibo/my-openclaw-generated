import { Intent } from '../models/intent';
import * as fs from 'fs/promises';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Maven POM 文件场景的意图定义
 */
export const pomIntents: Intent[] = [
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
    ]
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
    ]
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
    ]
  },

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

            // 简单的 XML 解析（实际应该使用专门的 XML 解析器）
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
    ]
  }
];
