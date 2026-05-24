import { Command } from 'commander';
import { runInstall } from './installer.js';
import { runDevFlow } from './interactive.js';

const program = new Command();

program
  .name('dev-flow')
  .description('AI开发全流程自动化Agent技能系统')
  .version('0.1.0');

program
  .command('install')
  .description('安装 dev-flow 到当前项目')
  .option('-g, --global', '全局安装')
  .action(async (options) => {
    await runInstall(options.global);
  });

program
  .command('run')
  .description('执行 dev-flow 全流程或指定阶段')
  .argument('[requirement]', '需求描述或文档路径')
  .option('-s, --stage <stage>', '执行指定阶段 (research|analyze|design|plan|develop|test|fix|hotfix|legacy-analyze|legacy-migrate|legacy-refactor)')
  .option('-r, --refresh', '刷新模式，重新执行并更新记忆')
  .option('--legacy', '启用老旧项目模式')
  .option('--legacy-from <from>', '迁移源技术栈 (jquery|angularjs|php|python2)')
  .option('--legacy-to <to>', '迁移目标技术栈 (react|vue|angular|node|python3)')
  .option('--legacy-module <module>', '指定迁移模块')
  .option('--legacy-safe', '安全模式（仅低风险重构）')
  .action(async (requirement, options) => {
    await runDevFlow({
      requirement: requirement || '',
      stage: options.stage || null,
      refresh: options.refresh || false,
      legacy: options.legacy || false,
      legacyFrom: options.legacyFrom || null,
      legacyTo: options.legacyTo || null,
      legacyModule: options.legacyModule || null,
      legacySafe: options.legacySafe || false,
    });
  });

program
  .command('legacy')
  .description('老旧项目分析、迁移和重构')
  .option('-a, --analyze', '分析老旧项目')
  .option('-m, --migrate <from:to>', '迁移代码 (如: jquery:react)')
  .option('--refactor', '安全重构分析')
  .option('--module <module>', '指定模块')
  .option('--safe', '安全模式（仅低风险重构）')
  .action(async (options) => {
    if (options.analyze) {
      await runDevFlow({
        requirement: '',
        stage: 'legacy-analyze',
        refresh: false,
        legacy: true,
        legacyModule: options.module || null,
      });
    } else if (options.migrate) {
      const [from, to] = options.migrate.split(':');
      if (!from || !to) {
        console.error('迁移格式错误，请使用 from:to 格式，如: jquery:react');
        process.exit(1);
      }
      await runDevFlow({
        requirement: '',
        stage: 'legacy-migrate',
        refresh: false,
        legacy: true,
        legacyFrom: from,
        legacyTo: to,
        legacyModule: options.module || null,
      });
    } else if (options.refactor) {
      await runDevFlow({
        requirement: '',
        stage: 'legacy-refactor',
        refresh: false,
        legacy: true,
        legacyModule: options.module || null,
        legacySafe: options.safe || false,
      });
    } else {
      // 默认执行分析
      await runDevFlow({
        requirement: '',
        stage: 'legacy-analyze',
        refresh: false,
        legacy: true,
      });
    }
  });

program
  .argument('[command]', '要执行的命令')
  .action(async (command) => {
    if (!command) {
      program.help();
    }
  });

export function parseCli(): void {
  program.parse(process.argv);
}

parseCli();
