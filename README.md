# dev-flow

[![npm version](https://img.shields.io/npm/v/dev-flow.svg)](https://www.npmjs.com/package/dev-flow)
[![license](https://img.shields.io/npm/l/dev-flow.svg)](https://github.com/Jane-Split/dev-flow/blob/main/LICENSE)
[![node](https://img.shields.io/node/v/dev-flow.svg)](https://nodejs.org)

AI 开发全流程自动化 Agent 技能系统，支持 Cursor、Trae、Qoder、Claude Code 等 AI 编程工具。

通过 `/dev-flow` 命令，AI 将自动完成：**项目调研 → 需求分析 → 详细设计 → 任务拆分 → 多 Agent 并行开发 → 测试验证 → Bug 修复** 的完整开发周期。

## 特性

- 🧠 **项目记忆** - 自动记录项目架构、规范、组件、API，后续开发自动遵守
- 📋 **需求分析** - 深度理解需求，识别歧义和缺失信息
- 🎨 **详细设计** - 生成可执行的技术设计文档（数据/接口/组件/逻辑/样式）
- ✂️ **任务拆分** - 智能拆分任务，DAG 依赖分析，支持并行执行
- 👥 **多 Agent 执行** - 前端/后端/数据库/测试专家并行开发
- 🧪 **测试体系** - 自动生成并执行单元测试、API 测试、E2E 测试
- 📚 **学习能力** - 从用户反馈中学习，越用越智能
- 🔧 **多工具支持** - Cursor、Trae、Qoder、Claude Code

## 安装

### 方式一：npm 安装（推荐）

```bash
# 全局安装
npm install -g dev-flow

# 项目级安装
npm install --save-dev dev-flow
npx dev-flow install
```

### 方式二：通过 GitHub 安装

```bash
# npx 直接运行
npx Jane-Split/dev-flow

# 安装到项目
npm install Jane-Split/dev-flow --save-dev

# 指定版本/分支
npm install Jane-Split/dev-flow#v0.1.0 --save-dev

# 通过 SSH（私有仓库）
npm install git+ssh://git@github.com:Jane-Split/dev-flow.git --save-dev
```

### 方式三：从源码安装

```bash
git clone https://github.com/Jane-Split/dev-flow.git
cd dev-flow
npm install
npm run build
npm link
```

## 快速开始

```bash
# 1. 安装
npm install -g dev-flow

# 2. 在项目中初始化
cd your-project
dev-flow install

# 3. 在 AI 工具中使用
```

在 Cursor / Trae / Qoder / Claude Code 的输入框中输入：

```
/dev-flow 实现用户登录功能，包含表单验证和记住密码
```

AI 将按 7 个阶段逐步执行，每个阶段完成后等待你确认。

## 使用方法

### 全流程模式

```
/dev-flow <需求描述>
```

### 单阶段模式

```
/dev-flow -research          # 项目调研
/dev-flow -analyze <需求>    # 需求分析
/dev-flow -design            # 详细设计
/dev-flow -plan              # 任务拆分
/dev-flow -develop           # 开发执行
/dev-flow -test              # 测试验证
/dev-flow -fix               # Bug修复
/dev-flow -research --refresh  # 刷新项目记忆
```

### CLI 命令

```bash
dev-flow install              # 安装到当前项目
dev-flow run "需求描述"       # 执行全流程
dev-flow run -s research      # 执行指定阶段
dev-flow --help               # 查看帮助
```

## 支持的 AI 工具

| 工具 | 配置文件位置 | 安装命令 |
|------|-------------|---------|
| Cursor | `.cursor/commands/dev-flow.md` | `dev-flow install` |
| Trae | `.trae/skills/dev-flow.md` | `dev-flow install` |
| Qoder | `.qoder/commands/dev-flow.md` | `dev-flow install` |
| Claude Code | `.claude/commands/dev-flow.md` | `dev-flow install` |

手动安装到指定工具：

```bash
node node_modules/dev-flow/scripts/install.js cursor
node node_modules/dev-flow/scripts/install.js trae
node node_modules/dev-flow/scripts/install.js qoder
node node_modules/dev-flow/scripts/install.js claude
```

## 工作流程

```
Research → Analyze → Design → Plan → Develop → Test → Fix
  调研  →  分析  →  设计  →  拆分  →  开发  → 测试 → 修复
```

1. **Research** - 扫描项目结构、技术栈、编码规范、组件库、API
2. **Analyze** - 解析需求、关联记忆、识别歧义、评估影响
3. **Design** - 数据层、接口层、组件层、业务逻辑、样式设计
4. **Plan** - 任务拆分、依赖分析、DAG 排序、并行规划
5. **Develop** - 专家匹配、并行执行、代码自检
6. **Test** - 生成测试、执行测试、生成报告
7. **Fix** - 定位 Bug、生成修复、回归测试

## 项目结构

安装后创建的文件结构：

```
.dev-flow/
├── config.yaml          # 配置文件
├── memory/              # 项目记忆
│   ├── conventions/     # 编码规范
│   ├── components/      # 组件库
│   ├── apis/            # API 接口
│   ├── utils/           # 工具函数
│   ├── styles/          # 样式系统
│   └── patterns/        # 学习到的模式
├── db/                  # SQLite 数据库
└── sessions/            # 会话记录
```

## 配置

编辑 `.dev-flow/config.yaml`：

```yaml
agents:
  maxParallel: 3        # 最大并行任务数
  timeout: 300000       # 任务超时（毫秒）
  retryCount: 2         # 重试次数

memory:
  autoLearn: true       # 自动学习
  vectorSearch: true    # 向量搜索
  maxContextTokens: 100000

test:
  browser: playwright   # 浏览器测试工具
  unitTest: vitest      # 单元测试工具
  coverage: true        # 覆盖率检测
```

## 发布到 npm

如果你是开发者，想将 dev-flow 发布到 npm 供其他用户安装：

### 前置准备

1. 注册 [npm 账号](https://www.npmjs.com/signup)
2. 在终端登录 npm：

```bash
npm login
```

### 发布步骤

```bash
# 1. 确保代码已构建
npm run build

# 2. 检查 package.json 中的发布字段
# 确认以下字段正确：
#   "name": "dev-flow"           # 包名（全局唯一）
#   "version": "0.1.0"           # 版本号
#   "files": [...]               # 发布的文件列表
#   "bin": { "dev-flow": "..." } # CLI 命令

# 3. 预览将要发布的文件
npm pack --dry-run

# 4. 发布（公开包）
npm publish

# 5. 发布特定标签
npm publish --tag beta
npm publish --tag next
```

### 发布到 GitHub Packages

```bash
# 1. 在 package.json 中修改 name
# "name": "@Jane-Split/dev-flow"

# 2. 创建 .npmrc 文件
echo "@Jane-Split:registry=https://npm.pkg.github.com" > .npmrc

# 3. 发布
npm publish
```

### 发布后用户如何安装

发布到 npm 后，用户可以通过以下方式安装：

```bash
# npm 公开包
npm install -g dev-flow
npm install dev-flow --save-dev
npx dev-flow

# GitHub Packages
npm install @Jane-Split/dev-flow --save-dev

# 直接从 GitHub 仓库安装（无需发布到 npm）
npm install Jane-Split/dev-flow --save-dev
npx Jane-Split/dev-flow
```

### 版本管理

```bash
# 更新版本号
npm version patch   # 0.1.0 → 0.1.1（Bug 修复）
npm version minor   # 0.1.0 → 0.2.0（新功能）
npm version major   # 0.1.0 → 1.0.0（破坏性变更）

# 自动构建并发布
npm version patch && npm publish
```

## 开发

```bash
# 安装依赖
npm install

# 开发模式（监听文件变化）
npm run dev

# 构建
npm run build

# 运行测试
npm test

# 代码检查
npm run lint
```

## 文档

- [用户使用手册](./USER_GUIDE.md) - 完整的使用指南

## License

[MIT](./LICENSE)
