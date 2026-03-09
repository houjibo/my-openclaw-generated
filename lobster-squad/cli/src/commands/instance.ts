import { Command } from 'commander';
import chalk from 'chalk';
import * as fs from 'fs';
import * as path from 'path';
import ora from 'ora';
import * as child_process from 'child_process';
import * as util from 'util';

const execAsync = util.promisify(child_process.exec);

export class InstanceCommand extends Command {
  constructor() {
    super('instance');

    this.description('管理实例')
      .addCommand(this.buildStartCommand())
      .addCommand(this.buildStopCommand())
      .addCommand(this.buildRestartCommand())
      .addCommand(this.buildStatusCommand())
      .addCommand(this.buildLogsCommand())
      .addCommand(this.buildRemoveCommand())
      .addCommand(this.buildListCommand());
  }

  private buildStartCommand(): Command {
    const cmd = new Command('start');
    return cmd
      .description('启动实例')
      .option('--squad <name>', '团队名称', 'default')
      .option('--member <name>', '成员名称')
      .action(async (options) => {
        if (!options.member) {
          console.log(chalk.red('❌ 错误: 请指定成员名称'));
          return;
        }
        const spinner = ora(`启动实例 ${chalk.cyan(options.member)}...`).start();
        try {
          await this.startInstance(options.squad, options.member);
          spinner.succeed(chalk.green(`✅ 实例 ${chalk.cyan(options.member)} 启动成功`));
        } catch (error: any) {
          spinner.fail(chalk.red(`❌ 启动实例失败: ${error.message}`));
        }
      });
    return cmd;
  }

  private buildStopCommand(): Command {
    const cmd = new Command('stop');
    return cmd
      .description('停止实例')
      .option('--squad <name>', '团队名称', 'default')
      .option('--member <name>', '成员名称')
      .action(async (options) => {
        if (!options.member) {
          console.log(chalk.red('❌ 错误: 请指定成员名称'));
          return;
        }
        const spinner = ora(`停止实例 ${chalk.cyan(options.member)}...`).start();
        try {
          await this.stopInstance(options.squad, options.member);
          spinner.succeed(chalk.green(`✅ 实例 ${chalk.cyan(options.member)} 停止成功`));
        } catch (error: any) {
          spinner.fail(chalk.red(`❌ 停止实例失败: ${error.message}`));
        }
      });
    return cmd;
  }

  private buildRestartCommand(): Command {
    const cmd = new Command('restart');
    return cmd
      .description('重启实例')
      .option('--squad <name>', '团队名称', 'default')
      .option('--member <name>', '成员名称')
      .action(async (options) => {
        if (!options.member) {
          console.log(chalk.red('❌ 错误: 请指定成员名称'));
          return;
        }
        const spinner = ora(`重启实例 ${chalk.cyan(options.member)}...`).start();
        try {
          await this.restartInstance(options.squad, options.member);
          spinner.succeed(chalk.green(`✅ 实例 ${chalk.cyan(options.member)} 重启成功`));
        } catch (error: any) {
          spinner.fail(chalk.red(`❌ 重启实例失败: ${error.message}`));
        }
      });
    return cmd;
  }

  private buildStatusCommand(): Command {
    const cmd = new Command('status');
    return cmd
      .description('查看实例状态')
      .option('--squad <name>', '团队名称', 'default')
      .option('--member <name>', '成员名称')
      .action(async (options) => {
        if (options.member) {
          await this.showInstanceStatus(options.squad, options.member);
        } else {
          await this.showAllInstancesStatus(options.squad);
        }
      });
    return cmd;
  }

  private buildLogsCommand(): Command {
    const cmd = new Command('logs');
    return cmd
      .description('查看实例日志')
      .option('--squad <name>', '团队名称', 'default')
      .option('--member <name>', '成员名称')
      .option('--follow', '持续跟踪日志', false)
      .action(async (options) => {
        if (!options.member) {
          console.log(chalk.red('❌ 错误: 请指定成员名称'));
          return;
        }
        try {
          await this.showInstanceLogs(options.squad, options.member, options.follow);
        } catch (error: any) {
          console.log(chalk.red(`❌ 查看日志失败: ${error.message}`));
        }
      });
    return cmd;
  }

  private buildRemoveCommand(): Command {
    const cmd = new Command('remove');
    return cmd
      .description('删除实例')
      .option('--squad <name>', '团队名称', 'default')
      .option('--member <name>', '成员名称')
      .action(async (options) => {
        if (!options.member) {
          console.log(chalk.red('❌ 错误: 请指定成员名称'));
          return;
        }
        const spinner = ora(`删除实例 ${chalk.cyan(options.member)}...`).start();
        try {
          await this.removeInstance(options.squad, options.member);
          spinner.succeed(chalk.green(`✅ 实例 ${chalk.cyan(options.member)} 删除成功`));
        } catch (error: any) {
          spinner.fail(chalk.red(`❌ 删除实例失败: ${error.message}`));
        }
      });
    return cmd;
  }

  private buildListCommand(): Command {
    const cmd = new Command('list');
    return cmd
      .description('列出所有实例')
      .option('--squad <name>', '团队名称', 'default')
      .action(async (options) => {
        await this.showAllInstancesStatus(options.squad);
      });
    return cmd;
  }

