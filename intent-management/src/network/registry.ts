import { Intent } from '../models/intent';
import { IntentNetwork } from './intent-network';
import { RelationshipType } from './types';
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * 意图注册表
 * 统一管理所有意图场景
 */
export class IntentRegistry {
  private network: IntentNetwork;
  private scenarios: Map<string, string[]> = new Map();

  constructor(network?: IntentNetwork) {
    this.network = network || new IntentNetwork();
  }

  /**
   * 获取网络
   */
  getNetwork(): IntentNetwork {
    return this.network;
  }

  /**
   * 注册场景
   */
  registerScenario(name: string, intents: Intent[]): void {
    this.network.addIntents(intents);
    this.scenarios.set(
      name,
      intents.map(intent => intent.id)
    );
  }

  /**
   * 注册关系
   */
  registerRelationship(
    fromId: string,
    toId: string,
    type: RelationshipType,
    weight: number = 1.0,
    metadata?: any
  ): void {
    this.network.addRelationship(fromId, toId, type, weight, metadata);
  }

  /**
   * 批量注册关系
   */
  registerRelationships(relationships: Array<{
    from: string;
    to: string;
    type: RelationshipType;
    weight?: number;
    metadata?: any;
  }>): void {
    relationships.forEach(rel => {
      this.registerRelationship(
        rel.from,
        rel.to,
        rel.type,
        rel.weight,
        rel.metadata
      );
    });
  }

  /**
   * 获取场景中的意图
   */
  getScenarioIntents(scenarioName: string): Intent[] {
    const intentIds = this.scenarios.get(scenarioName);

    if (!intentIds) {
      return [];
    }

    return intentIds
      .map(id => this.network.getIntent(id))
      .filter((intent): intent is Intent => intent !== undefined);
  }

  /**
   * 获取所有场景
   */
  getScenarios(): string[] {
    return Array.from(this.scenarios.keys());
  }

  /**
   * 保存到文件
   */
  async saveToFile(filePath: string): Promise<void> {
    const data = this.network.toJSON();

    await fs.mkdir(path.dirname(filePath), { recursive: true });

    await fs.writeFile(
      filePath,
      JSON.stringify(data, null, 2),
      'utf-8'
    );
  }

  /**
   * 从文件加载
   */
  static async loadFromFile(filePath: string): Promise<IntentRegistry> {
    const content = await fs.readFile(filePath, 'utf-8');
    const data = JSON.parse(content);

    const network = IntentNetwork.fromJSON(data);
    return new IntentRegistry(network);
  }

  /**
   * 导出为 Graphviz
   */
  toGraphviz(): string {
    return this.network.toGraphviz();
  }

  /**
   * 验证
   */
  validate(): { valid: boolean; errors: string[] } {
    return this.network.validate();
  }
}
