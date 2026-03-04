"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IntentNetwork = void 0;
const types_1 = require("./types");
/**
 * 意图网络类
 * 管理意图节点和意图之间的关系
 */
class IntentNetwork {
    constructor() {
        this.nodes = new Map();
        this.edges = [];
    }
    /**
     * 添加意图节点
     */
    addIntent(intent) {
        const node = {
            intent,
            outgoingEdges: [],
            incomingEdges: []
        };
        this.nodes.set(intent.id, node);
    }
    /**
     * 批量添加意图
     */
    addIntents(intents) {
        intents.forEach(intent => this.addIntent(intent));
    }
    /**
     * 添加关系（边）
     */
    addRelationship(fromId, toId, type, weight = 1.0, metadata) {
        const fromNode = this.nodes.get(fromId);
        const toNode = this.nodes.get(toId);
        if (!fromNode) {
            throw new Error(`意图 ${fromId} 不存在`);
        }
        if (!toNode) {
            throw new Error(`意图 ${toId} 不存在`);
        }
        const edge = {
            from: fromId,
            to: toId,
            type,
            weight,
            metadata
        };
        this.edges.push(edge);
        fromNode.outgoingEdges.push(edge);
        toNode.incomingEdges.push(edge);
    }
    /**
     * 获取意图节点
     */
    getIntent(id) {
        return this.nodes.get(id)?.intent;
    }
    /**
     * 获取所有意图
     */
    getAllIntents() {
        return Array.from(this.nodes.values()).map(node => node.intent);
    }
    /**
     * 按分类获取意图
     */
    getIntentsByCategory(category) {
        return Array.from(this.nodes.values())
            .map(node => node.intent)
            .filter(intent => intent.category === category);
    }
    /**
     * 查找关系
     */
    findRelationships(intentId, type, direction = 'both') {
        const node = this.nodes.get(intentId);
        if (!node) {
            return [];
        }
        let edges = [];
        if (direction === 'outgoing' || direction === 'both') {
            edges = edges.concat(node.outgoingEdges);
        }
        if (direction === 'incoming' || direction === 'both') {
            edges = edges.concat(node.incomingEdges);
        }
        if (type) {
            edges = edges.filter(edge => edge.type === type);
        }
        return edges;
    }
    /**
     * 查找前置意图
     */
    findPrerequisites(intentId) {
        const edges = this.findRelationships(intentId, types_1.RelationshipType.PREREQUISITE, 'incoming');
        return edges
            .map(edge => this.getIntent(edge.from))
            .filter((intent) => intent !== undefined);
    }
    /**
     * 查找下一步意图
     */
    findNextSteps(intentId) {
        const edges = this.findRelationships(intentId, types_1.RelationshipType.NEXT_STEP, 'outgoing');
        return edges
            .map(edge => ({
            intent: this.getIntent(edge.to),
            weight: edge.weight
        }))
            .filter(item => item.intent !== undefined)
            .sort((a, b) => b.weight - a.weight);
    }
    /**
     * 查找替代方案
     */
    findAlternatives(intentId) {
        const edges = this.findRelationships(intentId, types_1.RelationshipType.ALTERNATIVE, 'outgoing');
        return edges
            .map(edge => ({
            intent: this.getIntent(edge.to),
            weight: edge.weight
        }))
            .filter(item => item.intent !== undefined)
            .sort((a, b) => b.weight - a.weight);
    }
    /**
     * 查找相关意图
     */
    findRelatedIntents(intentId, maxResults = 10) {
        const edges = this.findRelationships(intentId, types_1.RelationshipType.RELATED, 'both');
        return edges
            .slice(0, maxResults)
            .map(edge => ({
            intent: this.getIntent(edge.to || edge.from),
            weight: edge.weight
        }))
            .filter(item => item.intent !== undefined)
            .sort((a, b) => b.weight - a.weight);
    }
    /**
     * 查找最短路径（BFS）
     */
    findShortestPath(fromId, toId) {
        if (!this.nodes.has(fromId) || !this.nodes.has(toId)) {
            return null;
        }
        const queue = [
            { id: fromId, path: [fromId], totalWeight: 0 }
        ];
        const visited = new Set();
        while (queue.length > 0) {
            const current = queue.shift();
            if (current.id === toId) {
                return this.buildPath(current.path, current.totalWeight);
            }
            if (visited.has(current.id)) {
                continue;
            }
            visited.add(current.id);
            const node = this.nodes.get(current.id);
            for (const edge of node.outgoingEdges) {
                if (!visited.has(edge.to)) {
                    queue.push({
                        id: edge.to,
                        path: [...current.path, edge.to],
                        totalWeight: current.totalWeight + (1 - edge.weight)
                    });
                }
            }
        }
        return null;
    }
    /**
     * 查找所有路径（DFS）
     */
    findAllPaths(fromId, toId, maxDepth = 10) {
        if (!this.nodes.has(fromId) || !this.nodes.has(toId)) {
            return [];
        }
        const paths = [];
        const dfs = (currentId, path, weight) => {
            if (currentId === toId) {
                paths.push(this.buildPath(path, weight));
                return;
            }
            if (path.length >= maxDepth) {
                return;
            }
            const node = this.nodes.get(currentId);
            for (const edge of node.outgoingEdges) {
                if (!path.includes(edge.to)) {
                    dfs(edge.to, [...path, edge.to], weight + (1 - edge.weight));
                }
            }
        };
        dfs(fromId, [fromId], 0);
        return paths.sort((a, b) => a.totalWeight - b.totalWeight);
    }
    /**
     * 推荐意图（基于上下文）
     */
    recommendIntents(currentIntentId, context, limit = 5) {
        const recommendations = [];
        if (currentIntentId) {
            // 基于当前意图的下一步
            const nextSteps = this.findNextSteps(currentIntentId);
            nextSteps.forEach(({ intent, weight }) => {
                recommendations.push({
                    intent,
                    score: weight * 0.8,
                    reason: '基于当前意图的下一步'
                });
            });
            // 相关意图
            const related = this.findRelatedIntents(currentIntentId, 3);
            related.forEach(({ intent, weight }) => {
                recommendations.push({
                    intent,
                    score: weight * 0.6,
                    reason: '与当前意图相关'
                });
            });
        }
        // 基于上下文
        if (context?.category) {
            const categoryIntents = this.getIntentsByCategory(context.category);
            categoryIntents.forEach(intent => {
                const existing = recommendations.find(r => r.intent.id === intent.id);
                if (!existing) {
                    recommendations.push({
                        intent,
                        score: 0.5,
                        reason: `属于 ${context.category} 分类`
                    });
                }
                else {
                    existing.score += 0.3;
                }
            });
        }
        // 去重并排序
        const unique = new Map();
        recommendations.forEach(rec => {
            const existing = unique.get(rec.intent.id);
            if (!existing || rec.score > existing.score) {
                unique.set(rec.intent.id, rec);
            }
        });
        return Array.from(unique.values())
            .sort((a, b) => b.score - a.score)
            .slice(0, limit);
    }
    /**
     * 检测冲突
     */
    detectConflicts(intentId) {
        const edges = this.findRelationships(intentId, types_1.RelationshipType.CONFLICT, 'both');
        return edges.map(edge => ({
            intent: this.getIntent(edge.to || edge.from),
            reason: edge.metadata?.reason || '存在冲突'
        }));
    }
    /**
     * 验证网络完整性
     */
    validate() {
        const errors = [];
        // 检查孤立节点
        for (const [id, node] of this.nodes.entries()) {
            if (node.outgoingEdges.length === 0 && node.incomingEdges.length === 0) {
                errors.push(`意图 ${id} 是孤立节点`);
            }
        }
        // 检查无效边
        for (const edge of this.edges) {
            if (!this.nodes.has(edge.from)) {
                errors.push(`边的源意图 ${edge.from} 不存在`);
            }
            if (!this.nodes.has(edge.to)) {
                errors.push(`边的目标意图 ${edge.to} 不存在`);
            }
        }
        return {
            valid: errors.length === 0,
            errors
        };
    }
    /**
     * 导出网络为 JSON
     */
    toJSON() {
        return {
            intents: this.getAllIntents(),
            edges: this.edges
        };
    }
    /**
     * 导入网络从 JSON
     */
    static fromJSON(data) {
        const network = new IntentNetwork();
        network.addIntents(data.intents);
        data.edges.forEach(edge => {
            network.addRelationship(edge.from, edge.to, edge.type, edge.weight, edge.metadata);
        });
        return network;
    }
    /**
     * 生成 Graphviz DOT 格式
     */
    toGraphviz() {
        let dot = 'digraph IntentNetwork {\n';
        dot += '  rankdir=LR;\n';
        dot += '  node [shape=box];\n\n';
        // 节点
        for (const intent of this.getAllIntents()) {
            dot += `  "${intent.id}" [label="${intent.name}"];\n`;
        }
        dot += '\n';
        // 边
        const edgeStyles = {
            [types_1.RelationshipType.PREREQUISITE]: '[style=dashed, color=blue]',
            [types_1.RelationshipType.NEXT_STEP]: '[style=bold, color=green]',
            [types_1.RelationshipType.ALTERNATIVE]: '[style=dotted, color=orange]',
            [types_1.RelationshipType.RELATED]: '[style=solid, color=gray]',
            [types_1.RelationshipType.CONFLICT]: '[style=bold, color=red]',
            [types_1.RelationshipType.REQUIRES]: '[color=purple]'
        };
        for (const edge of this.edges) {
            const style = edgeStyles[edge.type] || '';
            const weight = edge.weight.toFixed(2);
            dot += `  "${edge.from}" -> "${edge.to}" ${style} [label="${weight}"];\n`;
        }
        dot += '}';
        return dot;
    }
    /**
     * 构建路径对象
     */
    buildPath(pathIds, totalWeight) {
        const intents = pathIds.map(id => this.getIntent(id)).filter(Boolean);
        const edges = [];
        for (let i = 0; i < pathIds.length - 1; i++) {
            const fromId = pathIds[i];
            const toId = pathIds[i + 1];
            const edge = this.edges.find(e => e.from === fromId && e.to === toId);
            if (edge) {
                edges.push(edge);
            }
        }
        return {
            intents,
            edges,
            totalWeight,
            steps: pathIds.length - 1
        };
    }
}
exports.IntentNetwork = IntentNetwork;
//# sourceMappingURL=intent-network.js.map