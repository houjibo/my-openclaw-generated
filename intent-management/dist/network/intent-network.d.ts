import { Intent } from '../models/intent';
import { IntentEdge, IntentPath, RelationshipType } from './types';
/**
 * 意图网络类
 * 管理意图节点和意图之间的关系
 */
export declare class IntentNetwork {
    private nodes;
    private edges;
    /**
     * 添加意图节点
     */
    addIntent(intent: Intent): void;
    /**
     * 批量添加意图
     */
    addIntents(intents: Intent[]): void;
    /**
     * 添加关系（边）
     */
    addRelationship(fromId: string, toId: string, type: RelationshipType, weight?: number, metadata?: any): void;
    /**
     * 获取意图节点
     */
    getIntent(id: string): Intent | undefined;
    /**
     * 获取所有意图
     */
    getAllIntents(): Intent[];
    /**
     * 按分类获取意图
     */
    getIntentsByCategory(category: string): Intent[];
    /**
     * 查找关系
     */
    findRelationships(intentId: string, type?: RelationshipType, direction?: 'outgoing' | 'incoming' | 'both'): IntentEdge[];
    /**
     * 查找前置意图
     */
    findPrerequisites(intentId: string): Intent[];
    /**
     * 查找下一步意图
     */
    findNextSteps(intentId: string): Array<{
        intent: Intent;
        weight: number;
    }>;
    /**
     * 查找替代方案
     */
    findAlternatives(intentId: string): Array<{
        intent: Intent;
        weight: number;
    }>;
    /**
     * 查找相关意图
     */
    findRelatedIntents(intentId: string, maxResults?: number): Array<{
        intent: Intent;
        weight: number;
    }>;
    /**
     * 查找最短路径（BFS）
     */
    findShortestPath(fromId: string, toId: string): IntentPath | null;
    /**
     * 查找所有路径（DFS）
     */
    findAllPaths(fromId: string, toId: string, maxDepth?: number): IntentPath[];
    /**
     * 推荐意图（基于上下文）
     */
    recommendIntents(currentIntentId?: string, context?: {
        category?: string;
        tags?: string[];
    }, limit?: number): Array<{
        intent: Intent;
        score: number;
        reason: string;
    }>;
    /**
     * 检测冲突
     */
    detectConflicts(intentId: string): Array<{
        intent: Intent;
        reason: string;
    }>;
    /**
     * 验证网络完整性
     */
    validate(): {
        valid: boolean;
        errors: string[];
    };
    /**
     * 导出网络为 JSON
     */
    toJSON(): {
        intents: Intent[];
        edges: IntentEdge[];
    };
    /**
     * 导入网络从 JSON
     */
    static fromJSON(data: {
        intents: Intent[];
        edges: IntentEdge[];
    }): IntentNetwork;
    /**
     * 生成 Graphviz DOT 格式
     */
    toGraphviz(): string;
    /**
     * 构建路径对象
     */
    private buildPath;
}
//# sourceMappingURL=intent-network.d.ts.map