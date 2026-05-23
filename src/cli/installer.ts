// src/cli/installer.ts
import path from 'node:path';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { logger } from '../utils/logger.js';
import { ensureDir, fileExists, readText, writeText, copyFile, resolveProjectRoot } from '../utils/fs-utils.js';

const DEV_FLOW_DIR = '.dev-flow';
const MEMORY_DIR = `${DEV_FLOW_DIR}/memory`;
const DB_DIR = `${DEV_FLOW_DIR}/db`;
const SESSIONS_DIR = `${DEV_FLOW_DIR}/sessions`;
const CONFIG_FILE = `${DEV_FLOW_DIR}/config.yaml`;

interface DetectionResult {
  packageManager: 'npm' | 'yarn' | 'pnpm' | 'unknown';
  hasTypeScript: boolean;
  hasReact: boolean;
  hasVue: boolean;
  hasVite: boolean;
  aiTools: ('cursor' | 'trae' | 'qoder' | 'claude' | 'unknown')[];
}

async function detectEnvironment(projectRoot: string): Promise<DetectionResult> {
  const result: DetectionResult = {
    packageManager: 'unknown',
    hasTypeScript: false,
    hasReact: false,
    hasVue: false,
    hasVite: false,
    aiTools: [],
  };

  // 检测包管理器
  if (await fileExists(path.join(projectRoot, 'pnpm-lock.yaml'))) {
    result.packageManager = 'pnpm';
  } else if (await fileExists(path.join(projectRoot, 'yarn.lock'))) {
    result.packageManager = 'yarn';
  } else if (await fileExists(path.join(projectRoot, 'package-lock.json'))) {
    result.packageManager = 'npm';
  }

  // 检测技术栈
  const pkgPath = path.join(projectRoot, 'package.json');
  if (await fileExists(pkgPath)) {
    const pkgContent = await readText(pkgPath);
    const pkg = JSON.parse(pkgContent);
    const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
    result.hasTypeScript = 'typescript' in allDeps;
    result.hasReact = 'react' in allDeps || 'react-dom' in allDeps;
    result.hasVue = 'vue' in allDeps;
    result.hasVite = 'vite' in allDeps;
  }

  // 检测AI工具（可能同时存在多个）
  if (await fileExists(path.join(projectRoot, '.cursor'))) {
    result.aiTools.push('cursor');
  }
  if (await fileExists(path.join(projectRoot, '.trae'))) {
    result.aiTools.push('trae');
  }
  if (await fileExists(path.join(projectRoot, '.qoder'))) {
    result.aiTools.push('qoder');
  }
  if (await fileExists(path.join(projectRoot, '.claude'))) {
    result.aiTools.push('claude');
  }
  if (result.aiTools.length === 0) {
    result.aiTools.push('unknown');
  }

  return result;
}

async function createDirectories(projectRoot: string): Promise<void> {
  logger.info('创建目录结构...');
  try {
    await ensureDir(path.join(projectRoot, MEMORY_DIR, 'conventions'));
    await ensureDir(path.join(projectRoot, MEMORY_DIR, 'components'));
    await ensureDir(path.join(projectRoot, MEMORY_DIR, 'apis'));
    await ensureDir(path.join(projectRoot, MEMORY_DIR, 'utils'));
    await ensureDir(path.join(projectRoot, MEMORY_DIR, 'styles'));
    await ensureDir(path.join(projectRoot, MEMORY_DIR, 'patterns'));
    await ensureDir(path.join(projectRoot, DB_DIR));
    await ensureDir(path.join(projectRoot, SESSIONS_DIR));
    logger.success('目录结构创建完成');
  } catch (error) {
    logger.error('目录结构创建失败');
    throw error;
  }
}

async function copyConfig(projectRoot: string): Promise<void> {
  logger.info('生成配置文件...');
  try {
    // 读取模板并写入配置（使用 dev-flow 包自身的目录）
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const devFlowPackageDir = path.resolve(__dirname, '../../..');
    const templatePath = path.join(devFlowPackageDir, 'templates', 'config.yaml');
    const destPath = path.join(projectRoot, CONFIG_FILE);

    if (await fileExists(templatePath)) {
      const template = await readText(templatePath);
      await writeText(destPath, template);
    } else {
      // 内联默认配置
      const defaultConfig = `name: dev-flow
version: 0.1.0

project:
  techStack: auto-detect
  conventions: auto-detect

agents:
  maxParallel: 3
  timeout: 300000
  retryCount: 2

memory:
  autoLearn: true
  vectorSearch: true
  maxContextTokens: 100000

test:
  browser: playwright
  unitTest: vitest
  coverage: true
`;
      await writeText(destPath, defaultConfig);
    }

    // 创建 .gitignore
    const gitignorePath = path.join(projectRoot, DEV_FLOW_DIR, '.gitignore');
    await writeText(gitignorePath, 'db/\n*.db\nsessions/\n');

    logger.success('配置文件生成完成');
  } catch (error) {
    logger.error('配置文件生成失败');
    throw error;
  }
}

