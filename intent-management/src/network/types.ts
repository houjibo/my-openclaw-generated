import { Intent } from '../models/intent';

/**
 * 意图关系类型
 */
export enum RelationshipType {
  PREREQUISITE = 'prerequisite',   // 前置条件
  NEXT_STEP = 'next_step',           // 下一步
  ALTERNATIVE = 'alternative',       // 替代方案
  RELATED = 'related',              // 相关
  CONFLICT = 'conflict',            // 冲突
  REQUIRES = 'requires'             // 依赖
}

/**
 * 意图边（关系）
 */
export interface IntentEdge {
  from: string;              // 源意图ID
  to: string;                // 目标意图ID
  type: RelationshipType;
  weight: number;            // 权重 (0-1)
  condition?: string;        // 条件表达式
  metadata?: {
    reason?: string;         // 关系原因
    cost?: number;          // 成本
    risk?: number;          // 风险
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
