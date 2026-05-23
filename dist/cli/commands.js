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
    .option('-s, --stage <stage>', '执行指定阶段 (research|analyze|design|plan|develop|test|fix)')
    .option('-r, --refresh', '刷新模式，重新执行并更新记忆')
    .action(async (requirement, options) => {
    await runDevFlow({
        requirement: requirement || '',
        stage: options.stage || null,
        refresh: options.refresh || false,
    });
});
program
    .argument('[command]', '要执行的命令')
    .action(async (command) => {
    if (!command) {
        program.help();
    }
});
export function parseCli() {
    program.parse(process.argv);
}
parseCli();
//# sourceMappingURL=commands.js.map