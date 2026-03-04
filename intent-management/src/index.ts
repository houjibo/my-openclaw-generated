import { createIntentNetwork, IntentNetwork, IntentNode } from './network';
import { FileDetector, DetectionResult, FileType } from './utils/file-detector';
import { InteractiveMenu } from './ui/interactive-menu';
import { Intent, IntentRecognitionResult } from './models/intent';
import { LLMIntentRecognizer } from './recognizers/llm-recognizer';
import chalk from 'chalk';
import inquirer from 'inquirer';
import * as path from 'path';

async function main() {
  const args = process.argv.slice(2);

  console.log(chalk.cyan('╔════════════════════════════════════════════════════════╗'));
  console.log(chalk.cyan('║   🎯 意图管理系统 - 智能黑盒子模式                   ║'));
  console.log(chalk.cyan('╚════════════════════════════════════════════════════════╝'));
  console.log('');

  if (args.length === 0) {
    console.log(chalk.yellow('用法:'));
    console.log(chalk.gray('  node dist/index.js <文件/文件夹路径>'));
    console.log('');
    console.log(chalk.cyan('示例:'));
    console.log(chalk.gray('  node dist/index.js ~/Documents'));
    console.log(chalk.gray('  node dist/index.js ~/code/project/pom.xml'));
    console.log('');
    process.exit(1);
  }

  const inputPath = args[0];
  const resolvedPath = inputPath.replace(/^~/, process.env.HOME || '');

  const registry = createIntentNetwork();
  const network = registry.getNetwork();
  const detector = new FileDetector();
  const menu = new InteractiveMenu();

  console.log(chalk.white('📂 检测文件/文件夹...'));
  const detection = await detector.detect(resolvedPath);

  console.log(chalk.gray('   类型: ' + detection.type));
  console.log(chalk.gray('   名称: ' + detection.name));
  console.log(chalk.gray('   场景: ' + detection.scenario));
  console.log('');

  if (detection.type === FileType.NOT_FOUND) {
    console.log(chalk.red('✗ ') + chalk.white('文件或文件夹不存在'));
    process.exit(1);
  }

  console.log(chalk.white('🌐 从意图网络获取推荐...'));
  const category = detection.scenario as 'folder' | 'maven' | 'nodejs' | 'unknown';
  const recommendations = network.recommendIntents(undefined, { category }, 10);

  console.log(chalk.gray('   找到 ' + recommendations.length + ' 个推荐意图'));
  console.log('');

  const menuOptions = recommendations.map(rec => ({
    intent: rec.intent,
    confidence: rec.score
  }));

  const selectedIntent = await menu.showMenu(menuOptions);

  if (!selectedIntent) {
    console.log(chalk.gray('操作已取消'));
    process.exit(0);
  }

  menu.showIntentDetails(selectedIntent);

  const { shouldExecute } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'shouldExecute',
      message: '是否执行此操作？',
      default: false
    }
  ]);

  if (!shouldExecute) {
    console.log(chalk.gray('操作已取消'));
    process.exit(0);
  }

  console.log('');
  console.log(chalk.white('⚙️  正在执行...'));

  const params: any = {
    path: resolvedPath,
    pomPath: resolvedPath,
    packagePath: resolvedPath
  };

  if (selectedIntent.actions.length > 0) {
    const action = selectedIntent.actions[0];
    const result = await action.execute(params);
    menu.showExecutionResult(result);
  } else {
    console.log(chalk.yellow('⚠ ') + chalk.white('此意图没有可执行的动作'));
  }
}

main().catch(error => {
  console.error(chalk.red('✗ 发生错误:'), error);
  process.exit(1);
});
