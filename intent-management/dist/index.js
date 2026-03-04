"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const network_1 = require("./network");
const file_detector_1 = require("./utils/file-detector");
const interactive_menu_1 = require("./ui/interactive-menu");
const chalk_1 = __importDefault(require("chalk"));
const inquirer_1 = __importDefault(require("inquirer"));
async function main() {
    const args = process.argv.slice(2);
    console.log(chalk_1.default.cyan('╔════════════════════════════════════════════════════════╗'));
    console.log(chalk_1.default.cyan('║   🎯 意图管理系统 - 智能黑盒子模式                   ║'));
    console.log(chalk_1.default.cyan('╚════════════════════════════════════════════════════════╝'));
    console.log('');
    if (args.length === 0) {
        console.log(chalk_1.default.yellow('用法:'));
        console.log(chalk_1.default.gray('  node dist/index.js <文件/文件夹路径>'));
        console.log('');
        console.log(chalk_1.default.cyan('示例:'));
        console.log(chalk_1.default.gray('  node dist/index.js ~/Documents'));
        console.log(chalk_1.default.gray('  node dist/index.js ~/code/project/pom.xml'));
        console.log('');
        process.exit(1);
    }
    const inputPath = args[0];
    const resolvedPath = inputPath.replace(/^~/, process.env.HOME || '');
    const registry = (0, network_1.createIntentNetwork)();
    const network = registry.getNetwork();
    const detector = new file_detector_1.FileDetector();
    const menu = new interactive_menu_1.InteractiveMenu();
    console.log(chalk_1.default.white('📂 检测文件/文件夹...'));
    const detection = await detector.detect(resolvedPath);
    console.log(chalk_1.default.gray('   类型: ' + detection.type));
    console.log(chalk_1.default.gray('   名称: ' + detection.name));
    console.log(chalk_1.default.gray('   场景: ' + detection.scenario));
    console.log('');
    if (detection.type === file_detector_1.FileType.NOT_FOUND) {
        console.log(chalk_1.default.red('✗ ') + chalk_1.default.white('文件或文件夹不存在'));
        process.exit(1);
    }
    console.log(chalk_1.default.white('🌐 从意图网络获取推荐...'));
    const category = detection.scenario;
    const recommendations = network.recommendIntents(undefined, { category }, 10);
    console.log(chalk_1.default.gray('   找到 ' + recommendations.length + ' 个推荐意图'));
    console.log('');
    const menuOptions = recommendations.map(rec => ({
        intent: rec.intent,
        confidence: rec.score
    }));
    const selectedIntent = await menu.showMenu(menuOptions);
    if (!selectedIntent) {
        console.log(chalk_1.default.gray('操作已取消'));
        process.exit(0);
    }
    menu.showIntentDetails(selectedIntent);
    const { shouldExecute } = await inquirer_1.default.prompt([
        {
            type: 'confirm',
            name: 'shouldExecute',
            message: '是否执行此操作？',
            default: false
        }
    ]);
    if (!shouldExecute) {
        console.log(chalk_1.default.gray('操作已取消'));
        process.exit(0);
    }
    console.log('');
    console.log(chalk_1.default.white('⚙️  正在执行...'));
    const params = {
        path: resolvedPath,
        pomPath: resolvedPath,
        packagePath: resolvedPath
    };
    if (selectedIntent.actions.length > 0) {
        const action = selectedIntent.actions[0];
        const result = await action.execute(params);
        menu.showExecutionResult(result);
    }
    else {
        console.log(chalk_1.default.yellow('⚠ ') + chalk_1.default.white('此意图没有可执行的动作'));
    }
}
main().catch(error => {
    console.error(chalk_1.default.red('✗ 发生错误:'), error);
    process.exit(1);
});
//# sourceMappingURL=index.js.map