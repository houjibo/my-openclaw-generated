"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InteractiveMenu = void 0;
const inquirer_1 = __importDefault(require("inquirer"));
const chalk_1 = __importDefault(require("chalk"));
/**
 * 交互式菜单
 */
class InteractiveMenu {
    /**
     * 展示菜单并获取用户选择
     */
    async showMenu(options) {
        console.log('');
        console.log(chalk_1.default.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
        console.log(chalk_1.default.cyan('  🎯 检测到可能的操作：'));
        console.log(chalk_1.default.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
        console.log('');
        const choices = options.map((opt, index) => {
            const confidenceColor = this.getConfidenceColor(opt.confidence);
            const confidenceBar = this.getConfidenceBar(opt.confidence);
            const name = opt.intent.name;
            const desc = opt.intent.description;
            const icon = this.getIntentIcon(opt.intent.category);
            return {
                name: `${chalk_1.default.cyan(index + 1)}. ${icon} ${name} ${confidenceColor(confidenceBar)}`,
                short: `${index + 1}. ${name}`,
                value: index, // 使用索引而不是直接值
                description: chalk_1.default.gray(`   ${desc}`)
            };
        });
        // 添加取消选项
        choices.push({
            name: `${chalk_1.default.red('0').toString()}. ${chalk_1.default.gray('❌ 取消')}`,
            short: '取消',
            value: -1, // -1 表示取消
            description: chalk_1.default.gray('   退出程序')
        });
        const answers = await inquirer_1.default.prompt([
            {
                type: 'list',
                name: 'selectedIndex',
                message: '请选择要执行的操作：',
                choices: choices,
                pageSize: 15
            }
        ]);
        if (answers.selectedIndex === -1) {
            return null;
        }
        return options[answers.selectedIndex].intent;
    }
    /**
     * 展示意图详情
     */
    showIntentDetails(intent) {
        console.log('');
        console.log(chalk_1.default.yellow('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
        console.log(chalk_1.default.yellow(`  📋 ${intent.name}`));
        console.log(chalk_1.default.yellow('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
        console.log('');
        console.log(chalk_1.default.white('描述: ') + chalk_1.default.gray(intent.description));
        console.log(chalk_1.default.white('分类: ') + chalk_1.default.cyan(intent.category));
        console.log('');
        console.log(chalk_1.default.white('参数:'));
        intent.parameters.forEach(param => {
            const required = param.required ? chalk_1.default.red('必填') : chalk_1.default.gray('可选');
            console.log(`  • ${chalk_1.default.cyan(param.name)} (${chalk_1.default.gray(param.type)}, ${required})`);
            console.log(`    ${chalk_1.default.gray(param.description)}`);
        });
        console.log('');
        console.log(chalk_1.default.white('可执行的动作:'));
        intent.actions.forEach(action => {
            console.log(`  • ${chalk_1.default.cyan(action.id)}: ${chalk_1.default.gray(action.name)}`);
            console.log(`    ${chalk_1.default.gray(action.description)}`);
        });
    }
    /**
     * 展示执行结果
     */
    showExecutionResult(result) {
        console.log('');
        console.log(chalk_1.default.yellow('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
        console.log(chalk_1.default.yellow('  ✅ 执行结果'));
        console.log(chalk_1.default.yellow('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
        console.log('');
        if (result.success) {
            console.log(chalk_1.default.green('✓ ') + chalk_1.default.white(result.message));
        }
        else {
            console.log(chalk_1.default.red('✗ ') + chalk_1.default.white(result.message));
        }
        if (result.data) {
            console.log('');
            console.log(chalk_1.default.white('详细数据:'));
            console.log(JSON.stringify(result.data, null, 2));
        }
    }
    /**
     * 获取置信度颜色
     */
    getConfidenceColor(confidence) {
        if (confidence >= 0.9)
            return chalk_1.default.green;
        if (confidence >= 0.7)
            return chalk_1.default.yellow;
        return chalk_1.default.gray;
    }
    /**
     * 获取置信度条
     */
    getConfidenceBar(confidence) {
        const percentage = Math.round(confidence * 100);
        const filled = Math.round(percentage / 10);
        const empty = 10 - filled;
        return `[${'█'.repeat(filled)}${'░'.repeat(empty)}] ${percentage}%`;
    }
    /**
     * 获取意图图标
     */
    getIntentIcon(category) {
        const icons = {
            folder: '📁',
            maven: '☕',
            nodejs: '🟢',
            unknown: '❓'
        };
        return icons[category] || '⚡';
    }
}
exports.InteractiveMenu = InteractiveMenu;
//# sourceMappingURL=interactive-menu.js.map