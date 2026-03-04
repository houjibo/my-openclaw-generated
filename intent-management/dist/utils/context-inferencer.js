"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContextInferencer = void 0;
/**
 * 上下文推断器
 * 基于文件/文件夹信息，推断可能的意图
 */
class ContextInferencer {
    constructor(recognizer) {
        this.recognizer = recognizer;
    }
    /**
     * 推断所有可能的意图
     */
    async inferIntents(detection) {
        // 构建上下文信息
        const context = {
            fileType: detection.type,
            fileName: detection.name,
            extension: detection.extension,
            specialFile: detection.specialFile,
            scenario: detection.scenario
        };
        // 使用 LLM 推断意图
        const result = await this.recognizeWithContext(context);
        // 获取所有可用意图，按相关性排序
        const allIntents = this.rankAllIntents(detection, result);
        return {
            topIntent: result,
            allIntents
        };
    }
    /**
     * 基于上下文识别意图
     */
    async recognizeWithContext(context) {
        const input = this.buildContextualInput(context);
        return await this.recognizer.recognize(input, context);
    }
    /**
     * 构建上下文输入
     */
    buildContextualInput(context) {
        if (context.specialFile === 'pom.xml') {
            return '我有一个 Maven 项目（pom.xml），我想...';
        }
        if (context.specialFile === 'package.json') {
            return '我有一个 Node.js 项目（package.json），我想...';
        }
        if (context.fileType === 'directory') {
            return `我有一个文件夹 "${context.fileName}"，我想...`;
        }
        return '我想...';
    }
    /**
     * 对所有意图进行排序
     */
    rankAllIntents(detection, topResult) {
        const allIntents = this.recognizer.getIntents();
        // 基于文件类型调整置信度
        return allIntents.map(intent => {
            let confidence = 0.3; // 基础置信度
            // 如果是 LLM 识别的意图，使用其置信度
            if (topResult.intent && intent.id === topResult.intent.id) {
                confidence = topResult.confidence;
            }
            // 根据文件类型调整
            if (detection.scenario === 'folder' && intent.category === 'folder') {
                confidence = Math.min(confidence + 0.2, 0.95);
            }
            if (detection.scenario === 'maven' && intent.category === 'maven') {
                confidence = Math.min(confidence + 0.2, 0.95);
            }
            return {
                intent,
                confidence,
                description: intent.description
            };
        }).sort((a, b) => b.confidence - a.confidence);
    }
}
exports.ContextInferencer = ContextInferencer;
//# sourceMappingURL=context-inferencer.js.map