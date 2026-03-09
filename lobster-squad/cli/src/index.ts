#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { SquadCommand } from './commands/squad.js';
import { MemberCommand } from './commands/member.js';
import { InstanceCommand } from './commands/instance.js';

const program = new Command();

program
  .name('lobster')
  .description('🦞 龙虾软件特工队 - Docker 化的 OpenClaw 多实例管理系统')
  .version('0.1.0');

// 注册命令
program.addCommand(new SquadCommand());
program.addCommand(new MemberCommand());
program.addCommand(new InstanceCommand());

// 全局选项
program.option('-v, --verbose', '显示详细输出');

// 解析参数
program.parse(process.argv);

if (program.opts().verbose) {
  console.log(chalk.gray('Debug mode enabled'));
}
