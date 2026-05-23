// src/cli/interactive.ts - 完整版
import inquirer from 'inquirer';
import { MemoryManager } from '../memory/index.js';
import { Orchestrator } from '../agents/orchestrator.js';
import { logger } from '../utils/logger.js';
import path from 'node:path';

export interface DevFlowOptions {
  requirement: string;
  stage: string | null;
  refresh: boolean;
}

/**
 * 阶段定义
 */
const STAGES = [
  { id: 'research', name: '项目调研', description: '扫描项目结构、技术栈和编码规范' },
  { id: 'analyze', name: '需求分析', description: '解析需求、识别歧义、评估影响范围' },
  { id: 'design', name: '详细设计', description: '生成技术设计文档（数据/接口/组件/逻辑/样式）' },
  { id: 'plan', name: '任务规划', description: '拆分任务、构建执行计划、分析依赖关系' },
  { id: 'develop', name: '开发执行', description: '多Agent并行编码实现' },
  { id: 'test', name: '测试验证', description: '运行单元测试、API测试、E2E测试' },
  { id: 'fix', name: 'Bug修复', description: '根据测试报告修复问题' },
];

/**
 * 运行开发流程
 */
export async function runDevFlow(options: DevFlowOptions): Promise<void> {
  const projectRoot = process.cwd();
  const sessionId = `session-${Date.now()}`;

  // 初始化记忆管理器
  const memory = new MemoryManager(projectRoot);

  // 创建编排器
  const orchestrator = new Orchestrator({
    projectRoot,
    memory,
    sessionId,
  });

  // 定义阶段确认回调
  const onStageComplete = async (stage: string, result: any): Promise<boolean> => {
    if (!result.success) {
      logger.error(`阶段 ${stage} 执行失败: ${result.error}`);
      return false;
    }

    // 显示产物
    if (result.artifacts && result.artifacts.length > 0) {
      logger.info('产出文件:');
      result.artifacts.forEach((a: string) => logger.info(`  - ${a}`));
    }

    // 询问用户是否继续
    try {
      const { continue: shouldContinue } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'continue',
          message: `阶段 ${getStageName(stage)} 完成，是否继续下一阶段？`,
          default: true,
        },
      ]);

      return shouldContinue;
    } catch {
      // 如果inquirer失败（如非交互式环境），默认继续
      return true;
    }
  };

  try {
    if (options.stage) {
      // 单阶段模式
      await runSingleStage(orchestrator, options, onStageComplete);
    } else if (options.requirement) {
      // 全流程模式
      await runFullFlow(orchestrator, options, onStageComplete);
    } else {
      // 交互式选择模式
      await runInteractiveMode(orchestrator, memory, sessionId);
    }
  } finally {
    memory.close();
  }
}

/**
 * 运行单阶段
 */
async function runSingleStage(
  orchestrator: Orchestrator,
  options: DevFlowOptions,
  onStageComplete: (stage: string, result: any) => Promise<boolean>
): Promise<void> {
  const stageInfo = STAGES.find(s => s.id === options.stage);

  if (!stageInfo) {
    logger.error(`未知阶段: ${options.stage}`);
    logger.info('可用阶段:');
    STAGES.forEach(s => logger.info(`  - ${s.id}: ${s.name}`));
    return;
  }

  logger.title(`执行阶段: ${stageInfo.name}`);
  logger.info(stageInfo.description);

  if (options.refresh) {
    logger.info('模式: 刷新模式（将重新生成）');
  }

  await orchestrator.execute({
    stage: options.stage as any,
    requirement: options.requirement,
    refresh: options.refresh,
    onStageComplete,
  });
}

/**
 * 运行全流程
 */
async function runFullFlow(
  orchestrator: Orchestrator,
  options: DevFlowOptions,
  onStageComplete: (stage: string, result: any) => Promise<boolean>
): Promise<void> {
  logger.title('🚀 启动全流程开发');
  logger.info(`需求: ${options.requirement}`);
  logger.info('');
  logger.info('将按顺序执行以下阶段:');
  STAGES.forEach((s, i) => {
    logger.info(`  ${i + 1}. ${s.name} - ${s.description}`);
  });
  logger.info('');
  logger.info('每个阶段完成后将等待您的确认');
  logger.info('');

  // 确认开始
  try {
    const { confirmed } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirmed',
        message: '确认开始执行？',
        default: true,
      },
    ]);

    if (!confirmed) {
      logger.info('已取消');
      return;
    }
  } catch {
    // 非交互式环境，继续执行
  }

  await orchestrator.execute({
    requirement: options.requirement,
    refresh: options.refresh,
    onStageComplete,
  });
}

/**
 * 交互式模式
 */
