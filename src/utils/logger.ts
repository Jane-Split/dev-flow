import chalk from 'chalk';

export const logger = {
  info(message: string): void {
    console.log(chalk.blue('ℹ'), message);
  },

  success(message: string): void {
    console.log(chalk.green('✔'), message);
  },

  warn(message: string): void {
    console.log(chalk.yellow('⚠'), message);
  },

  error(message: string): void {
    console.log(chalk.red('✖'), message);
  },

  step(step: number, total: number, message: string): void {
    console.log(chalk.cyan(`[${step}/${total}]`), message);
  },

  title(message: string): void {
    console.log();
    console.log(chalk.bold.cyan(`── ${message} ──`));
    console.log();
  },
};
