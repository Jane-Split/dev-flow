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
  'patterns.md',
  'mistakes.md',
  'preferences.md',
  'decisions.md',
];

const MEMORY_TEMPLATES = {
  'project-overview.md': '# 项目概览\n\n> 由 dev-flow Research 阶段自动填充\n\n',
  'conventions.md': '# 编码规范\n\n> 由 dev-flow Research 阶段自动填充\n\n',
  'components.md': '# 已有组件\n\n> 由 dev-flow Research 阶段自动填充\n\n',
  'apis.md': '# 已有 API\n\n> 由 dev-flow Research 阶段自动填充\n\n',
  'models.md': '# 数据模型\n\n> 由 dev-flow Research 阶段自动填充\n\n',
  'utils.md': '# 工具函数\n\n> 由 dev-flow Research 阶段自动填充\n\n',
  'architecture.md': '# 架构决策\n\n> 由 dev-flow Research 阶段自动填充\n\n',
  'patterns.md': '# 常见代码模式\n\n> 由 dev-flow 自动学习积累\n\n## 使用说明\n记录项目中反复出现的代码模式，供后续开发复用。\n\n### 模式名称\n```typescript\n// 代码示例\n```\n- 使用场景：描述何时使用\n- 添加时间：YYYY-MM-DD\n- 使用次数：0\n',
  'mistakes.md': '# 常见错误及修复\n\n> 由 dev-flow 自动学习积累\n\n## 使用说明\n记录项目中反复出现的 Bug 及其修复方案。\n\n### 错误名称\n**错误模式**：描述错误代码\n**修复方案**：描述修复后的代码\n**出现次数**：0\n**最后出现**：YYYY-MM-DD\n**预防措施**：如何避免\n',
  'preferences.md': '# 用户偏好\n\n> 由 dev-flow 自动学习积累\n\n## 使用说明\n记录用户的编码偏好和习惯，让 AI 越用越懂用户。\n\n## 代码风格\n- 引号：单引号/双引号\n- 分号：必须/可选\n- 缩进：2空格/4空格/Tab\n\n## 架构偏好\n- 状态管理：\n- 样式方案：\n\n## 更新历史\n',
  'decisions.md': '# 架构决策记录\n\n> 由 dev-flow 自动记录\n\n## 使用说明\n记录项目中的重要架构决策及其原因。\n\n## ADR-XXX：决策标题\n**日期**：YYYY-MM-DD\n**决策**：描述决策内容\n**原因**：\n- 原因1\n- 原因2\n**影响**：影响的文件/模块\n'
};

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
      const content = MEMORY_TEMPLATES[file] || `# ${file.replace('.md', '').replace(/-/g, ' ')}\n\n> 由 dev-flow Research 阶段自动填充\n\n`;
      writeFileSync(filePath, content, 'utf-8');
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
