import { Command } from 'commander';
import chalk from 'chalk';
import * as fs from 'fs';
import * as path from 'path';
import ora from 'ora';

export class SquadCommand extends Command {
  constructor() {
    super('squad');

    this.description('管理团队')
      .addCommand(this.buildCreateCommand())
      .addCommand(this.buildListCommand())
      .addCommand(this.buildInfoCommand());
  }

  private buildCreateCommand(): Command {
    const cmd = new Command('create');

    return cmd
      .description('创建新团队')
      .option('--name <name>', '团队名称')
      .option('--description <desc>', '团队描述')
      .action(async (options) => {
        if (!options.name) {
          console.log(chalk.red('❌ 错误: 请指定团队名称'));
          console.log(chalk.yellow('用法: lobster squad create --name team-alpha'));
          return;
        }

        const spinner = ora(`创建团队 ${chalk.cyan(options.name)}...`).start();

        try {
          await this.createTeam(options.name, options.description);
          spinner.succeed(chalk.green(`✅ 团队 ${chalk.cyan(options.name)} 创建成功`));
        } catch (error: any) {
          spinner.fail(chalk.red(`❌ 创建团队失败: ${error.message}`));
        }
      });

    return cmd;
  }

  private buildListCommand(): Command {
    const cmd = new Command('list');

    return cmd
      .description('列出所有团队')
      .action(() => {
        this.listTeams();
      });

    return cmd;
  }

  private buildInfoCommand(): Command {
    const cmd = new Command('info');

    return cmd
      .description('查看团队信息')
      .option('--name <name>', '团队名称')
      .action(async (options) => {
        if (!options.name) {
          console.log(chalk.red('❌ 错误: 请指定团队名称'));
          return;
        }

        await this.showTeamInfo(options.name);
      });

    return cmd;
  }

  private async createTeam(name: string, description?: string): Promise<void> {
    const teamDir = path.join(process.env.HOME || '~', 'lobster-squad-data', 'teams', name);

    // 创建团队目录
    fs.mkdirSync(teamDir, { recursive: true });

    // 创建团队配置
    const config = {
      name,
      description: description || `团队 ${name}`,
      createdAt: new Date().toISOString(),
      members: []
    };

    const configPath = path.join(teamDir, 'team-config.json');
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  }

  private listTeams(): void {
    const teamsDir = path.join(process.env.HOME || '~', 'lobster-squad-data', 'teams');

    if (!fs.existsSync(teamsDir)) {
      console.log(chalk.yellow('⚠️  没有找到任何团队'));
      return;
    }

    const teams = fs.readdirSync(teamsDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);

    if (teams.length === 0) {
      console.log(chalk.yellow('⚠️  没有找到任何团队'));
      return;
    }

    console.log(chalk.cyan('\n📋 团队列表:'));
    console.log(chalk.gray('─'.repeat(50)));

    teams.forEach(team => {
      const configPath = path.join(teamsDir, team, 'team-config.json');
      if (fs.existsSync(configPath)) {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        console.log(`  ${chalk.cyan(team)}`);
        console.log(`    ${chalk.gray(config.description)}`);
        console.log(`    成员数: ${config.members.length}`);
      }
    });

    console.log(chalk.gray('─'.repeat(50)));
  }

  private async showTeamInfo(name: string): Promise<void> {
    const configPath = path.join(process.env.HOME || '~', 'lobster-squad-data', 'teams', name, 'team-config.json');

    if (!fs.existsSync(configPath)) {
      console.log(chalk.red(`❌ 团队 ${name} 不存在`));
      return;
    }

    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

    console.log(chalk.cyan(`\n📊 团队信息: ${name}`));
    console.log(chalk.gray('─'.repeat(50)));
    console.log(`  ${chalk.gray('名称:')}      ${chalk.cyan(config.name)}`);
    console.log(`  ${chalk.gray('描述:')}      ${config.description}`);
    console.log(`  ${chalk.gray('创建时间:')}  ${config.createdAt}`);
    console.log(`  ${chalk.gray('成员数:')}    ${config.members.length}`);
    console.log(chalk.gray('─'.repeat(50)));

    if (config.members.length > 0) {
      console.log(chalk.cyan('\n👥 成员列表:'));
      config.members.forEach((member: any) => {
        console.log(`  ${chalk.green('✓')} ${member.name} (${member.role})`);
      });
    }
  }
}
