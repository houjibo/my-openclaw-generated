"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IntentRecognizer = void 0;
/**
 * 意图识别器基类
 */
class IntentRecognizer {
    constructor() {
        this.intents = [];
    }
    /**
     * 注册意图
     */
    registerIntent(intent) {
        this.intents.push(intent);
    }
    /**
     * 批量注册意图
     */
    registerIntents(intents) {
        this.intents.push(...intents);
    }
    /**
     * 获取所有已注册的意图
     */
    getIntents() {
        return [...this.intents];
    }
    /**
     * 根据ID查找意图
     */
    getIntentById(id) {
        return this.intents.find(intent => intent.id === id);
    }
}
exports.IntentRecognizer = IntentRecognizer;
//# sourceMappingURL=base.js.map