async function runInteractiveMode(
  orchestrator: Orchestrator,
  memory: MemoryManager,
  sessionId: string
): Promise<void> {
  logger.title('🎯 DevFlow 交互模式');

  // 检查是否有项目记忆
  const hasMemory = await memory.hasMemory();
  if (!hasMemory) {
    logger.warn('尚未初始化项目记忆');
    logger.info('建议先执行: dev-flow run -research');
    logger.info('');
  }

  // 主菜单
  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: '请选择操作:',
      choices: [
        { name: '📋 全流程开发（从需求到代码）', value: 'full' },
        { name: '🔍 单阶段执行', value: 'stage' },
        { name: '📊 查看项目记忆', value: 'memory' },
        { name: '❌ 退出', value: 'exit' },
      ],
    },
  ]);

  switch (action) {
    case 'full': {
      const { requirement } = await inquirer.prompt([
        {
          type: 'input',
          name: 'requirement',
          message: '请输入需求描述:',
          validate: (input: string) => input.trim().length > 0 || '需求描述不能为空',
        },
      ]);

      await runFullFlow(orchestrator, { requirement, stage: null, refresh: false }, async () => true);
      break;
    }

    case 'stage': {
      const { stage } = await inquirer.prompt([
        {
          type: 'list',
          name: 'stage',
          message: '选择要执行的阶段:',
          choices: STAGES.map(s => ({
            name: `${s.name} - ${s.description}`,
            value: s.id,
          })),
        },
      ]);

      let requirement: string | undefined;
      if (stage === 'analyze') {
        const result = await inquirer.prompt([
          {
            type: 'input',
            name: 'requirement',
            message: '请输入需求描述:',
            validate: (input: string) => input.trim().length > 0 || '需求描述不能为空',
          },
        ]);
        requirement = result.requirement;
      }

      await runSingleStage(
        orchestrator,
        { requirement: requirement || '', stage, refresh: false },
        async () => true
      );
      break;
    }

    case 'memory': {
      await showMemoryStatus(memory);
      break;
    }

    case 'exit': {
      logger.info('再见！');
      break;
    }
  }
}

/**
 * 显示记忆状态
 */
async function showMemoryStatus(memory: MemoryManager): Promise<void> {
  logger.title('📊 项目记忆状态');

  const projectMeta = await memory.getProjectMeta();
  const components = await memory.getComponents();
  const apis = await memory.getApis();
  const models = await memory.getModels();
  const utils = await memory.getUtils();

  if (projectMeta) {
    logger.info('项目信息:');
    logger.info(`  名称: ${projectMeta.name}`);
    logger.info(`  技术栈: ${projectMeta.techStack.framework} + ${projectMeta.techStack.language}`);
    logger.info(`  构建工具: ${projectMeta.buildTool}`);
  } else {
    logger.warn('  尚未记录项目信息');
  }

  logger.info('');
  logger.info('已记忆内容:');
  logger.info(`  组件: ${components?.length || 0} 个`);
  logger.info(`  API: ${apis?.length || 0} 个`);
  logger.info(`  数据模型: ${models?.length || 0} 个`);
  logger.info(`  工具函数: ${utils?.length || 0} 个`);
}

/**
 * 获取阶段名称
 */
function getStageName(stageId: string): string {
  const stage = STAGES.find(s => s.id === stageId);
  return stage?.name || stageId;
}

/**
 * 确认阶段转换
 */
export async function confirmStageTransition(
  stage: string,
  current: number,
  total: number
): Promise<boolean> {
  const stageInfo = STAGES.find(s => s.id === stage);
  logger.info('');
  logger.info(`[${current}/${total}] 即将执行: ${stageInfo?.name || stage}`);
  logger.info(`描述: ${stageInfo?.description || '无描述'}`);

  try {
    const { continue: shouldContinue } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'continue',
        message: '是否继续？',
        default: true,
      },
    ]);
    return shouldContinue;
  } catch {
    return true;
  }
}

/**
 * 显示阶段进度
 */
export function showStageProgress(
  stage: string,
  progress: number,
  message?: string
): void {
  const barLength = 30;
  const filled = Math.round((progress / 100) * barLength);
  const empty = barLength - filled;
  const bar = '█'.repeat(filled) + '░'.repeat(empty);

  logger.info(`[${bar}] ${progress}% ${message || ''}`);
}

/**
 * 询问用户确认
 */
export async function askConfirmation(message: string): Promise<boolean> {
  try {
    const { confirmed } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirmed',
        message,
        default: true,
      },
    ]);
    return confirmed;
  } catch {
    return true;
  }
}

/**
 * 询问用户选择
 */
export async function askChoice<T>(
  message: string,
  choices: Array<{ name: string; value: T }>
): Promise<T> {
  try {
    const { selected } = await inquirer.prompt([
      {
        type: 'list',
        name: 'selected',
        message,
        choices: choices.map(c => ({ name: c.name, value: c.value })),
      },
    ]);
    return selected;
  } catch {
    return choices[0]?.value;
  }
}
