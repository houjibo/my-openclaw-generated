#!/usr/bin/env node

import { createIntentNetwork } from './network';
import chalk from 'chalk';
import * as fs from 'fs';
import * as path from 'path';

/**
 * 意图网络演示
 */
async function main() {
  console.log(chalk.cyan('╔════════════════════════════════════════════════════════╗'));
  console.log(chalk.cyan('║   🌐 意图网络演示                                      ║'));
  console.log(chalk.cyan('╚════════════════════════════════════════════════════════╝'));
  console.log('');

  // 创建意图网络
  console.log(chalk.white('📦 创建意图网络...'));
  const registry = createIntentNetwork();
  const network = registry.getNetwork();

  console.log(chalk.gray(`   已注册 ${network.getAllIntents().length} 个意图`));
  console.log(chalk.gray(`   已定义 ${network['edges'].length} 个关系`));
  console.log('');

  // 按分类展示意图
  console.log(chalk.white('📂 按分类的意图：'));
  console.log('');

  const categories = ['folder', 'maven'];

  for (const category of categories) {
    const intents = network.getIntentsByCategory(category);

    console.log(chalk.yellow(`  ${category}:`));
    intents.forEach(intent => {
      const tags = intent.metadata?.tags?.join(', ') || '';
      console.log(`    • ${chalk.cyan(intent.id)}: ${intent.name}`);
      if (tags) {
        console.log(`      ${chalk.gray(`[${tags}]`)}`);
      }
    });
    console.log('');
  }

  // 展示意图关系
  console.log(chalk.white('🔗 意图关系示例：'));
  console.log('');

  const testIntentId = 'explore_folder';
  const nextSteps = network.findNextSteps(testIntentId);

  console.log(chalk.cyan(`  "${testIntentId}" 的下一步：`));
  if (nextSteps.length === 0) {
    console.log(chalk.gray('    无'));
  } else {
    nextSteps.forEach(({ intent, weight }) => {
      const percentage = (weight * 100).toFixed(0);
      console.log(`    → ${intent.name} (${chalk.yellow(percentage)}%)`);
    });
  }
  console.log('');

  // 查找路径
  console.log(chalk.white('🛤️  意图路径示例：'));
  console.log('');

  const fromId = 'analyze_content';
  const toId = 'build_project';

  const intentPath = network.findShortestPath(fromId, toId);

  if (intentPath) {
    console.log(chalk.cyan(`  从 "${fromId}" 到 "${toId}" 的最短路径：`));
    console.log(chalk.gray(`    步数: ${intentPath.steps}`));
    console.log(chalk.gray(`    权重: ${intentPath.totalWeight.toFixed(2)}`));
    console.log('');
    console.log(chalk.cyan('    路径：'));
    intentPath.intents.forEach((intent, index) => {
      if (index === 0) {
        console.log(`      ${chalk.green(intent.name)}`);
      } else {
        console.log(`      ${chalk.gray('→')} ${chalk.green(intent.name)}`);
      }
    });
  } else {
    console.log(chalk.gray('  未找到路径'));
  }
  console.log('');

  // 意图推荐
  console.log(chalk.white('💡 意图推荐示例：'));
  console.log('');

  const recommendations = network.recommendIntents(
    'analyze_content',
    { category: 'maven' },
    3
  );

  console.log(chalk.cyan('  基于 "analyze_content" 的推荐：'));
  recommendations.forEach(({ intent, score, reason }) => {
    const percentage = (score * 100).toFixed(0);
    console.log(`    • ${intent.name} (${chalk.yellow(percentage)}%)`);
    console.log(`      ${chalk.gray(`原因: ${reason}`)}`);
  });
  console.log('');

  // 冲突检测
  console.log(chalk.white('⚠️  冲突检测示例：'));
  console.log('');

  const conflicts = network.detectConflicts('delete_folder');

  if (conflicts.length === 0) {
    console.log(chalk.gray('  无冲突'));
  } else {
    console.log(chalk.cyan('  "delete_folder" 的冲突：'));
    conflicts.forEach(({ intent, reason }) => {
      console.log(`    • ${intent.name}: ${reason}`);
    });
  }
  console.log('');

  // 生成 Graphviz
  console.log(chalk.white('📊 生成 Graphviz DOT 格式...'));
  console.log('');

  const graphviz = registry.toGraphviz();

  console.log(chalk.gray('  前 20 行：'));
  graphviz.split('\n').slice(0, 20).forEach(line => {
    console.log(chalk.gray(`    ${line}`));
  });
  console.log(chalk.gray('    ...'));

  // 保存到文件
  const outputDir = path.join(process.cwd(), 'output');
  const dotFile = path.join(outputDir, 'intent-network.dot');
  const jsonFile = path.join(outputDir, 'intent-network.json');

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(dotFile, graphviz, 'utf-8');
  await registry.saveToFile(jsonFile);

  console.log('');
  console.log(chalk.green('✓ ') + chalk.white(`已保存 Graphviz 文件: ${dotFile}`));
  console.log(chalk.green('✓ ') + chalk.white(`已保存 JSON 文件: ${jsonFile}`));
  console.log('');
  console.log(chalk.gray('  提示: 可以使用以下命令生成网络图：'));
  console.log(chalk.gray(`    dot -Tpng ${dotFile} -o ${outputDir}/intent-network.png`));
}

main().catch(error => {
  console.error(chalk.red('✗ 发生错误:'), error);
  process.exit(1);
});
