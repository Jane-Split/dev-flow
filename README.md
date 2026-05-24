# dev-flow

[![license](https://img.shields.io/npm/l/dev-flow.svg)](https://github.com/Jane-Split/dev-flow/blob/main/LICENSE)
[![node](https://img.shields.io/node/v/dev-flow.svg)](https://nodejs.org)

AI 开发全流程编排 Skill，适用于 Cursor、Trae、Qoder、Claude Code 等 AI 编程工具。

通过 `/dev-flow` 命令，AI 将按照结构化流程逐步执行：**项目调研 → 需求分析 → 详细设计 → 代码开发 → 测试验证 → Bug 修复**，每个阶段完成后暂停等待确认，确保产出质量。

## 为什么需要 dev-flow？

AI 编程工具（Cursor/Trae/Qoder/Claude Code）虽然强大，但在处理复杂需求时容易：
- 跳过重要步骤（如先了解项目结构再写代码）
- 生成与项目风格不一致的代码
- 遗漏边界情况和错误处理
- 缺乏系统性的测试验证

dev-flow 通过**结构化的流程编排**解决这些问题，让 AI 编程工具按步骤、有组织地完成开发任务。

## 特性

- 📋 **结构化流程** - 6 个阶段 + Hotfix 模式，每个阶段有明确的输入/输出
- 🧠 **项目记忆** - 自动记录项目结构、组件、API、编码规范，后续开发自动遵守
- ✅ **阶段确认** - 每个阶段完成后暂停，展示成果并等待用户确认
- 🔄 **断点续传** - 长流程中断后可从上次断点恢复
- 📝 **Markdown 记忆** - 所有记忆使用 Markdown 格式，AI 可直接读写
- 🖥️ **多工具支持** - Cursor、Trae、Qoder、Claude Code
- ⚡ **零依赖** - 纯 Markdown + 安装脚本，无需编译

## 安装

```bash
# 1. 安装到项目
npm install Jane-Split/dev-flow --save-dev

# 2. 执行安装（生成 skill 文件和记忆目录）
npx dev-flow install
```

安装后会自动在项目中生成：

| 工具 | 生成的文件 | 触发方式 |
|------|-----------|---------|
| Trae | `.trae/skills/dev-flow/SKILL.md` | 输入框输入 `/dev-flow` |
| Cursor | `.cursor/commands/dev-flow.md` | 输入框输入 `/dev-flow` |
| Qoder | `.qoder/commands/dev-flow.md` | 输入框输入 `/dev-flow` |
| Claude Code | `.claude/commands/dev-flow.md` | 输入框输入 `/dev-flow` |

同时创建 `.dev-flow/memory/` 目录，包含 7 个 Markdown 记忆模板文件。

## 快速开始

```bash
# 1. 进入你的项目
cd your-project

# 2. 安装 dev-flow
npm install Jane-Split/dev-flow --save-dev
npx dev-flow install

# 3. 在 Cursor / Trae / Qoder / Claude Code 中输入：
/dev-flow 实现用户登录功能，包含表单验证和记住密码
```

AI 将按阶段逐步执行，每个阶段完成后等待你确认。

## 使用方法

### 全流程模式

```
/dev-flow <需求描述>
```

执行：Research → Analyze → Design → Develop → Test → Fix

### 单阶段模式

```
/dev-flow -research          # 项目调研
/dev-flow -analyze <需求>    # 需求分析
/dev-flow -design <需求>     # 详细设计
/dev-flow -develop <需求>    # 直接开发（跳过设计）
/dev-flow -test              # 生成测试并执行
/dev-flow -fix               # 分析并修复 Bug
/dev-flow -hotfix <错误信息> # 紧急修复
```

### 断点续传

```
/dev-flow --resume           # 从上次中断处继续
```

## 工作流程

```
Research → Analyze → Design → Develop → Test → Fix
  调研   →  分析  →  设计  →  开发  → 测试 → 修复

Hotfix（独立模式，随时可用）
```

| 阶段 | AI 做什么 | 产出 |
|------|----------|------|
| **Research** | 扫描项目文件、识别技术栈、提取编码规范、列出已有组件/API | `.dev-flow/memory/` 记忆文件 |
| **Analyze** | 解析需求、关联已有代码、识别歧义、评估影响 | 需求分析文档 |
| **Design** | 设计数据模型、API 接口、组件树、业务流程 | 设计文档 |
| **Develop** | 按依赖顺序生成完整可运行的代码 | 代码文件 |
| **Test** | 生成测试用例、执行测试、生成报告 | 测试报告 |
| **Fix** | 分析失败原因、修复代码、回归测试 | 修复后的代码 |

## 记忆系统

dev-flow 使用 `.dev-flow/memory/` 目录存储项目记忆，所有文件为 Markdown 格式：

```
.dev-flow/memory/
├── project-overview.md    # 项目概览（技术栈、架构、目录结构）
├── conventions.md         # 编码规范（命名、导入、注释）
├── components.md          # 已有组件列表
├── apis.md                # 已有 API 列表
├── models.md              # 数据模型列表
├── utils.md               # 工具函数列表
└── architecture.md        # 架构决策
```

**Research 阶段**自动填充这些文件，**Develop 阶段**自动读取并遵守。

## 代码生成规范

dev-flow 要求 AI 生成的代码必须：

- ✅ 完整可运行（禁止 `// TODO` 占位）
- ✅ 包含完整类型定义和错误处理
- ✅ 遵守项目已有的编码风格
- ✅ 复用已有组件和工具函数
- ✅ 包含 JSDoc 注释

## 项目结构

```
dev-flow/
├── skill-templates/       # Skill 文件模板
│   ├── trae/SKILL.md
│   ├── cursor/dev-flow.md
│   ├── qoder/dev-flow.md
│   └── claude/dev-flow.md
├── scripts/
│   └── install.js         # 安装脚本
├── SKILL.md               # 根目录 Skill 文件（备用）
├── README.md
└── package.json
```

## License

[MIT](./LICENSE)
