#!/usr/bin/env node

import { cpSync, mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const PROJECT_ROOT = process.cwd();

const SKILL_FILES = {
  trae: { src: 'skill-templates/trae/SKILL.md', dest: '.trae/skills/dev-flow/SKILL.md' },
  cursor: { src: 'skill-templates/cursor/dev-flow.md', dest: '.cursor/commands/dev-flow.md' },
  qoder: { src: 'skill-templates/qoder/dev-flow.md', dest: '.qoder/commands/dev-flow.md' },
  claude: { src: 'skill-templates/claude/dev-flow.md', dest: '.claude/commands/dev-flow.md' },
};

const MEMORY_FILES = [
  'project-overview.md',
  'conventions.md',
  'components.md',
  'apis.md',
  'models.md',
  'utils.md',
  'architecture.md',
];

function install(target) {
  if (target === 'all' || !target) {
    for (const key of Object.keys(SKILL_FILES)) {
      installSkill(key);
    }
  } else {
    installSkill(target);
  }
  createMemoryTemplate();
  console.log('\n✅ dev-flow skill 安装完成！');
  console.log('   在 AI 编程工具中输入 /dev-flow <需求> 开始使用\n');
}

function installSkill(tool) {
  const config = SKILL_FILES[tool];
  if (!config) {
    console.error(`❌ 不支持的工具: ${tool}`);
    console.error(`   支持: ${Object.keys(SKILL_FILES).join(', ')}, all`);
    process.exit(1);
  }

  const src = resolve(ROOT, config.src);
  const dest = resolve(PROJECT_ROOT, config.dest);

  if (!existsSync(src)) {
    console.error(`❌ 源文件不存在: ${src}`);
    return;
  }

  mkdirSync(dirname(dest), { recursive: true });
  cpSync(src, dest);
  console.log(`✅ ${tool}: ${dest}`);
}

function createMemoryTemplate() {
  const memoryDir = resolve(PROJECT_ROOT, '.dev-flow/memory');
  const sessionsDir = resolve(PROJECT_ROOT, '.dev-flow/sessions');

  mkdirSync(memoryDir, { recursive: true });
  mkdirSync(sessionsDir, { recursive: true });

  for (const file of MEMORY_FILES) {
    const filePath = resolve(memoryDir, file);
    if (!existsSync(filePath)) {
      const title = file.replace('.md', '').replace(/-/g, ' ');
      writeFileSync(filePath, `# ${title.charAt(0).toUpperCase() + title.slice(1)}\n\n> 由 dev-flow Research 阶段自动填充\n\n`, 'utf-8');
    }
  }

  // 创建 .gitkeep 防止空目录被 git 忽略
  const gitkeep = resolve(sessionsDir, '.gitkeep');
  if (!existsSync(gitkeep)) {
    writeFileSync(gitkeep, '', 'utf-8');
  }

  console.log(`✅ 记忆目录: .dev-flow/memory/`);
}

// CLI 解析
const args = process.argv.slice(2);
const target = args[0] || 'all';

install(target);
