#!/usr/bin/env node
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const network_1 = require("./network");
const chalk_1 = __importDefault(require("chalk"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
/**
 * 意图网络演示
 */
async function main() {
    console.log(chalk_1.default.cyan('╔════════════════════════════════════════════════════════╗'));
    console.log(chalk_1.default.cyan('║   🌐 意图网络演示                                      ║'));
    console.log(chalk_1.default.cyan('╚════════════════════════════════════════════════════════╝'));
    console.log('');
    // 创建意图网络
    console.log(chalk_1.default.white('📦 创建意图网络...'));
    const registry = (0, network_1.createIntentNetwork)();
    const network = registry.getNetwork();
    console.log(chalk_1.default.gray(`   已注册 ${network.getAllIntents().length} 个意图`));
    console.log(chalk_1.default.gray(`   已定义 ${network['edges'].length} 个关系`));
    console.log('');
    // 按分类展示意图
    console.log(chalk_1.default.white('📂 按分类的意图：'));
    console.log('');
    const categories = ['folder', 'maven'];
    for (const category of categories) {
        const intents = network.getIntentsByCategory(category);
        console.log(chalk_1.default.yellow(`  ${category}:`));
        intents.forEach(intent => {
            const tags = intent.metadata?.tags?.join(', ') || '';
            console.log(`    • ${chalk_1.default.cyan(intent.id)}: ${intent.name}`);
            if (tags) {
                console.log(`      ${chalk_1.default.gray(`[${tags}]`)}`);
            }
        });
        console.log('');
    }
    // 展示意图关系
    console.log(chalk_1.default.white('🔗 意图关系示例：'));
    console.log('');
    const testIntentId = 'explore_folder';
    const nextSteps = network.findNextSteps(testIntentId);
    console.log(chalk_1.default.cyan(`  "${testIntentId}" 的下一步：`));
    if (nextSteps.length === 0) {
        console.log(chalk_1.default.gray('    无'));
    }
    else {
        nextSteps.forEach(({ intent, weight }) => {
            const percentage = (weight * 100).toFixed(0);
            console.log(`    → ${intent.name} (${chalk_1.default.yellow(percentage)}%)`);
        });
    }
    console.log('');
    // 查找路径
    console.log(chalk_1.default.white('🛤️  意图路径示例：'));
    console.log('');
    const fromId = 'analyze_content';
    const toId = 'build_project';
    const intentPath = network.findShortestPath(fromId, toId);
    if (intentPath) {
        console.log(chalk_1.default.cyan(`  从 "${fromId}" 到 "${toId}" 的最短路径：`));
        console.log(chalk_1.default.gray(`    步数: ${intentPath.steps}`));
        console.log(chalk_1.default.gray(`    权重: ${intentPath.totalWeight.toFixed(2)}`));
        console.log('');
        console.log(chalk_1.default.cyan('    路径：'));
        intentPath.intents.forEach((intent, index) => {
            if (index === 0) {
                console.log(`      ${chalk_1.default.green(intent.name)}`);
            }
            else {
                console.log(`      ${chalk_1.default.gray('→')} ${chalk_1.default.green(intent.name)}`);
            }
        });
    }
    else {
        console.log(chalk_1.default.gray('  未找到路径'));
    }
    console.log('');
    // 意图推荐
    console.log(chalk_1.default.white('💡 意图推荐示例：'));
    console.log('');
    const recommendations = network.recommendIntents('analyze_content', { category: 'maven' }, 3);
    console.log(chalk_1.default.cyan('  基于 "analyze_content" 的推荐：'));
    recommendations.forEach(({ intent, score, reason }) => {
        const percentage = (score * 100).toFixed(0);
        console.log(`    • ${intent.name} (${chalk_1.default.yellow(percentage)}%)`);
        console.log(`      ${chalk_1.default.gray(`原因: ${reason}`)}`);
    });
    console.log('');
    // 冲突检测
    console.log(chalk_1.default.white('⚠️  冲突检测示例：'));
    console.log('');
    const conflicts = network.detectConflicts('delete_folder');
    if (conflicts.length === 0) {
        console.log(chalk_1.default.gray('  无冲突'));
    }
    else {
        console.log(chalk_1.default.cyan('  "delete_folder" 的冲突：'));
        conflicts.forEach(({ intent, reason }) => {
            console.log(`    • ${intent.name}: ${reason}`);
        });
    }
    console.log('');
    // 生成 Graphviz
    console.log(chalk_1.default.white('📊 生成 Graphviz DOT 格式...'));
    console.log('');
    const graphviz = registry.toGraphviz();
    console.log(chalk_1.default.gray('  前 20 行：'));
    graphviz.split('\n').slice(0, 20).forEach(line => {
        console.log(chalk_1.default.gray(`    ${line}`));
    });
    console.log(chalk_1.default.gray('    ...'));
    // 保存到文件
    const outputDir = path.join(process.cwd(), 'output');
    const dotFile = path.join(outputDir, 'intent-network.dot');
    const jsonFile = path.join(outputDir, 'intent-network.json');
    fs.mkdirSync(outputDir, { recursive: true });
    fs.writeFileSync(dotFile, graphviz, 'utf-8');
    await registry.saveToFile(jsonFile);
    console.log('');
    console.log(chalk_1.default.green('✓ ') + chalk_1.default.white(`已保存 Graphviz 文件: ${dotFile}`));
    console.log(chalk_1.default.green('✓ ') + chalk_1.default.white(`已保存 JSON 文件: ${jsonFile}`));
    console.log('');
    console.log(chalk_1.default.gray('  提示: 可以使用以下命令生成网络图：'));
    console.log(chalk_1.default.gray(`    dot -Tpng ${dotFile} -o ${outputDir}/intent-network.png`));
}
main().catch(error => {
    console.error(chalk_1.default.red('✗ 发生错误:'), error);
    process.exit(1);
});
//# sourceMappingURL=demo-network.js.map