"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.IntentRegistry = void 0;
const intent_network_1 = require("./intent-network");
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
/**
 * 意图注册表
 * 统一管理所有意图场景
 */
class IntentRegistry {
    constructor(network) {
        this.scenarios = new Map();
        this.network = network || new intent_network_1.IntentNetwork();
    }
    /**
     * 获取网络
     */
    getNetwork() {
        return this.network;
    }
    /**
     * 注册场景
     */
    registerScenario(name, intents) {
        this.network.addIntents(intents);
        this.scenarios.set(name, intents.map(intent => intent.id));
    }
    /**
     * 注册关系
     */
    registerRelationship(fromId, toId, type, weight = 1.0, metadata) {
        this.network.addRelationship(fromId, toId, type, weight, metadata);
    }
    /**
     * 批量注册关系
     */
    registerRelationships(relationships) {
        relationships.forEach(rel => {
            this.registerRelationship(rel.from, rel.to, rel.type, rel.weight, rel.metadata);
        });
    }
    /**
     * 获取场景中的意图
     */
    getScenarioIntents(scenarioName) {
        const intentIds = this.scenarios.get(scenarioName);
        if (!intentIds) {
            return [];
        }
        return intentIds
            .map(id => this.network.getIntent(id))
            .filter((intent) => intent !== undefined);
    }
    /**
     * 获取所有场景
     */
    getScenarios() {
        return Array.from(this.scenarios.keys());
    }
    /**
     * 保存到文件
     */
    async saveToFile(filePath) {
        const data = this.network.toJSON();
        await fs.mkdir(path.dirname(filePath), { recursive: true });
        await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
    }
    /**
     * 从文件加载
     */
    static async loadFromFile(filePath) {
        const content = await fs.readFile(filePath, 'utf-8');
        const data = JSON.parse(content);
        const network = intent_network_1.IntentNetwork.fromJSON(data);
        return new IntentRegistry(network);
    }
    /**
     * 导出为 Graphviz
     */
    toGraphviz() {
        return this.network.toGraphviz();
    }
    /**
     * 验证
     */
    validate() {
        return this.network.validate();
    }
}
exports.IntentRegistry = IntentRegistry;
//# sourceMappingURL=registry.js.map