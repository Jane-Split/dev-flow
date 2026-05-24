# dev-flow

[![license](https://img.shields.io/npm/l/dev-flow.svg)](https://github.com/Jane-Split/dev-flow/blob/main/LICENSE)
[![node](https://img.shields.io/node/v/dev-flow.svg)](https://nodejs.org)
[![test](https://img.shields.io/badge/test-94%2F94%20passing-brightgreen)](./COMPREHENSIVE_EVALUATION_REPORT.md)
[![score](https://img.shields.io/badge/evaluation-96%2F100-blue)](./COMPREHENSIVE_EVALUATION_REPORT.md)

AI 开发全流程自动化 Agent 技能系统，支持 Cursor、Trae、Qoder、Claude Code 等 AI 编程工具。

通过 `/dev-flow` 命令，AI 将自动完成：**架构决策 → 项目调研 → 需求分析 → 详细设计 → 任务拆分 → 多 Agent 并行开发 → 测试验证 → Bug 修复** 的完整开发周期，支持**老旧项目迁移**、**多语言项目**、**断点续传**和**进度可视化**。

> 📊 **最新评估**: 94项测试全部通过(100%)，五维度评分 **准确性98/稳定性96/效率94/可信度97/适配度96**，综合评分 **96/100**。详见 [COMPREHENSIVE_EVALUATION_REPORT.md](./COMPREHENSIVE_EVALUATION_REPORT.md)

## 特性

### 核心流程
- 🏗️ **架构决策** - 自动评估项目规模，生成技术选型、架构模式、分层设计和部署方案
- 🧠 **项目记忆** - 自动记录项目架构、规范、组件、API，后续开发自动遵守
- 📋 **需求分析** - 深度理解需求，识别歧义和缺失信息
- 🎨 **详细设计** - 生成可执行的技术设计文档（数据/接口/组件/逻辑/样式）
- ✂️ **任务拆分** - 智能拆分任务，DAG 依赖分析，支持并行执行
- 👥 **多 Agent 执行** - 前端/后端/数据库/测试/算法/Java/Python 专家并行开发
- 🧪 **测试体系** - 自动生成并执行单元测试、API 测试、E2E 测试（支持 Vitest/Jest/JUnit/pytest）
- 🔥 **紧急修复** - Hotfix 模式，快速定位并修复线上错误
- 💾 **断点续传** - 全流程自动保存会话状态，中断后可从断点恢复
- 📊 **进度可视化** - 实时生成 Markdown 进度报告，含进度条和阶段详情
- 📚 **学习能力** - 从用户反馈中学习，越用越智能
- 🔧 **多工具支持** - Cursor、Trae、Qoder、Claude Code
- 🖥️ **跨平台** - 纯 JavaScript 实现，无需 C++ 编译环境

### 🆕 老旧项目支持
- 🔍 **老旧项目分析** - 自动识别 10 种老旧技术栈（jQuery/AngularJS/PHP 5.x/Java 6-7/Python 2.x 等）
- 🔄 **渐进式迁移** - 支持 jQuery→React/Vue、AngularJS→Angular、PHP→Node.js 迁移
- 🛡️ **安全重构** - 嵌套深度分析、圈复杂度评估、技术债务识别
- 📋 **迁移模板** - 4 套完整迁移模板，含代码对照表和风险提示

### 🆕 多语言支持
- ☕ **Java/Spring Boot** - 生成 REST Controller、Service、JPA Entity（Java 17+ 特性）
- 🐍 **Python/FastAPI** - 生成 APIRouter 路由、Pydantic 模型、服务类（Python 3.10+ 特性）
- 🦀 **Go/Rust** - 技术栈识别和基础代码生成
- 🧪 **多语言测试** - 自动生成 JUnit 5（Java）、pytest（Python）、Vitest（TS）测试

## 安装

### 方式一：通过 GitHub 安装（推荐）

```bash
# 1. 安装到项目
npm install Jane-Split/dev-flow --save-dev

# 2. 执行安装（生成 skill 文件和配置）
npx dev-flow install
```

> **注意**：必须执行 `npx dev-flow install`，它会自动在项目中生成 `.trae/skills/`、`.cursor/commands/` 等 skill 文件。

### 方式二：从源码安装

```bash
git clone https://github.com/Jane-Split/dev-flow.git
cd dev-flow
npm install
npm run build
npm link
```

### 方式三：通过 SSH 安装（私有仓库）

```bash
npm install git+ssh://git@github.com:Jane-Split/dev-flow.git --save-dev
npx dev-flow install
```

## 快速开始

```bash
# 1. 进入你的项目
cd your-project

# 2. 安装 dev-flow
npm install Jane-Split/dev-flow --save-dev

# 3. 执行安装脚本
npx dev-flow install
```

安装完成后，在 Cursor / Trae / Qoder / Claude Code 的输入框中输入：

```
/dev-flow 实现用户登录功能，包含表单验证和记住密码
```

AI 将按阶段逐步执行，每个阶段完成后等待你确认。

## 使用方法

### 全流程模式

```
/dev-flow <需求描述>
```

### 断点续传

```
/dev-flow --resume              # 从上次中断的会话继续
```

### 单阶段模式

```
/dev-flow -architecture <需求>  # 架构决策（规模评估/技术选型/架构模式）
/dev-flow -research             # 项目调研
/dev-flow -analyze <需求>       # 需求分析
/dev-flow -design               # 详细设计
/dev-flow -plan                 # 任务拆分
/dev-flow -develop              # 开发执行（含算法/Java/Python专家）
/dev-flow -test                 # 测试验证
/dev-flow -fix                  # Bug修复
/dev-flow -hotfix <错误描述>    # 紧急修复（独立模式）
/dev-flow -research --refresh   # 刷新项目记忆
```

### 老旧项目模式

```
/dev-flow -legacy-analyze       # 分析老旧项目技术债务
/dev-flow -legacy-migrate       # 执行渐进式代码迁移
/dev-flow -legacy-refactor      # 安全重构老旧代码
```

### CLI 命令

```bash
npx dev-flow install             # 安装 skill 文件到当前项目
npx dev-flow run "需求描述"      # 执行全流程
npx dev-flow run -s research     # 执行指定阶段
npx dev-flow --help              # 查看帮助
```

## 工作流程

```
Architecture → Research → Analyze → Design → Plan → Develop → Test → Fix
   架构决策  →   调研  →  分析  →  设计  →  拆分  →  开发  → 测试 → 修复
                                                    ↕
                                              Hotfix（独立模式）

                              Legacy Analyze → Migrate → Refactor
                                老旧分析    →   迁移   →  重构
```

| 阶段 | 说明 | 产出 |
|------|------|------|
| **Architecture** | 评估项目规模，生成技术选型、架构模式、分层设计、部署方案 | 架构决策文档 |
| **Research** | 扫描项目结构、技术栈、编码规范、组件库、API | 项目记忆文件 |
| **Analyze** | 解析需求、关联记忆、识别歧义、评估影响 | 需求理解文档 |
| **Design** | 数据层、接口层、组件层、业务逻辑、样式设计 | 技术设计文档 |
| **Plan** | 任务拆分、依赖分析、DAG 排序、并行规划 | 任务列表 |
| **Develop** | 专家匹配（前端/后端/数据库/算法/Java/Python）、并行执行 | 代码文件 |
| **Test** | 生成测试、执行测试、生成报告 | 测试报告 |
| **Fix** | 定位 Bug、生成修复、回归测试 | 修复后的代码 |
| **Hotfix** | 解析错误类型、搜索文件、分析根因、生成修复方案 | 修复方案 + 验证步骤 |
| **Legacy Analyze** | 老旧技术栈识别、技术债务分析、迁移风险评估 | 分析报告 |
| **Legacy Migrate** | 渐进式代码迁移、迁移测试、迁移指南 | 迁移代码 + 文档 |
| **Legacy Refactor** | 安全重构、嵌套深度优化、圈复杂度降低 | 重构代码 |

### 专家 Agent 体系

| 专家 | 职责 | 支持语言 |
|------|------|----------|
| **FrontendExpert** | 组件开发、样式编写 | TypeScript/React/Vue/Angular |
| **BackendExpert** | API 开发、业务逻辑 | TypeScript/Node.js |
| **JavaExpert** | Spring Boot 开发 | Java 17+（Record/Sealed/Pattern Matching） |
| **PythonExpert** | FastAPI 开发 | Python 3.10+（Type Hints/Match-Case） |
| **DBExpert** | 数据库操作、数据模型 | SQL/ORM |
| **TestExpert** | 测试生成 | Vitest/Jest/JUnit 5/pytest |
| **AlgorithmExpert** | 算法实现 | TypeScript（21 种内置模板） |
| **LegacyExpert** | 老旧项目迁移 | jQuery→React/Vue, AngularJS→Angular, PHP→Node.js |

### 算法专家

当 Develop 阶段遇到算法任务时，自动匹配 AlgorithmExpert，从 21 个内置模板生成完整的 TypeScript 实现：

| 类别 | 模板 |
|------|------|
| 排序 | 冒泡排序、选择排序、插入排序、快速排序、归并排序、堆排序 |
| 搜索 | 线性搜索、二分搜索、BFS、DFS |
| 数据结构 | 链表、栈、队列、哈希表、二叉树 |
| 动态规划 | 斐波那契、0-1背包、最长公共子序列、最长递增子序列 |
| 其他 | 递归、全排列、N皇后、子集、组合、贪心 |

每个模板包含：完整实现 + 测试用例 + 时间/空间复杂度标注。

### 老旧项目支持

支持识别和迁移 10 种老旧技术栈：

| 老旧技术栈 | 迁移目标 | 支持程度 |
|-----------|----------|----------|
| jQuery | React / Vue | 完整迁移模板 |
| AngularJS 1.x | Angular 17+ | 完整迁移模板 |
| PHP 5.x | Node.js / PHP 8.x | 完整迁移模板 |
| Java 6/7 | Java 17+ | 完整迁移模板 |
| Python 2.x | Python 3.x | 完整迁移模板 |
| Backbone.js | React / Vue | 代码转换 |
| Knockout.js | React / Vue | 代码转换 |
| Gulp | 现代 Build 工具 | 识别和建议 |
| Grunt | 现代 Build 工具 | 识别和建议 |
| IE 兼容代码 | 现代浏览器标准 | 识别和建议 |

### 断点续传

全流程执行时自动保存会话状态到 `.dev-flow/sessions/{sessionId}.json`：

- 每个阶段完成后自动保存阶段结果
- 使用 `/dev-flow --resume` 从最近未完成的会话继续
- 自动跳过已完成的阶段

### 进度可视化

全流程自动生成 Markdown 进度报告，保存到 `.dev-flow/sessions/progress-{sessionId}.md`：

- 总进度百分比和进度条
- 各阶段状态（等待/执行中/完成/失败/跳过）和耗时
- 任务详情（状态/负责专家/产出文件）
- 产出文件清单

## 支持的 AI 工具

执行 `npx dev-flow install` 后，会自动在项目中生成以下 skill 文件：

| 工具 | 生成的文件 | 触发方式 |
|------|-----------|---------|
| Trae | `.trae/skills/dev-flow/SKILL.md` | 输入框输入 `/dev-flow` |
| Cursor | `.cursor/commands/dev-flow.md` | 输入框输入 `/dev-flow` |
| Qoder | `.qoder/commands/dev-flow.md` | 输入框输入 `/dev-flow` |
| Claude Code | `.claude/commands/dev-flow.md` | 输入框输入 `/dev-flow` |

手动安装到指定工具：

```bash
node node_modules/dev-flow/scripts/install.js all      # 安装到所有工具
node node_modules/dev-flow/scripts/install.js trae     # 仅安装到 Trae
node node_modules/dev-flow/scripts/install.js cursor   # 仅安装到 Cursor
```

## 安装后生成的文件结构

```
your-project/
├── .trae/skills/dev-flow/SKILL.md  # Trae skill 文件
├── .cursor/commands/dev-flow.md    # Cursor skill 文件
├── .qoder/commands/dev-flow.md     # Qoder skill 文件
├── .claude/commands/dev-flow.md    # Claude Code skill 文件
├── .dev-flow/                      # dev-flow 工作目录
│   ├── config.yaml                 # 配置文件
│   ├── memory/                     # 项目记忆
│   │   ├── conventions/            # 编码规范
│   │   ├── components/             # 组件库
│   │   ├── apis/                   # API 接口
│   │   ├── utils/                  # 工具函数
│   │   ├── styles/                 # 样式系统
│   │   ├── architecture/           # 架构决策记忆
│   │   └── patterns/               # 学习到的模式
│   ├── db/                         # SQLite 数据库
│   └── sessions/                   # 会话记录 + 进度报告
└── node_modules/dev-flow/          # dev-flow 包
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

## 技术栈

- **运行时**: Node.js >= 18
- **语言**: TypeScript
- **数据库**: sql.js (SQLite WebAssembly，无需原生编译)
- **测试**: Vitest + Playwright
- **CLI**: Commander.js

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
- [综合评估报告](./COMPREHENSIVE_EVALUATION_REPORT.md) - 五维度评分和测试详情
- [项目适配度报告](./PROJECT_ADAPTABILITY_REPORT.md) - 技术栈/阶段/类型适配度评估
- [改进计划](./IMPROVEMENT_PLAN.md) - 功能改进路线图

## 项目评估

| 维度 | 评分 | 说明 |
|------|------|------|
| 准确性 | 98/100 | 任务匹配100%，代码生成符合规范，技术栈识别准确 |
| 稳定性 | 96/100 | 空项目/错误处理/并发执行全部正常 |
| 效率 | 94/100 | 扫描<5秒，代码生成<1秒，内存增长<50MB |
| 可信度 | 97/100 | TypeScript零错误，94个测试全部通过 |
| 项目适配度 | 96/100 | Java/Python 95+，开发阶段100%，项目类型100% |
| **综合** | **96/100** | **94项测试全部通过(100%)** |

## License

[MIT](./LICENSE)
