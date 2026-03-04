import { Intent } from '../models/intent';
import { IntentNetwork } from './intent-network';
import { RelationshipType } from './types';
/**
 * 意图注册表
 * 统一管理所有意图场景
 */
export declare class IntentRegistry {
    private network;
    private scenarios;
    constructor(network?: IntentNetwork);
    /**
     * 获取网络
     */
    getNetwork(): IntentNetwork;
    /**
     * 注册场景
     */
    registerScenario(name: string, intents: Intent[]): void;
    /**
     * 注册关系
     */
    registerRelationship(fromId: string, toId: string, type: RelationshipType, weight?: number, metadata?: any): void;
    /**
     * 批量注册关系
     */
    registerRelationships(relationships: Array<{
        from: string;
        to: string;
        type: RelationshipType;
        weight?: number;
        metadata?: any;
    }>): void;
    /**
     * 获取场景中的意图
     */
    getScenarioIntents(scenarioName: string): Intent[];
    /**
     * 获取所有场景
     */
    getScenarios(): string[];
    /**
     * 保存到文件
     */
    saveToFile(filePath: string): Promise<void>;
    /**
     * 从文件加载
     */
    static loadFromFile(filePath: string): Promise<IntentRegistry>;
    /**
     * 导出为 Graphviz
     */
    toGraphviz(): string;
    /**
     * 验证
     */
    validate(): {
        valid: boolean;
        errors: string[];
    };
}
//# sourceMappingURL=registry.d.ts.map