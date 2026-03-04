import inquirer from 'inquirer';
import chalk from 'chalk';
import { Intent } from '../models/intent';

/**
 * 交互式菜单
 */
export class InteractiveMenu {
  /**
   * 展示菜单并获取用户选择
   */
  async showMenu(options: Array<{
    intent: Intent;
    confidence: number;
  }>): Promise<Intent | null> {
    console.log('');
    console.log(chalk.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
    console.log(chalk.cyan('  🎯 检测到可能的操作：'));
    console.log(chalk.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
    console.log('');

    const choices = options.map((opt, index) => {
      const confidenceColor = this.getConfidenceColor(opt.confidence);
      const confidenceBar = this.getConfidenceBar(opt.confidence);
      const name = opt.intent.name;
      const desc = opt.intent.description;
      const icon = this.getIntentIcon(opt.intent.category);

      return {
        name: `${chalk.cyan(index + 1)}. ${icon} ${name} ${confidenceColor(confidenceBar)}`,
        short: `${index + 1}. ${name}`,
        value: index, // 使用索引而不是直接值
        description: chalk.gray(`   ${desc}`)
      };
    });

    // 添加取消选项
    choices.push({
      name: `${chalk.red('0').toString()}. ${chalk.gray('❌ 取消')}`,
      short: '取消',
      value: -1, // -1 表示取消
      description: chalk.gray('   退出程序')
    });

    const answers: any = await inquirer.prompt([
      {
        type: 'list' as any,
        name: 'selectedIndex',
        message: '请选择要执行的操作：',
        choices: choices as any,
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
  showIntentDetails(intent: Intent) {
    console.log('');
    console.log(chalk.yellow('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
    console.log(chalk.yellow(`  📋 ${intent.name}`));
    console.log(chalk.yellow('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
    console.log('');

    console.log(chalk.white('描述: ') + chalk.gray(intent.description));
    console.log(chalk.white('分类: ') + chalk.cyan(intent.category));
    console.log('');

    console.log(chalk.white('参数:'));
    intent.parameters.forEach(param => {
      const required = param.required ? chalk.red('必填') : chalk.gray('可选');
      console.log(`  • ${chalk.cyan(param.name)} (${chalk.gray(param.type)}, ${required})`);
      console.log(`    ${chalk.gray(param.description)}`);
    });
    console.log('');

    console.log(chalk.white('可执行的动作:'));
    intent.actions.forEach(action => {
      console.log(`  • ${chalk.cyan(action.id)}: ${chalk.gray(action.name)}`);
      console.log(`    ${chalk.gray(action.description)}`);
    });
  }

  /**
   * 展示执行结果
   */
  showExecutionResult(result: any) {
    console.log('');
    console.log(chalk.yellow('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
    console.log(chalk.yellow('  ✅ 执行结果'));
    console.log(chalk.yellow('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
    console.log('');

    if (result.success) {
      console.log(chalk.green('✓ ') + chalk.white(result.message));
    } else {
      console.log(chalk.red('✗ ') + chalk.white(result.message));
    }

    if (result.data) {
      console.log('');
      console.log(chalk.white('详细数据:'));
      console.log(JSON.stringify(result.data, null, 2));
    }
  }

  /**
   * 获取置信度颜色
   */
  private getConfidenceColor(confidence: number): (str: string) => string {
    if (confidence >= 0.9) return chalk.green;
    if (confidence >= 0.7) return chalk.yellow;
    return chalk.gray;
  }

  /**
   * 获取置信度条
   */
  private getConfidenceBar(confidence: number): string {
    const percentage = Math.round(confidence * 100);
    const filled = Math.round(percentage / 10);
    const empty = 10 - filled;
    return `[${'█'.repeat(filled)}${'░'.repeat(empty)}] ${percentage}%`;
  }

  /**
   * 获取意图图标
   */
  private getIntentIcon(category: string): string {
    const icons: { [key: string]: string } = {
      folder: '📁',
      maven: '☕',
      nodejs: '🟢',
      unknown: '❓'
    };
    return icons[category] || '⚡';
  }
}
