import { Command } from 'commander';
import chalk from 'chalk';
import * as fs from 'fs';
import * as path from 'path';
import ora from 'ora';

const AVAILABLE_ROLES = [
  'captain', 'cto', 'pm', 'ba', 'ia', 'aa', 'ta', 'se', 'tse', 'mde', 'swe', 'te', 'cie', 'committer'
];

export class MemberCommand extends Command {
  constructor() {
    super('member');

    this.description('管理团队成员')
      .addCommand(this.buildAddCommand())
      .addCommand(this.buildRemoveCommand())
      .addCommand(this.buildListCommand());
  }

  private buildAddCommand(): Command {
    const cmd = new Command('add');

    return cmd
      .description('添加成员')
      .option('--squad <name>', '团队名称', 'default')
      .option('--role <role>', '角色名称')
      .option('--name <name>', '成员名称')
      .action(async (options) => {
        if (!options.role || !options.name) {
          console.log(chalk.red('❌ 错误: 请指定角色和成员名称'));
          console.log(chalk.yellow('用法: lobster member add --squad team-alpha --role swe --name coder-1'));
          this.showAvailableRoles();
          return;
        }

        if (!AVAILABLE_ROLES.includes(options.role)) {
          console.log(chalk.red(`❌ 错误: 角色 ${options.role} 不存在`));
          this.showAvailableRoles();
          return;
        }

        const spinner = ora(`添加成员 ${chalk.cyan(options.name)}...`).start();

        try {
          await this.addMember(options.squad, options.role, options.name);
          spinner.succeed(chalk.green(`✅ 成员 ${chalk.cyan(options.name)} 添加成功`));
        } catch (error: any) {
          spinner.fail(chalk.red(`❌ 添加成员失败: ${error.message}`));
        }
      });

    return cmd;
  }

  private buildRemoveCommand(): Command {
    const cmd = new Command('remove');

    return cmd
      .description('移除成员')
      .option('--squad <name>', '团队名称', 'default')
      .option('--name <name>', '成员名称')
      .action(async (options) => {
        if (!options.name) {
          console.log(chalk.red('❌ 错误: 请指定成员名称'));
          console.log(chalk.yellow('用法: lobster member remove --squad team-alpha --name coder-1'));
          return;
        }

        const spinner = ora(`移除成员 ${chalk.cyan(options.name)}...`).start();

        try {
          await this.removeMember(options.squad, options.name);
          spinner.succeed(chalk.green(`✅ 成员 ${chalk.cyan(options.name)} 移除成功`));
        } catch (error: any) {
          spinner.fail(chalk.red(`❌ 移除成员失败: ${error.message}`));
        }
      });

    return cmd;
  }

  private buildListCommand(): Command {
    const cmd = new Command('list');

    return cmd
      .description('列出团队成员')
      .option('--squad <name>', '团队名称', 'default')
      .action((options) => {
        this.listMembers(options.squad);
      });

    return cmd;
  }

  private showAvailableRoles(): void {
    console.log(chalk.cyan('\n👥 可用角色:'));
    const roleNames: { [key: string]: string } = {
      'captain': '队长',
      'cto': '首席技术官',
      'pm': '项目经理',
      'ba': '业务架构师',
      'ia': '信息架构师',
      'aa': '应用架构师',
      'ta': '技术架构师',
      'se': '系统工程师',
      'tse': '测试系统工程师',
      'mde': '模块设计工程师',
      'swe': '软件开发工程师',
      'te': '测试开发工程师',
      'cie': '持续集成工程师',
      'committer': '代码审查者'
    };

    AVAILABLE_ROLES.forEach(role => {
      console.log(`  ${chalk.cyan(role.padEnd(12))} - ${roleNames[role] || ''}`);
    });
  }

  private async addMember(squadName: string, role: string, memberName: string): Promise<void> {
    const teamDir = path.join(process.env.HOME || '~', 'lobster-squad-data', 'teams', squadName);
    const configPath = path.join(teamDir, 'team-config.json');

    if (!fs.existsSync(configPath)) {
      throw new Error(`团队 ${squadName} 不存在`);
    }

    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

    // 检查成员是否已存在
    if (config.members.find((m: any) => m.name === memberName)) {
      throw new Error(`成员 ${memberName} 已存在`);
    }

    // 添加成员
    config.members.push({
      name: memberName,
      role,
      createdAt: new Date().toISOString(),
      status: 'inactive'
    });

    // 保存配置
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

    // 创建成员目录
    const memberDir = path.join(teamDir, 'members', memberName);
    fs.mkdirSync(memberDir, { recursive: true });
  }

  private async removeMember(squadName: string, memberName: string): Promise<void> {
    const teamDir = path.join(process.env.HOME || '~', 'lobster-squad-data', 'teams', squadName);
    const configPath = path.join(teamDir, 'team-config.json');

    if (!fs.existsSync(configPath)) {
      throw new Error(`团队 ${squadName} 不存在`);
    }

    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

    // 移除成员
    const index = config.members.findIndex((m: any) => m.name === memberName);
    if (index === -1) {
      throw new Error(`成员 ${memberName} 不存在`);
    }

    config.members.splice(index, 1);

    // 保存配置
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

    // 删除成员目录
    const memberDir = path.join(teamDir, 'members', memberName);
    if (fs.existsSync(memberDir)) {
      fs.rmSync(memberDir, { recursive: true });
    }
  }

  private listMembers(squadName: string): void {
    const teamDir = path.join(process.env.HOME || '~', 'lobster-squad-data', 'teams', squadName);
    const configPath = path.join(teamDir, 'team-config.json');

    if (!fs.existsSync(configPath)) {
      console.log(chalk.red(`❌ 团队 ${squadName} 不存在`));
      return;
    }

    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

    if (config.members.length === 0) {
      console.log(chalk.yellow(`⚠️  团队 ${squadName} 没有成员`));
      return;
    }

    console.log(chalk.cyan(`\n👥 团队 ${squadName} 成员列表:`));
    console.log(chalk.gray('─'.repeat(50)));

    config.members.forEach((member: any) => {
      const statusIcon = member.status === 'active' ? chalk.green('●') : chalk.gray('○');
      console.log(`  ${statusIcon} ${chalk.cyan(member.name)} (${member.role})`);
    });

    console.log(chalk.gray('─'.repeat(50)));
  }
}