async function registerSkill(projectRoot: string, aiTools: string[]): Promise<void> {
  logger.info(`注册技能到 AI 工具...`);
  try {
    // 获取 dev-flow 包自身的目录（而不是用户项目目录）
    // 使用 fileURLToPath 正确处理 Windows 路径
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const devFlowPackageDir = path.resolve(__dirname, '../../..');
    const installedTools: string[] = [];

    // 总是安装到所有支持的工具（创建目录并复制文件）
    const tools = [
      {
        name: 'cursor',
        dir: path.join(projectRoot, '.cursor', 'commands'),
        src: path.join(devFlowPackageDir, 'skill-templates', 'cursor', 'dev-flow.md'),
        dest: path.join(projectRoot, '.cursor', 'commands', 'dev-flow.md'),
      },
      {
        name: 'trae',
        dir: path.join(projectRoot, '.trae', 'skills'),
        src: path.join(devFlowPackageDir, 'skill-templates', 'trae', 'SKILL.md'),
        dest: path.join(projectRoot, '.trae', 'skills', 'dev-flow.md'),
      },
      {
        name: 'claude',
        dir: path.join(projectRoot, '.claude', 'commands'),
        src: path.join(devFlowPackageDir, 'skill-templates', 'claude', 'dev-flow.md'),
        dest: path.join(projectRoot, '.claude', 'commands', 'dev-flow.md'),
      },
      {
        name: 'qoder',
        dir: path.join(projectRoot, '.qoder', 'commands'),
        src: path.join(devFlowPackageDir, 'skill-templates', 'qoder', 'dev-flow.md'),
        dest: path.join(projectRoot, '.qoder', 'commands', 'dev-flow.md'),
      },
    ];

    for (const tool of tools) {
      await ensureDir(tool.dir);
      if (await fileExists(tool.src)) {
        await copyFile(tool.src, tool.dest);
        installedTools.push(tool.name);
      } else {
        logger.warn(`源文件不存在: ${tool.src}`);
      }
    }

    if (installedTools.length > 0) {
      logger.success(`已安装技能到: ${installedTools.join(', ')}`);
    } else {
      logger.warn('未能安装任何技能文件');
    }
    logger.info('提示: 如果使用的AI工具未列出，手动复制上述文件到对应目录即可');
  } catch (error) {
    logger.error('技能注册失败');
    throw error;
  }
}

export async function runInstall(isGlobal: boolean): Promise<void> {
  logger.title('dev-flow 安装');

  const projectRoot = resolveProjectRoot();
  logger.info(`项目根目录: ${projectRoot}`);

  // Step 1: 检测环境
  const env = await detectEnvironment(projectRoot);
  logger.info(`包管理器: ${env.packageManager}`);
  logger.info(`技术栈: TypeScript=${env.hasTypeScript} React=${env.hasReact} Vue=${env.hasVue} Vite=${env.hasVite}`);
  logger.info(`AI工具: ${env.aiTools.join(', ')}`);

  // Step 2: 创建目录
  await createDirectories(projectRoot);

  // Step 3: 生成配置
  await copyConfig(projectRoot);

  // Step 4: 注册技能
  await registerSkill(projectRoot, env.aiTools);

  // Step 5: 完成提示
  logger.title('安装完成');
  logger.success('dev-flow 已安装到当前项目');
  logger.info('');
  logger.info('使用方法:');
  logger.info('  /dev-flow <需求描述>     执行全流程开发');
  logger.info('  /dev-flow -<阶段>       执行指定阶段');
  logger.info('  /dev-flow -research     项目调研');
  logger.info('  /dev-flow -analyze      需求分析');
  logger.info('  /dev-flow -design       详细设计');
  logger.info('  /dev-flow -plan         任务拆分');
  logger.info('  /dev-flow -develop      开发执行');
  logger.info('  /dev-flow -test         测试验证');
  logger.info('  /dev-flow -fix          Bug修复');
}
