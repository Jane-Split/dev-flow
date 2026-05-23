import chalk from 'chalk';
export const logger = {
    info(message) {
        console.log(chalk.blue('ℹ'), message);
    },
    success(message) {
        console.log(chalk.green('✔'), message);
    },
    warn(message) {
        console.log(chalk.yellow('⚠'), message);
    },
    error(message) {
        console.log(chalk.red('✖'), message);
    },
    step(step, total, message) {
        console.log(chalk.cyan(`[${step}/${total}]`), message);
    },
    title(message) {
        console.log();
        console.log(chalk.bold.cyan(`── ${message} ──`));
        console.log();
    },
};
//# sourceMappingURL=logger.js.map