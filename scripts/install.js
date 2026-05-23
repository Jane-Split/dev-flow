#!/usr/bin/env node
/**
 * dev-flow 多工具安装脚本
 * 支持: Trae, Cursor, Qoder, Claude Code
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROJECT_ROOT = process.cwd();
const DEV_FLOW_ROOT = path.resolve(__dirname, '..');

// 工具配置
const TOOLS = {
  trae: {
    name: 'Trae',
    configDir: '.trae/skills',
    sourceFile: 'trae/SKILL.md',
    targetName: 'dev-flow.md',
  },
  cursor: {
    name: 'Cursor',
    configDir: '.cursor/commands',
    sourceFile: 'cursor/dev-flow.md',
    targetName: 'dev-flow.md',
  },
  qoder: {
    name: 'Qoder',
    configDir: '.qoder/commands',
    sourceFile: 'qoder/dev-flow.md',
    targetName: 'dev-flow.md',
  },
  claude: {
    name: 'Claude Code',
    configDir: '.claude/commands',
    sourceFile: 'claude/dev-flow.md',
    targetName: 'dev-flow.md',
  },
};

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`✓ 创建目录: ${dir}`);
  }
}

function copySkill(toolKey, tool) {
  const sourcePath = path.join(DEV_FLOW_ROOT, 'skill-templates', tool.sourceFile);
  const targetDir = path.join(PROJECT_ROOT, tool.configDir);
  const targetPath = path.join(targetDir, tool.targetName);

  if (!fs.existsSync(sourcePath)) {
    console.log(`✗ ${tool.name}: 源文件不存在 ${sourcePath}`);
    return false;
  }

  ensureDir(targetDir);
  fs.copyFileSync(sourcePath, targetPath);
  console.log(`✓ ${tool.name}: 已安装到 ${tool.configDir}/${tool.targetName}`);
  return true;
}

function installAll() {
  console.log('🚀 安装 dev-flow 到所有支持的工具...\n');
  
  let success = 0;
  let failed = 0;

  for (const [key, tool] of Object.entries(TOOLS)) {
    if (copySkill(key, tool)) {
      success++;
    } else {
      failed++;
    }
  }

  console.log(`\n📊 安装完成: ${success} 成功, ${failed} 失败`);
  console.log('\n使用方法:');
  console.log('  - Trae: 在输入框输入 /dev-flow <需求描述>');
  console.log('  - Cursor: 在输入框输入 /dev-flow <需求描述>');
  console.log('  - Qoder: 在输入框输入 /dev-flow <需求描述>');
  console.log('  - Claude Code: 在输入框输入 /dev-flow <需求描述>');
}

function installSingle(toolName) {
  const tool = TOOLS[toolName.toLowerCase()];
  if (!tool) {
    console.error(`✗ 未知工具: ${toolName}`);
    console.log('支持的工具:', Object.keys(TOOLS).join(', '));
    process.exit(1);
  }

  console.log(`🚀 安装 dev-flow 到 ${tool.name}...\n`);
  
  if (copySkill(toolName.toLowerCase(), tool)) {
    console.log(`\n✓ ${tool.name} 安装成功!`);
    console.log(`使用方法: 在输入框输入 /dev-flow <需求描述>`);
  } else {
    console.log(`\n✗ ${tool.name} 安装失败`);
    process.exit(1);
  }
}

function uninstall() {
  console.log('🗑️  卸载 dev-flow...\n');
  
  for (const [key, tool] of Object.entries(TOOLS)) {
    const targetDir = path.join(PROJECT_ROOT, tool.configDir);
    const targetPath = path.join(targetDir, tool.targetName);
    
    if (fs.existsSync(targetPath)) {
      fs.unlinkSync(targetPath);
      console.log(`✓ ${tool.name}: 已卸载`);
    }
  }
  
  console.log('\n✓ 卸载完成');
}

// 主逻辑
const args = process.argv.slice(2);
const command = args[0];

switch (command) {
  case 'all':
    installAll();
    break;
  case 'trae':
  case 'cursor':
  case 'qoder':
  case 'claude':
    installSingle(command);
    break;
  case 'uninstall':
    uninstall();
    break;
  case '--help':
  case '-h':
  default:
    console.log(`
dev-flow 安装脚本

用法:
  node install.js [命令]

命令:
  all          安装到所有支持的工具
  trae         安装到 Trae
  cursor       安装到 Cursor
  qoder        安装到 Qoder
  claude       安装到 Claude Code
  uninstall    卸载所有安装

示例:
  node install.js all
  node install.js cursor
`);
    break;
}
