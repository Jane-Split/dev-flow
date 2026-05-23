# dev-flow 用户使用手册

> AI 开发全流程自动化 Agent 技能系统  
> 版本: v0.1.0 | 更新日期: 2026-05-23

---

## 目录

- [1. 简介](#1-简介)
- [2. 安装指南](#2-安装指南)
  - [2.1 环境要求](#21-环境要求)
  - [2.2 通过 npm 安装](#22-通过-npm-安装)
  - [2.3 通过 GitHub 安装](#23-通过-github-安装)
  - [2.4 项目级安装](#24-项目级安装)
  - [2.5 验证安装](#25-验证安装)
- [3. 快速开始](#3-快速开始)
  - [3.1 五分钟上手](#31-五分钟上手)
  - [3.2 命令一览](#32-命令一览)
- [4. AI 工具集成](#4-ai-工具集成)
  - [4.1 Cursor](#41-cursor)
  - [4.2 Trae](#42-trae)
  - [4.3 Qoder](#43-qoder)
  - [4.4 Claude Code](#44-claude-code)
- [5. 全流程详解](#5-全流程详解)
  - [5.1 Stage 1: Research 项目调研](#51-stage-1-research-项目调研)
  - [5.2 Stage 2: Analyze 需求分析](#52-stage-2-analyze-需求分析)
  - [5.3 Stage 3: Design 详细设计](#53-stage-3-design-详细设计)
  - [5.4 Stage 4: Plan 任务拆分](#54-stage-4-plan-任务拆分)
  - [5.5 Stage 5: Develop 开发执行](#55-stage-5-develop-开发执行)
  - [5.6 Stage 6: Test 测试验证](#56-stage-6-test-测试验证)
  - [5.7 Stage 7: Fix Bug 修复](#57-stage-7-fix-bug-修复)
- [6. 记忆系统](#6-记忆系统)
  - [6.1 记忆目录结构](#61-记忆目录结构)
  - [6.2 记忆的工作原理](#62-记忆的工作原理)
  - [6.3 记忆管理](#63-记忆管理)
- [7. 配置说明](#7-配置说明)
  - [7.1 配置文件](#71-配置文件)
  - [7.2 配置项详解](#72-配置项详解)
- [8. CLI 命令参考](#8-cli-命令参考)
- [9. 学习机制](#9-学习机制)
- [10. 上下文控制策略](#10-上下文控制策略)
- [11. 常见问题](#11-常见问题)
- [12. 最佳实践](#12-最佳实践)

---

## 1. 简介

**dev-flow** 是一个 AI 驱动的开发全流程自动化系统。它以 `/dev-flow` 命令的形式集成到 Cursor、Trae、Qoder、Claude Code 等 AI 编程工具中，覆盖从项目调研到代码交付的完整开发周期。

### 核心能力

| 能力 | 说明 |
|------|------|
| 项目调研 | 自动扫描项目结构、技术栈、编码规范、组件库、API 接口 |
| 需求分析 | 深度理解用户需求，识别歧义和缺失信息，评估影响范围 |
| 详细设计 | 生成数据层、接口层、组件层、业务逻辑层、样式层的完整技术设计 |
| 任务拆分 | 智能拆分为可执行任务，分析依赖关系，支持并行执行 |
| 多 Agent 开发 | 前端/后端/数据库/测试专家 Agent 并行开发，每个任务自检 |
| 测试验证 | 自动生成单元测试、API 测试、E2E 测试并执行 |
| Bug 修复 | 根据测试报告自动定位和修复 Bug，执行回归测试 |
| 持续学习 | 从用户反馈中学习代码模式，越用越智能 |

### 适用场景

- 新功能或模块开发
- 基于现有架构的功能增强
- 自动化测试生成与执行
- Bug 修复与回归测试
- 项目架构理解和文档生成

---

## 2. 安装指南

### 2.1 环境要求

| 依赖 | 最低版本 | 说明 |
|------|---------|------|
| Node.js | >= 18.0.0 | 运行环境 |
| npm | >= 8.0.0 | 包管理器 |
| AI 编程工具 | 最新版 | Cursor / Trae / Qoder / Claude Code 任选其一 |

### 2.2 通过 npm 安装

**全局安装**（推荐，所有项目通用）：

```bash
npm install -g dev-flow
```

安装后可在任意项目目录使用 `dev-flow` 命令。

**项目级安装**：

```bash
# 进入你的项目目录
cd your-project

# 安装为开发依赖
npm install --save-dev dev-flow

# 初始化 dev-flow 配置
npx dev-flow install
```

### 2.3 通过 GitHub 安装

如果你的代码托管在 GitHub，其他用户可以直接通过 GitHub URL 安装：

```bash
# 方式一：npx 直接运行（无需安装）
npx github-username/dev-flow

# 方式二：安装到项目
npm install github-username/dev-flow --save-dev

# 方式三：通过 git+ssh 安装（私有仓库）
npm install git+ssh://git@github.com:github-username/dev-flow.git --save-dev

# 方式四：指定分支或标签
npm install github-username/dev-flow#v0.1.0 --save-dev
npm install github-username/dev-flow#main --save-dev
```

> **注意**：请将 `github-username` 替换为你的 GitHub 用户名或组织名。

### 2.4 项目级安装

在项目中初始化 dev-flow：

```bash
# 方式一：使用 CLI 命令
npx dev-flow install

# 方式二：使用安装脚本
node node_modules/dev-flow/scripts/install.js all

# 方式三：仅安装到指定工具
node node_modules/dev-flow/scripts/install.js cursor
node node_modules/dev-flow/scripts/install.js trae
node node_modules/dev-flow/scripts/install.js qoder
node node_modules/dev-flow/scripts/install.js claude
```

安装完成后，会在项目中创建以下结构：

```
your-project/
├── .dev-flow/                    # dev-flow 工作目录
│   ├── config.yaml               # 配置文件
│   ├── memory/                   # 项目记忆
│   │   ├── conventions/          # 编码规范
│   │   ├── components/           # 组件库
│   │   ├── apis/                 # API 接口
│   │   ├── utils/                # 工具函数
│   │   ├── styles/               # 样式系统
│   │   └── patterns/             # 学习到的模式
│   ├── db/                       # SQLite 数据库
│   └── sessions/                 # 会话记录
├── .cursor/commands/dev-flow.md  # Cursor 技能（如已安装 Cursor）
├── .trae/skills/dev-flow.md      # Trae 技能（如已安装 Trae）
├── .qoder/commands/dev-flow.md   # Qoder 技能（如已安装 Qoder）
└── .claude/commands/dev-flow.md  # Claude Code 技能（如已安装 Claude Code）
```

### 2.5 验证安装

```bash
# 检查 CLI 是否可用
dev-flow --help

# 预期输出：
# Usage: dev-flow [options] [command]
#
# Commands:
#   install    安装 dev-flow 到当前项目
#   run        执行 dev-flow 全流程或指定阶段
#   help       显示帮助
```

---

## 3. 快速开始

### 3.1 五分钟上手

**第一步：安装**

```bash
npm install -g dev-flow
cd your-project
dev-flow install
```

**第二步：在 AI 工具中使用**

打开 Cursor / Trae / Qoder / Claude Code，在输入框中输入：

```
/dev-flow 实现用户登录功能，包含表单验证和记住密码
```

**第三步：跟随引导**

AI 会按 7 个阶段逐步执行，每个阶段完成后会等待你确认：

1. 调研项目 → 确认调研结果
2. 分析需求 → 确认需求理解
3. 生成设计 → 确认技术方案
4. 拆分任务 → 确认任务列表
5. 执行开发 → 确认代码变更
6. 运行测试 → 查看测试报告
7. 修复 Bug → 确认修复结果

### 3.2 命令一览

| 命令 | 说明 | 示例 |
|------|------|------|
| `/dev-flow <需求>` | 执行完整 7 阶段流程 | `/dev-flow 实现用户注册` |
| `/dev-flow -research` | 仅执行项目调研 | `/dev-flow -research` |
| `/dev-flow -analyze <需求>` | 仅执行需求分析 | `/dev-flow -analyze 添加搜索` |
| `/dev-flow -design` | 仅执行详细设计 | `/dev-flow -design` |
| `/dev-flow -plan` | 仅执行任务拆分 | `/dev-flow -plan` |
| `/dev-flow -develop` | 仅执行开发 | `/dev-flow -develop` |
| `/dev-flow -test` | 仅执行测试 | `/dev-flow -test` |
| `/dev-flow -fix` | 仅执行 Bug 修复 | `/dev-flow -fix` |
| `/dev-flow -research --refresh` | 刷新项目记忆 | `/dev-flow -research --refresh` |

---

## 4. AI 工具集成

### 4.1 Cursor

**安装方式**：

```bash
# 方式一：自动检测安装
dev-flow install

# 方式二：手动安装
node node_modules/dev-flow/scripts/install.js cursor
```

**使用方式**：

1. 打开 Cursor
2. 打开命令面板（`Cmd+Shift+P` / `Ctrl+Shift+P`）
3. 输入 `dev-flow` 或在聊天框中直接输入：
   ```
   /dev-flow 实现用户登录功能
   ```

**配置文件位置**：`.cursor/commands/dev-flow.md`

### 4.2 Trae

**安装方式**：

```bash
# 方式一：自动检测安装
dev-flow install

# 方式二：手动安装
node node_modules/dev-flow/scripts/install.js trae
```

**使用方式**：

1. 打开 Trae
2. 在输入框中输入：
   ```
   /dev-flow 实现用户登录功能
   ```

**配置文件位置**：`.trae/skills/dev-flow.md`

### 4.3 Qoder

**安装方式**：

```bash
# 方式一：自动检测安装
dev-flow install

# 方式二：手动安装
node node_modules/dev-flow/scripts/install.js qoder
```

**使用方式**：

1. 打开 Qoder
2. 在输入框中输入：
   ```
   /dev-flow 实现用户登录功能
   ```

**配置文件位置**：`.qoder/commands/dev-flow.md`

### 4.4 Claude Code

**安装方式**：

```bash
# 方式一：自动检测安装
dev-flow install

# 方式二：手动安装
node node_modules/dev-flow/scripts/install.js claude
```

**使用方式**：

1. 打开 Claude Code
2. 在输入框中输入：
   ```
   /dev-flow 实现用户登录功能
   ```

**配置文件位置**：`.claude/commands/dev-flow.md`

---

## 5. 全流程详解

### 5.1 Stage 1: Research 项目调研

**目的**：扫描项目，建立项目记忆，为后续阶段提供上下文。

**输入**：当前项目文件

**输出**：`.dev-flow/memory/` 下的记忆文件

**执行步骤**：

1. 扫描项目目录结构，识别入口文件
2. 检测技术栈和依赖（React/Vue/TypeScript 等）
3. 提取编码规范（ESLint 规则、TSConfig 配置、Prettier 配置）
4. 扫描组件库（提取 Props、Events、Slots 定义）
5. 扫描 API 接口（端点路径、请求/响应格式、数据模型）
6. 扫描工具函数和 Hooks
7. 扫描样式系统（主题变量、全局样式）
8. 将结果写入记忆系统

**何时使用**：

- 首次在项目中使用 dev-flow
- 项目架构发生重大变化后
- 使用 `--refresh` 参数强制刷新

```
/dev-flow -research
/dev-flow -research --refresh
```

### 5.2 Stage 2: Analyze 需求分析

**目的**：深度理解用户需求，识别歧义，评估影响范围。

**输入**：用户需求描述 + 项目记忆

**输出**：`.dev-flow/sessions/<id>/requirement-<timestamp>.md`

**执行步骤**：

1. 解析需求类型（新功能 / 功能增强 / 重构 / Bug 修复）
2. 设定优先级（P0 紧急 / P1 高 / P2 中 / P3 低）
3. 关联项目记忆（检索相关组件、API、规范）
4. 识别需求歧义和缺失信息
5. 评估影响范围（受影响文件、API 变更、数据模型变更）
6. 拆分功能点
7. 生成需求理解文档

**输出示例**：

```markdown
# 需求分析: 用户登录功能

## 需求概述
实现用户登录功能，包含邮箱/密码登录、表单验证、记住密码

## 需求类型
- [x] 新功能

## 关联记忆
- 组件: Button, Input, Modal
- API: 无相关接口
- 规范: TypeScript strict, ESLint recommended

## 影响范围
- 新增文件: src/pages/Login.tsx, src/api/auth.ts
- API 变更: POST /api/auth/login, POST /api/auth/logout
- 数据模型: LoginParams, LoginResult

## 歧义与问题
1. 是否需要第三方登录（微信/GitHub）？
2. 登录失败的最大重试次数？
```

```
/dev-flow -analyze 实现用户登录功能，包含表单验证和记住密码
```

### 5.3 Stage 3: Design 详细设计

**目的**：基于需求分析生成完整的技术设计文档。

**输入**：需求理解文档 + 项目记忆

**输出**：`.dev-flow/sessions/<id>/design-<timestamp>.md`

**执行步骤**：

1. **数据层设计**：定义数据模型、校验规则、类型接口
2. **接口层设计**：定义 API 端点、请求/响应格式、错误码、认证策略
3. **组件层设计**：定义组件树、Props 接口、事件定义
4. **业务逻辑设计**：定义业务流程、状态管理、数据流向
5. **样式设计**：定义主题变量、响应式布局、动画效果
6. **设计自检**：验证设计的完整性和一致性

```
/dev-flow -design
```

### 5.4 Stage 4: Plan 任务拆分

**目的**：将设计拆分为可执行的任务列表，处理依赖关系。

**输入**：设计文档 + 项目记忆

**输出**：`.dev-flow/sessions/<id>/plan-<timestamp>.md`

**执行步骤**：

1. 将设计拆分为可执行任务单元
2. 为每个任务标注类型（component / api / data / style / test）
3. 分析任务间的依赖关系
4. 构建依赖图（DAG 有向无环图）
5. 拓扑排序，划分执行层级
6. 标注可并行执行的任务组
7. 估算每个任务的 token 消耗

**输出示例**：

```
Level 0 (可并行): 
  - task-1: 创建 LoginParams 数据模型
  - task-2: 创建 LoginResult 数据模型
  - task-5: 实现 LoginPage 组件
  - task-6: 实现 LoginForm 组件

Level 1 (可并行):
  - task-3: 实现 POST /api/auth/login 接口
  - task-4: 实现 POST /api/auth/logout 接口
  - task-7: 创建 LoginPage 样式

Level 2 (串行):
  - task-8: 集成测试
```

```
/dev-flow -plan
```

### 5.5 Stage 5: Develop 开发执行

**目的**：按计划执行开发任务，多 Agent 并行编码。

**输入**：任务列表 + 项目记忆

**输出**：代码文件

**执行步骤**：

1. 按依赖层级顺序执行任务
2. 为每个任务匹配专家 Agent：
   - **FrontendExpert**：处理组件开发、样式编写
   - **BackendExpert**：处理 API 开发、数据模型
   - **DBExpert**：处理数据库操作
   - **TestExpert**：处理测试相关任务
   - **DynamicExpert**：处理动态/复杂任务
3. 同一层级的无依赖任务并行执行
4. 每个 Agent 完成后自检代码质量
5. 汇总所有变更

```
/dev-flow -develop
```

### 5.6 Stage 6: Test 测试验证

**目的**：自动生成测试用例并执行，验证代码质量。

**输入**：代码变更 + 设计文档

**输出**：`.dev-flow/sessions/<id>/test-report-<timestamp>.md`

**执行步骤**：

1. 根据完成的任务生成测试用例：
   - **组件测试**：渲染测试、交互测试
   - **API 测试**：请求/响应测试、错误处理测试
   - **模型测试**：类型校验测试
2. 写入测试文件到项目中
3. 执行测试（使用 Vitest）
4. 生成测试报告
5. 识别失败的测试用例，标记为 Bug

```
/dev-flow -test
```

### 5.7 Stage 7: Fix Bug 修复

**目的**：根据测试报告自动定位和修复 Bug。

**输入**：测试报告（包含 Bug 列表）

**输出**：修复后的代码

**执行步骤**：

1. 分析失败的测试用例
2. 定位 Bug 所在文件和代码行
3. 生成修复方案
4. 执行修复
5. 回归测试，确认修复有效

```
/dev-flow -fix
```

---

## 6. 记忆系统

### 6.1 记忆目录结构

```
.dev-flow/memory/
├── conventions/          # 编码规范
│   ├── eslint-rules.md   # ESLint 规则
│   ├── naming.md         # 命名规范
│   └── tsconfig.md       # TypeScript 配置
├── components/           # 组件库
│   ├── Button.md         # Button 组件文档
│   ├── Modal.md          # Modal 组件文档
│   └── ...               # 其他组件
├── apis/                 # API 接口
│   ├── user-api.md       # 用户相关 API
│   └── ...               # 其他 API
├── utils/                # 工具函数
│   ├── useAuth.md        # useAuth Hook
│   └── ...               # 其他工具
├── styles/               # 样式系统
│   ├── theme.md          # 主题变量
│   └── ...               # 其他样式
└── patterns/             # 学习到的模式
    └── learned.json      # 模式记录
```

### 6.2 记忆的工作原理

1. **自动采集**：Research 阶段自动扫描项目，提取信息写入记忆
2. **上下文注入**：每个阶段执行前，AI 自动读取相关记忆作为上下文
3. **向量索引**：使用 SQLite + 向量索引实现语义搜索，快速检索相关记忆
4. **持续更新**：每次执行后，新发现的组件/API/规范会更新到记忆中

### 6.3 记忆管理

```bash
# 刷新全部记忆
/dev-flow -research --refresh

# 手动编辑记忆
# 直接编辑 .dev-flow/memory/ 下的文件即可

# 清除记忆
rm -rf .dev-flow/memory/*
```

---

## 7. 配置说明

### 7.1 配置文件

配置文件位于 `.dev-flow/config.yaml`，安装时自动生成。

### 7.2 配置项详解

```yaml
name: dev-flow
version: 0.1.0

# 项目配置
project:
  techStack: auto-detect      # 技术栈检测（auto-detect / react / vue / angular）
  conventions: auto-detect    # 编码规范检测（auto-detect / strict / loose）

# Agent 配置
agents:
  maxParallel: 3              # 最大并行任务数（建议 2-5）
  timeout: 300000             # 单任务超时时间，单位毫秒（默认 5 分钟）
  retryCount: 2               # 失败重试次数

# 记忆配置
memory:
  autoLearn: true             # 是否自动学习用户反馈
  vectorSearch: true          # 是否启用向量搜索
  maxContextTokens: 100000    # 最大上下文 token 数

# 测试配置
test:
  browser: playwright         # 浏览器测试工具（playwright / puppeteer）
  unitTest: vitest            # 单元测试工具（vitest / jest）
  coverage: true              # 是否启用覆盖率检测
```

---

## 8. CLI 命令参考

```bash
# 查看帮助
dev-flow --help

# 查看版本
dev-flow --version

# 安装到当前项目
dev-flow install

# 全局安装
dev-flow install -g

# 执行完整流程
dev-flow run "实现用户登录功能"

# 执行指定阶段
dev-flow run -s research
dev-flow run -s analyze "实现用户登录功能"
dev-flow run -s design
dev-flow run -s plan
dev-flow run -s develop
dev-flow run -s test
dev-flow run -s fix

# 刷新模式
dev-flow run -s research --refresh

# 交互式模式（逐步引导）
dev-flow run
```

---

## 9. 学习机制

dev-flow 具备持续学习能力，会从你的使用过程中不断改进：

### 学习流程

```
用户确认/修改 → 模式提取 → 反馈收集 → 知识整合 → 后续应用
```

### 学习内容

| 学习类型 | 说明 | 示例 |
|----------|------|------|
| 代码模式 | 常见的代码结构和写法 | 状态管理模式、API 调用模式 |
| 命名规范 | 项目特定的命名习惯 | `use` 前缀的 Hook、`I` 前缀的接口 |
| 架构偏好 | 项目特定的架构选择 | 文件组织方式、目录命名规则 |
| 问题模式 | 常见的问题和解决方案 | 特定库的兼容性处理 |

### 配置

```yaml
memory:
  autoLearn: true    # 开启/关闭自动学习
```

---

## 10. 上下文控制策略

为避免超出 AI 工具的上下文窗口限制，dev-flow 采用以下策略：

| 策略 | 限制 | 说明 |
|------|------|------|
| 任务拆分 | 单任务 <= 8000 tokens | 超过限制自动拆分为子任务 |
| 记忆检索 | 每次检索 <= 4000 tokens | 使用向量索引检索最相关片段 |
| 增量加载 | 按需加载 | 开发阶段按任务加载相关上下文 |
| 摘要传递 | 阶段间传递摘要 | 阶段间传递关键摘要而非完整文档 |

---

## 11. 常见问题

### Q: 安装后 AI 工具中输入 `/dev-flow` 没有反应？

**A**: 请确认以下步骤：
1. 已执行 `dev-flow install` 或手动安装脚本
2. 对应工具的配置文件已生成（如 `.cursor/commands/dev-flow.md`）
3. 已重启 AI 编程工具

### Q: Research 阶段扫描不到组件/API？

**A**: 请确认：
1. 项目中存在 `package.json`
2. 组件和 API 文件使用了标准的文件命名和导出方式
3. 尝试使用 `--refresh` 参数重新扫描

### Q: 如何在已有项目中使用？

**A**: 直接在项目根目录执行 `dev-flow install`，然后使用 `/dev-flow` 命令即可。dev-flow 会自动适配已有项目结构。

### Q: 支持哪些编程语言？

**A**: 目前主要支持 TypeScript/JavaScript 项目（React、Vue、Node.js 等）。对其他语言的支持正在规划中。

### Q: 如何卸载？

**A**:
```bash
# 卸载全局安装
npm uninstall -g dev-flow

# 删除项目中的配置
rm -rf .dev-flow
rm -f .cursor/commands/dev-flow.md
rm -rf .trae/skills/dev-flow
rm -f .claude/commands/dev-flow.md
rm -f .qoder/commands/dev-flow.md
```

### Q: 生成的代码可以直接使用吗？

**A**: dev-flow 生成的代码遵循项目已有的编码规范和架构模式，但仍建议人工审查后再合并到主分支。

---

## 12. 最佳实践

1. **首次使用先调研**：在新项目中首次使用时，先执行 `/dev-flow -research` 建立项目记忆
2. **需求描述要清晰**：越详细的需求描述，越能产生准确的分析和设计
3. **逐阶段确认**：不要跳过确认步骤，及时发现和纠正偏差
4. **定期刷新记忆**：项目架构变化后，使用 `--refresh` 更新记忆
5. **保持编码规范**：dev-flow 会学习你的编码规范，保持项目风格一致
6. **善用单阶段模式**：不需要全流程时，可以单独使用某个阶段
7. **审查生成代码**：AI 生成的代码建议人工审查后再提交

---

## 许可证

MIT License