  private async startInstance(squadName: string, memberName: string): Promise<void> {
    const containerName = `lobster-${memberName}`;
    const teamDir = path.join(process.env.HOME || '~', 'lobster-squad-data', 'teams', squadName);
    const configPath = path.join(teamDir, 'team-config.json');

    if (!fs.existsSync(configPath)) {
      throw new Error(`团队 ${squadName} 不存在`);
    }

    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    const member = config.members.find((m: any) => m.name === memberName);

    if (!member) {
      throw new Error(`成员 ${memberName} 不存在`);
    }

    // 检查 Docker 容器是否已存在
    try {
      const { stdout } = await execAsync(`docker ps -a --filter "name=${containerName}" --format "{{.Names}}"`);
      if (stdout.trim() === containerName) {
        await execAsync(`docker start ${containerName}`);
      } else {
        throw new Error('容器不存在，请使用 docker-compose 启动');
      }
    } catch (error: any) {
      throw new Error(`启动容器失败: ${error.message}`);
    }

    member.status = 'active';
    member.startedAt = new Date().toISOString();
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  }

  private async stopInstance(squadName: string, memberName: string): Promise<void> {
    const containerName = `lobster-${memberName}`;
    const teamDir = path.join(process.env.HOME || '~', 'lobster-squad-data', 'teams', squadName);
    const configPath = path.join(teamDir, 'team-config.json');

    if (!fs.existsSync(configPath)) {
      throw new Error(`团队 ${squadName} 不存在`);
    }

    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    const member = config.members.find((m: any) => m.name === memberName);

    if (!member) {
      throw new Error(`成员 ${memberName} 不存在`);
    }

    try {
      await execAsync(`docker stop ${containerName}`);
    } catch (error: any) {
      throw new Error(`停止容器失败: ${error.message}`);
    }

    member.status = 'inactive';
    member.stoppedAt = new Date().toISOString();
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  }

  private async restartInstance(squadName: string, memberName: string): Promise<void> {
    await this.stopInstance(squadName, memberName);
    await this.startInstance(squadName, memberName);
  }

  private async showInstanceStatus(squadName: string, memberName: string): Promise<void> {
    const containerName = `lobster-${memberName}`;
    const teamDir = path.join(process.env.HOME || '~', 'lobster-squad-data', 'teams', squadName);
    const configPath = path.join(teamDir, 'team-config.json');

    if (!fs.existsSync(configPath)) {
      console.log(chalk.red(`❌ 团队 ${squadName} 不存在`));
      return;
    }

    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    const member = config.members.find((m: any) => m.name === memberName);

    if (!member) {
      console.log(chalk.red(`❌ 成员 ${memberName} 不存在`));
      return;
    }

    console.log(chalk.cyan(`\n📊 实例状态: ${memberName}`));
    console.log(chalk.gray('─'.repeat(50)));
    console.log(`  ${chalk.gray('角色:')}      ${chalk.cyan(member.role)}`);
    console.log(`  ${chalk.gray('状态:')}      ${member.status === 'active' ? chalk.green('运行中') : chalk.gray('已停止')}`);

    try {
      const { stdout } = await execAsync(`docker inspect --format='{{.State.Status}}' ${containerName} 2>/dev/null || echo "not-found"`);
      const status = stdout.trim();
      if (status !== 'not-found') {
        console.log(`  ${chalk.gray('容器:')}      ${status === 'running' ? chalk.green('运行中') : chalk.gray('已停止')}`);
      } else {
        console.log(`  ${chalk.gray('容器:')}      ${chalk.red('不存在')}`);
      }
    } catch (error) {
      console.log(`  ${chalk.gray('容器:')}      ${chalk.yellow('无法检测')}`);
    }

    console.log(chalk.gray('─'.repeat(50)));
  }

  private async showAllInstancesStatus(squadName: string): Promise<void> {
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

    console.log(chalk.cyan(`\n📊 团队 ${squadName} 实例列表:`));
    console.log(chalk.gray('─'.repeat(50)));

    for (const member of config.members) {
      const statusIcon = member.status === 'active' ? chalk.green('●') : chalk.gray('○');
      console.log(`  ${statusIcon} ${chalk.cyan(member.name.padEnd(20))} (${member.role})`);
    }

    console.log(chalk.gray('─'.repeat(50)));
  }

  private async showInstanceLogs(squadName: string, memberName: string, follow: boolean): Promise<void> {
    const containerName = `lobster-${memberName}`;

    try {
      const cmd = follow ? `docker logs -f ${containerName}` : `docker logs ${containerName}`;
      const { stdout, stderr } = await execAsync(cmd);

      if (stdout) console.log(stdout);
      if (stderr) console.error(chalk.red(stderr));
    } catch (error: any) {
      throw new Error(`获取日志失败: ${error.message}`);
    }
  }

  private async removeInstance(squadName: string, memberName: string): Promise<void> {
    await this.stopInstance(squadName, memberName);

    const containerName = `lobster-${memberName}`;

    try {
      await execAsync(`docker rm -f ${containerName}`);
    } catch (error: any) {
      // 容器可能不存在，忽略错误
    }

    const teamDir = path.join(process.env.HOME || '~', 'lobster-squad-data', 'teams', squadName);
    const memberDir = path.join(teamDir, 'members', memberName);

    if (fs.existsSync(memberDir)) {
      fs.rmSync(memberDir, { recursive: true });
    }
  }
}
