import { Intent } from '../models/intent';
/**
 * 意图关系类型
 */
export declare enum RelationshipType {
    PREREQUISITE = "prerequisite",// 前置条件
    NEXT_STEP = "next_step",// 下一步
    ALTERNATIVE = "alternative",// 替代方案
    RELATED = "related",// 相关
    CONFLICT = "conflict",// 冲突
    REQUIRES = "requires"
}
/**
 * 意图边（关系）
 */
export interface IntentEdge {
    from: string;
    to: string;
    type: RelationshipType;
    weight: number;
    condition?: string;
    metadata?: {
        reason?: string;
        cost?: number;
        risk?: number;
    };
}
/**
 * 意图节点
 */
export interface IntentNode {
    intent: Intent;
    outgoingEdges: IntentEdge[];
    incomingEdges: IntentEdge[];
}
/**
 * 意图路径
 */
export interface IntentPath {
    intents: Intent[];
    edges: IntentEdge[];
    totalWeight: number;
    steps: number;
}
//# sourceMappingURL=types.d.ts.map