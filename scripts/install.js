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
  'modules.md',
  'apis.md',
  'models.md',
  'utils.md',
  'config.md',
  'architecture.md',
  'patterns.md',
  'mistakes.md',
  'preferences.md',
  'decisions.md',
];

const MEMORY_TEMPLATES = {
  'project-overview.md': `# 项目概览

> 由 dev-flow Research 阶段自动填充

## 技术栈
- 语言：
- 框架：
- 数据库：
- 测试：
- 构建：

## 目录结构

## 入口文件
`,
  'conventions.md': `# 编码规范

> 由 dev-flow Research 阶段自动填充

## 命名规范
- 类名：PascalCase
- 方法名/变量名：camelCase
- 常量：UPPER_SNAKE_CASE

## 代码风格
- 缩进：4 空格
- 最大行宽：120
- 导入组织：按包分组

## 注释规范
- 类注释：Javadoc 格式
- 方法注释：参数、返回值、异常说明
`,
  'modules.md': `# 已有模块

> 由 dev-flow Research 阶段自动填充

## Entity

## Mapper

## Service

## Controller

## DTO

## Enum
`,
  'apis.md': `# 已有 API

> 由 dev-flow Research 阶段自动填充

## 端点列表

`,
  'models.md': `# 数据模型

> 由 dev-flow Research 阶段自动填充

## Entity

## DTO

## 数据库表
`,
  'utils.md': `# 工具类/函数

> 由 dev-flow Research 阶段自动填充

`,
  'config.md': `# 配置信息

> 由 dev-flow Research 阶段自动填充

## 数据库配置

## Redis 配置

## 中间件配置
`,
  'architecture.md': `# 架构决策

> 由 dev-flow Research 阶段自动填充

`,
  'patterns.md': `# 常见代码模式

> 由 dev-flow 自动学习积累

## 使用说明
记录项目中反复出现的代码模式，供后续开发复用。

### 模式名称
\`\`\`java
// Java 代码示例
\`\`\`
- 使用场景：描述何时使用
- 添加时间：YYYY-MM-DD
- 使用次数：0
`,
  'mistakes.md': `# 常见错误及修复

> 由 dev-flow 自动学习积累

## 使用说明
记录项目中反复出现的 Bug 及其修复方案。

### 错误名称
**错误模式**：描述错误代码
**修复方案**：描述修复后的代码
**出现次数**：0
**最后出现**：YYYY-MM-DD
**预防措施**：如何避免
`,
  'preferences.md': `# 用户偏好

> 由 dev-flow 自动学习积累

## 使用说明
记录用户的编码偏好和习惯，让 AI 越用越懂用户。

## 代码风格
- 引号：单引号/双引号
- 分号：必须/可选
- 缩进：2空格/4空格/Tab

## 架构偏好
- 状态管理：
- 样式方案：

## 更新历史
`,
  'decisions.md': `# 架构决策记录

> 由 dev-flow 自动记录

## 使用说明
记录项目中的重要架构决策及其原因。

## ADR-XXX：决策标题
**日期**：YYYY-MM-DD
**决策**：描述决策内容
**原因**：
- 原因1
- 原因2
**影响**：影响的文件/模块
`
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
