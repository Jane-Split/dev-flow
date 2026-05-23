# dev-flow 设计文档

> AI编程工具全流程开发自动化Agent技能系统

## 1. 项目概述

### 1.1 项目名称
dev-flow

### 1.2 项目定位
一个可在Cursor、Trae、Qoder、Claude Code等AI编程工具中通过`/`命令方式使用的Agent技能系统，覆盖从项目调研到测试修复的完整开发流程。

**核心设计理念**：采用 **Prompt引导模式**，AI工具读取 `SKILL.md` 后按照指引自行执行各阶段任务，CLI 主要负责安装、记忆管理和环境检测。

### 1.3 核心能力
- **项目深度调研**：全面扫描项目，持久化项目架构、结构、规范、组件、样式、关键方法/接口等信息
- **需求分析**：结合项目记忆，准确理解需求文档
- **详细设计**：结合项目信息和需求，生成可执行的技术设计文档
- **任务拆分**：智能拆分开发任务，处理依赖关系和上下文限制
- **多Agent并行开发**：主Agent协调多个专家SubAgent并行执行任务
- **测试体系**：生成测试用例、执行测试（含浏览器测试）、生成报告、修复Bug、回归测试
- **长期记忆与学习**：持久化项目知识，越用越智能
- **一键安装**：支持npx全局安装和项目级安装
- **多工具适配**：同时支持 Cursor、Trae、Qoder、Claude Code

### 1.4 目标平台
AI编程工具插件（Cursor、Trae、Qoder、Claude Code等），通过npx安装，在AI编程工具输入框用`/dev-flow`命令调用。

### 1.5 技术选型
- **运行时**：Node.js
- **语言**：TypeScript
- **包管理**：npm（支持npx）
- **本地数据库**：SQLite（向量索引 + 敏感数据）
- **文件存储**：YAML / JSON / Markdown（项目记忆）
- **浏览器自动化**：Playwright（前端测试）

---

## 2. 架构设计

### 2.1 整体架构：分层流水线

```
┌─────────────────────────────────────────────────────────────┐
│                    用户交互层 (/命令)                         │
│   /dev-flow <需求> | /dev-flow -<阶段> [--refresh]           │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    技能定义层 (SKILL.md)                      │
│  AI工具读取 SKILL.md，按照指引执行各阶段任务                    │
│  包含：阶段说明、记忆系统、输出格式、上下文控制策略              │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    编排层 (Orchestrator / 主Agent)           │
│  任务调度 | 依赖管理 | 进度追踪 | 上下文分发 | 阶段协调        │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌───────────┬───────────┬───────────┬───────────┬─────────────┐
│ 项目调研  │ 需求分析  │ 架构设计  │ 开发执行  │   测试验证   │
│  Agent   │  Agent   │  Agent   │  Agent   │    Agent    │
└───────────┴───────────┴───────────┴───────────┴─────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    专家SubAgent池                            │
│  前端专家 | 后端专家 | 数据库专家 | 测试专家 | DevOps专家 ...  │
│  流程专家 | 技术栈专家 | 动态生成专家 ...                      │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    记忆存储层                                │
│  .dev-flow/memory/ (文件)  +  .dev-flow/db/memory.db (SQLite)│
└─────────────────────────────────────────────────────────────┘
```

### 2.2 工作模式：Prompt引导模式

```
用户输入: /dev-flow 实现登录功能
    ↓
AI工具读取: SKILL.md（或对应的技能文件）
    ↓
AI解析: 识别为全流程模式
    ↓
AI执行: 按照 SKILL.md 中的阶段指引逐步执行
    ├── Research: 扫描项目 → 写入记忆
    ├── Analyze: 解析需求 → 关联记忆 → 生成文档
    ├── Design: 设计方案 → 生成设计文档
    ├── Plan: 拆分任务 → 生成任务列表
    ├── Develop: 执行开发 → 生成代码
    ├── Test: 执行测试 → 生成报告
    └── Fix: 修复Bug → 回归测试
    ↓
每个阶段完成后: 等待用户确认
```

### 2.3 架构原则
- **Prompt驱动**：AI通过读取技能文件获取执行指引，而非依赖CLI调用
- **分层解耦**：每层独立可测试、可替换
- **记忆驱动**：所有阶段基于项目记忆工作
- **任务分片**：大任务拆分为小任务，每个任务独立执行，解决上下文限制
- **并行执行**：无依赖的任务并行执行，提升效率
- **学习驱动**：每个阶段完成后自动学习，持续优化

---

## 3. 命令系统

### 3.1 命令格式

| 命令 | 功能 | 示例 |
|------|------|------|
| `/dev-flow <需求>` | **全流程模式**：自动执行所有阶段，每阶段等待用户确认产物后继续 | `/dev-flow 实现用户登录功能` |
| `/dev-flow -<阶段>` | **单阶段模式**：手动执行指定阶段 | `/dev-flow -research` |
| `/dev-flow -<阶段> --refresh` | **刷新模式**：重新执行某阶段并更新记忆 | `/dev-flow -research --refresh` |

### 3.2 阶段列表

| 阶段名称 | 功能 | 输出产物 |
|----------|------|----------|
| `research` | 项目深度调研 | 项目记忆报告 |
| `analyze` | 需求分析 | 需求理解文档 |
| `design` | 详细设计 | 设计文档 |
| `plan` | 任务拆分 | 开发计划（任务树） |
| `develop` | 开发执行 | 代码变更 |
| `test` | 测试验证 | 测试报告 |
| `fix` | Bug修复 | 修复记录 |

### 3.3 全流程执行机制

```
/dev-flow 实现用户登录功能
    ↓
阶段1: research → 输出调研报告 → [用户确认] → 继续
    ↓
阶段2: analyze → 输出需求理解文档 → [用户确认] → 继续
    ↓
阶段3: design → 输出设计文档 → [用户确认] → 继续
    ↓
阶段4: plan → 输出开发计划 → [用户确认] → 继续
    ↓
阶段5: develop → 输出代码变更 → [用户确认] → 继续
    ↓
阶段6: test → 输出测试报告 → [用户确认] → 继续
    ↓
阶段7: fix (如需) → 输出修复记录 → [用户确认] → 完成
```

每个阶段完成后自动触发学习，更新项目记忆。

---

## 4. 技能定义系统

### 4.1 核心技能文件：SKILL.md

`SKILL.md` 是整个系统的核心，AI工具读取后按照其中的指引执行各阶段任务。

**文件位置**：项目根目录 `dev-flow/SKILL.md`

**核心内容结构**：

```markdown
---
name: dev-flow
description: AI开发全流程自动化Agent技能系统
---

# dev-flow

## 描述
[技能功能描述]

## 使用场景
[触发条件]

## 命令格式
[命令语法说明]

## 阶段说明
### Research 阶段
- 输入、输出、行为

### Analyze 阶段
- 输入、输出、行为

... (其他阶段)

## 记忆系统
[.dev-flow/memory/ 的作用和结构]

## 输出格式
[各阶段产物的格式要求]

## 上下文控制策略
[如何处理 token 限制]

## 学习机制
[如何从反馈中改进]
```

### 4.2 多工具适配

不同AI工具使用不同的技能文件格式，安装时自动适配：

| AI工具 | 技能文件位置 | 格式特点 |
|--------|-------------|---------|
| **Trae** | `.trae/skills/dev-flow/SKILL.md` | YAML frontmatter + Markdown |
| **Cursor** | `.cursor/commands/dev-flow.md` | 纯 Markdown（文件名=命令名） |
| **Claude Code** | `.claude/commands/dev-flow.md` | Markdown + `$ARGUMENTS` 占位符 |
| **Qoder** | `.qoder/commands/dev-flow.md` | YAML frontmatter + Markdown |

### 4.3 skill-templates 目录结构

```
dev-flow/
├── SKILL.md                          # 核心技能定义（项目根目录）
└── skill-templates/                  # 各工具的技能适配文件
    ├── trae/
    │   └── SKILL.md                  # Trae 格式
    ├── cursor/
    │   └── dev-flow.md               # Cursor 格式
    ├── claude/
    │   └── dev-flow.md               # Claude Code 格式
    └── qoder/
        └── dev-flow.md               # Qoder 格式
```

### 4.4 安装后目标项目结构

执行 `npx dev-flow install` 后，目标项目会新增：

```
目标项目/
├── .dev-flow/                        # dev-flow 工作目录
│   ├── config.yaml
│   ├── memory/                       # 项目记忆
│   ├── db/memory.db
│   └── sessions/
│
├── .trae/skills/dev-flow/            # Trae 技能（如检测到 Trae）
│   └── SKILL.md
│
├── .cursor/commands/dev-flow.md       # Cursor 自定义命令（如检测到 Cursor）
│
├── .claude/commands/dev-flow.md       # Claude Code 自定义命令（如检测到 Claude）
│
└── .qoder/commands/dev-flow.md        # Qoder 自定义命令（如检测到 Qoder）
```

---

## 5. 项目记忆系统

### 5.1 存储结构

```
项目根目录/
├── .dev-flow/
│   ├── memory/                    # 项目记忆（文件存储，版本控制）
│   │   ├── project.yaml           # 项目元信息（技术栈、框架、依赖版本）
│   │   ├── architecture.md        # 架构文档（系统架构、模块划分、数据流）
│   │   ├── structure.json         # 目录结构（文件树、模块关系）
│   │   ├── conventions/           # 编码规范
│   │   │   ├── coding.md          # 编码规范
│   │   │   ├── naming.md          # 命名规范
│   │   │   └── git.md             # Git提交规范
│   │   ├── components/            # 组件库
│   │   │   ├── frontend.json      # 前端组件（名称、Props、Events、用法）
│   │   │   └── backend.json       # 后端组件
│   │   ├── apis/                  # 接口文档
│   │   │   ├── endpoints.json     # API端点（URL、Method、参数、响应）
│   │   │   └── models.json        # 数据模型
│   │   ├── utils/                 # 通用方法
│   │   │   ├── functions.json     # 通用函数（签名、功能、使用示例）
│   │   │   └── hooks.json         # 通用Hooks
│   │   ├── styles/                # 样式系统
│   │   │   ├── theme.json         # 主题配置
│   │   │   └── tokens.json        # 设计Token
│   │   └── patterns/              # 最佳实践模式（学习产出）
│   │       ├── learned.json       # 学习到的模式
│   │       └── feedback.json      # 用户反馈记录
│   │
│   ├── db/                        # 本地数据库
│   │   └── memory.db              # SQLite（向量索引 + 敏感数据）
│   │
│   ├── sessions/                  # 会话记录
│   │   └── YYYY-MM-DD-HH-MM/      # 按时间组织
│   │       ├── plan.md            # 开发计划
│   │       ├── design.md          # 设计文档
│   │       └── tests/             # 测试报告
│   │
│   └── config.yaml                # dev-flow配置文件
```

### 5.2 混合存储策略

| 数据类型 | 存储方式 | 原因 |
|----------|----------|------|
| 项目结构、规范、组件、API文档 | 文件（YAML/JSON/MD） | 版本控制、团队共享、人类可读 |
| API密钥、敏感配置 | SQLite加密存储 | 安全性 |
| 代码向量嵌入 | SQLite + 向量扩展 | 语义搜索能力 |
| 执行历史、反馈记录 | SQLite | 高效查询、统计分析 |

### 5.3 记忆更新时机

| 触发事件 | 更新内容 |
|----------|----------|
| 项目初始化 | 全量记忆创建 |
| 增量调研 | 仅更新变更相关的记忆模块 |
| 需求分析完成 | 更新需求相关的功能点记忆 |
| 设计完成 | 更新架构和组件记忆 |
| 开发完成 | 更新组件、API、方法记忆 |
| 测试完成 | 更新问题模式记忆 |
| 用户反馈 | 更新反馈记录和最佳实践 |

---

## 6. 项目深度调研模块（ResearchAgent）

### 6.1 调研模式

| 模式 | 触发方式 | 行为 |
|------|----------|------|
| 全量调研 | `/dev-flow -research` | 从零扫描整个项目，重建所有记忆 |
| 增量调研 | `/dev-flow -research --incremental` | 基于已有记忆，仅扫描变更部分 |
| 自动调研 | 全流程模式首次执行 | 自动判断是否需要全量/增量 |

### 6.2 调研流程

**Step 1: 环境检测**
- 检测包管理器（npm/yarn/pnpm）
- 检测技术栈（框架、语言、构建工具）
- 检测AI编程工具类型（Cursor/Trae/Qoder/Claude Code）
- 检测已有.dev-flow目录

**Step 2: 项目结构扫描**
- 解析目录树（排除 node_modules/.git/dist 等）
- 识别项目分层（src/components/api/utils/pages...）
- 识别模块划分（features/modules/packages...）
- 提取入口文件和路由配置
- 输出: `structure.json`

**Step 3: 依赖与配置分析**
- 解析 package.json / pom.xml / requirements.txt 等
- 提取框架版本、核心依赖、开发依赖
- 解析构建配置（vite.config / webpack.config / tsconfig）
- 解析环境配置（.env / config files）
- 输出: `project.yaml`

**Step 4: 架构分析**
- 分析入口文件，推导系统架构模式
- 识别分层架构（MVC/整洁架构/微服务等）
- 分析模块间依赖关系
- 分析数据流向（请求→处理→响应）
- 分析状态管理方案
- 输出: `architecture.md`

**Step 5: 编码规范提取**
- 解析 ESLint/Prettier/Stylelint 配置
- 解析 tsconfig.json（strict模式等）
- 从代码中推断命名规范（文件名、变量名、函数名）
- 从代码中推断目录命名规范
- 从代码中推断注释/文档规范
- 从 Git 历史推断提交规范
- 输出: `conventions/*.md`

**Step 6: 组件库提取**
- 扫描前端组件文件（.vue/.tsx/.jsx）
- 提取组件名称、Props、Events、Slots
- 提取组件间引用关系
- 识别通用组件 vs 业务组件
- 提取组件使用示例
- 输出: `components/frontend.json`

**Step 7: 接口文档提取**
- 扫描后端路由文件
- 提取 API 端点（URL/Method/参数/响应）
- 扫描数据模型/类型定义
- 提取请求/响应数据结构
- 识别认证/鉴权方式
- 输出: `apis/endpoints.json`, `apis/models.json`

**Step 8: 通用方法提取**
- 扫描 utils/helpers/services/common 等目录
- 提取工具函数签名、功能描述、使用示例
- 扫描自定义 Hooks（useXxx）
- 提取中间件、拦截器、装饰器等
- 输出: `utils/functions.json`, `utils/hooks.json`

**Step 9: 样式系统提取**
- 解析主题配置文件
- 提取 CSS 变量 / Design Tokens
- 识别样式方案（CSS Modules/Tailwind/Styled Components）
- 提取全局样式和布局模式
- 输出: `styles/theme.json`, `styles/tokens.json`

**Step 10: 记忆持久化**
- 将所有提取结果写入 `.dev-flow/memory/`
- 构建向量索引存入 SQLite
- 生成调研摘要报告
- 触发学习：提取初始模式
- 输出: 调研报告呈现给用户

### 6.3 增量调研策略

1. 对比 Git diff，获取变更文件列表
2. 根据变更文件类型，决定需要更新的记忆模块：
   - 组件文件变更 → 更新 `components/`
   - 路由/API文件变更 → 更新 `apis/`
   - 工具函数变更 → 更新 `utils/`
   - 配置文件变更 → 更新 `project.yaml` / `conventions/`
   - 样式文件变更 → 更新 `styles/`
   - 新增目录/模块 → 更新 `structure.json` / `architecture.md`
3. 仅重新扫描受影响的模块，更新对应记忆文件

### 6.4 上下文控制策略

| 策略 | 说明 |
|------|------|
| 目录级分片 | 按目录逐个扫描，每个目录独立处理 |
| 优先级排序 | 先扫描核心目录（src/），再扫描配置和辅助目录 |
| 文件过滤 | 排除 node_modules、dist、.git、测试文件、资源文件 |
| 摘要提取 | 对大文件仅提取导出签名和关键注释，不读取完整内容 |
| 并行扫描 | 无依赖的目录可并行扫描 |

---

## 7. 需求分析模块（AnalyzeAgent）

### 7.1 输入

| 输入 | 来源 | 说明 |
|------|------|------|
| 需求描述/文档 | 用户提供的`/dev-flow <需求>`或文件路径 | 原始需求 |
| 项目记忆 | `.dev-flow/memory/` | 项目上下文 |
| 历史会话 | `.dev-flow/sessions/` | 之前的开发记录 |

### 7.2 分析流程

**Step 1: 需求获取与预处理**
- 接收需求（文本描述 / 文件路径 / URL）
- 如果是文件，读取并解析
- 提取需求中的关键信息：功能点、约束、优先级
- 识别需求类型（新功能/修改/重构/优化/修复）

**Step 2: 项目上下文关联**
- 从记忆中检索与需求相关的：
  - 现有功能（是否冲突/重叠/依赖）
  - 相关组件（可复用的组件）
  - 相关接口（需要修改/新增的API）
  - 相关数据模型（需要修改/新增的Model）
  - 编码规范（需遵守的规范）
- 标注需求对现有系统的影响范围

**Step 3: 需求结构化拆解**
- 将需求拆解为功能点列表
- 每个功能点定义：
  - 功能描述（用户故事格式）
  - 验收标准（Given-When-Then）
  - 优先级（P0/P1/P2）
  - 复杂度评估（高/中/低）
  - 依赖关系（依赖哪些现有功能）
- 识别隐含需求（安全性、性能、兼容性等）

**Step 4: 影响分析**
- 分析需求对现有系统的影响：
  - 需要修改的现有文件
  - 需要新增的文件
  - 需要修改的数据库表
  - 需要修改的API接口
  - 需要修改的配置
- 评估风险点（破坏性变更、兼容性问题等）

**Step 5: 歧义检测与确认**
- 检测需求中的模糊描述、矛盾点、缺失信息
- 生成待确认问题列表
- 如果有歧义，暂停并向用户提问
- 记录用户的补充说明

**Step 6: 生成需求理解文档**
- 汇总以上分析结果
- 生成结构化的需求理解文档
- 触发学习：记录需求模式和常见需求类型
- 呈现给用户确认

### 7.3 需求理解文档结构

```markdown
# 需求理解文档

## 1. 需求概述
- **原始需求**: [原始需求文本]
- **需求类型**: [新功能/修改/重构/优化/修复]
- **优先级**: [P0/P1/P2]

## 2. 功能点拆解
### 2.x [功能点名称] ([优先级], 复杂度: [高/中/低])
- **用户故事**: 作为[角色]，我希望[功能]，以便[价值]
- **验收标准**:
  - Given [前置条件]
  - When [操作]
  - Then [预期结果]
- **关联组件**: [已有组件列表]
- **关联API**: [已有/需新增的API]
- **关联Model**: [已有/需新增的Model]

## 3. 影响范围分析
| 类型 | 文件 | 操作 |
|------|------|------|
| 新增 | [文件路径] | [说明] |
| 修改 | [文件路径] | [说明] |

## 4. 技术约束
- [约束列表]

## 5. 风险点
- [风险列表]

## 6. 待确认问题
- [已确认/待确认的问题列表]
```

### 7.4 上下文控制策略

| 策略 | 说明 |
|------|------|
| 按功能点分片分析 | 每个功能点独立分析，避免一次性加载所有信息 |
| 精准记忆检索 | 根据需求关键词，仅检索相关的组件/API/模型记忆 |
| 增量确认 | 歧义检测时逐个提问，不一次性抛出所有问题 |
| 摘要优先 | 先生成需求概述，用户确认方向后再展开详细分析 |

---

## 8. 详细设计模块（DesignAgent）

### 8.1 输入

| 输入 | 来源 | 说明 |
|------|------|------|
| 需求理解文档 | AnalyzeAgent输出 | 结构化的需求分析结果 |
| 项目记忆 | `.dev-flow/memory/` | 项目架构、规范、组件、API等 |
| 学习模式 | `.dev-flow/memory/patterns/` | 历史最佳实践 |

### 8.2 设计流程

**Step 1: 设计上下文准备**
- 加载需求理解文档
- 检索相关项目记忆：
  - 架构模式（确保新设计符合现有架构）
  - 编码规范（确保设计符合项目规范）
  - 可复用组件/方法/接口
  - 历史类似功能的设计模式（从学习记忆中检索）

**Step 2: 整体方案设计**
- 确定功能模块划分
- 确定模块间交互方式
- 确定数据流向
- 确定状态管理方案
- 确定路由设计
- 确定与现有系统的集成点

**Step 3: 数据层设计**
- 设计/修改数据模型（TypeScript Interface / ORM Model）
- 设计数据库表结构（如涉及后端）
- 设计数据校验规则
- 设计数据转换/映射逻辑

**Step 4: 接口层设计**
- 设计 API 端点（URL / Method / 请求参数 / 响应格式）
- 设计接口鉴权方案
- 设计错误码和错误处理
- 设计接口版本策略
- 标注可复用的现有接口

**Step 5: 组件层设计**
- 设计页面组件树（Page → Section → Component → UI）
- 定义每个组件的职责、Props、Events、Slots
- 标注可复用的现有组件
- 设计新增组件的接口
- 设计组件间通信方式（Props / Context / Store / Event）

**Step 6: 业务逻辑设计**
- 设计核心业务流程（流程图/时序图描述）
- 设计状态管理（Store结构、Actions、Selectors）
- 设计副作用处理（API调用、路由跳转、事件监听）
- 设计错误处理策略
- 设计性能优化方案（缓存、懒加载、防抖节流等）

**Step 7: 样式设计**
- 确定使用的样式方案（与项目一致）
- 设计响应式布局方案
- 设计主题变量（如需新增）
- 设计动画/过渡效果

**Step 8: 设计自检**
- 检查设计是否符合项目现有架构模式
- 检查设计是否遵循项目编码规范
- 检查是否所有需求功能点都有对应的设计
- 检查是否最大化复用了现有组件/方法/接口
- 检查新增组件的Props/Events定义是否完整
- 检查API接口的请求/响应格式是否与项目现有风格一致
- 检查错误处理策略是否完善
- 检查是否考虑了边界情况和异常场景
- 检查性能方面是否有潜在问题
- 检查安全方面是否有潜在风险
- 标注不确定的设计决策，提交用户确认

**Step 9: 生成设计文档**
- 汇总以上设计结果
- 生成结构化的设计文档
- 触发学习：记录设计模式
- 呈现给用户确认

### 8.3 设计文档结构

```markdown
# 详细设计文档 - [功能名称]

## 1. 设计概述
- **需求来源**: 需求理解文档 - [功能名称]
- **设计范围**: [涉及的范围]
- **设计原则**: [复用现有组件、遵循项目规范、最小化改动等]

## 2. 整体方案
### 2.1 模块划分
[模块关系图]
### 2.2 数据流向
[数据流描述]
### 2.3 状态管理方案
[状态管理设计]

## 3. 数据层设计
### 3.1 类型定义
[TypeScript Interface / ORM Model]
### 3.2 数据校验规则
[校验规则表格]

## 4. 接口层设计
### 4.1 API 端点
[API端点表格]
### 4.2 请求/响应示例
[请求响应示例]
### 4.3 错误码定义
[错误码表格]

## 5. 组件层设计
### 5.1 组件树
[组件树结构]
### 5.2 新增组件定义
[每个组件的Props/Events/Slots定义]

## 6. 业务逻辑设计
### 6.1 核心流程
[流程描述]
### 6.2 Store 设计
[Store结构定义]
### 6.3 路由设计
[路由配置]

## 7. 样式设计
[样式方案描述]

## 8. 文件变更清单
| 操作 | 文件路径 | 说明 |
|------|----------|------|

## 9. 设计决策记录
| 决策 | 选择 | 原因 |
|------|------|------|

## 10. 待确认项
[待用户确认的设计决策]
```

### 8.4 上下文控制策略

| 策略 | 说明 |
|------|------|
| 按功能点分片设计 | 每个功能点独立生成设计，避免一次性设计所有功能 |
| 分层设计 | 数据层→接口层→组件层→业务逻辑层→样式层，逐层设计 |
| 复用优先 | 优先检索项目记忆中的可复用组件/方法，减少新设计量 |
| 模板驱动 | 使用设计文档模板，确保输出结构一致 |
| 自检清单 | 内置设计自检清单，确保设计质量 |

---

## 9. 任务拆分模块（PlanAgent）

### 9.1 拆分原则
- 每个任务独立可执行，输出明确的代码变更
- 任务粒度适中：单个任务可在一次AI上下文内完成
- 明确标注任务间依赖关系
- 无依赖的任务可并行执行
- 每个任务包含必要的上下文信息（相关记忆片段、依赖任务产物）

### 9.2 任务定义格式

```json
{
  "id": "task-001",
  "name": "创建用户数据模型",
  "description": "定义User相关的TypeScript类型和ORM模型",
  "type": "backend",
  "complexity": "low",
  "dependencies": [],
  "context": {
    "memoryKeys": ["apis/models.json", "conventions/coding.md"],
    "referenceFiles": ["src/types/index.ts"],
    "designSection": "3. 数据层设计"
  },
  "expert": "BackendExpert",
  "output": {
    "files": ["src/types/user.ts", "src/models/user.ts"],
    "verification": "TypeScript编译通过，类型定义完整"
  }
}
```

### 9.3 依赖管理
- 构建任务依赖图（DAG）
- 拓扑排序确定执行顺序
- 无依赖任务标记为可并行
- 依赖任务的产物作为后续任务的输入

---

## 10. 多Agent协作系统

### 10.1 Agent角色

**Orchestrator（主Agent）**
- 接收用户命令，解析意图
- 协调各阶段Agent执行
- 管理任务依赖和执行顺序
- 处理阶段间的数据传递
- 汇总结果并呈现给用户

**阶段Agent**

| Agent | 职责 | 输入 | 输出 |
|-------|------|------|------|
| ResearchAgent | 项目深度调研 | 项目目录 | 项目记忆报告 |
| AnalyzeAgent | 需求分析 | 需求文档 + 项目记忆 | 需求理解文档 |
| DesignAgent | 详细设计 | 需求理解 + 项目记忆 | 设计文档 |
| PlanAgent | 任务拆分 | 设计文档 + 项目记忆 | 开发计划（任务树） |
| DevelopAgent | 开发执行 | 任务 + 上下文 | 代码变更 |
| TestAgent | 测试验证 | 代码变更 + 测试范围 | 测试报告 |
| FixAgent | Bug修复 | 测试报告 + Bug列表 | 修复代码 |

**专家SubAgent**

| 类型 | 示例 | 触发条件 |
|------|------|----------|
| 技术领域专家 | FrontendExpert, BackendExpert, DBExpert, DevOpsExpert | 根据任务类型自动匹配 |
| 流程角色专家 | CodeReviewer, DocWriter, SecurityAuditor | 特定阶段需要时触发 |
| 技术栈专家 | ReactExpert, VueExpert, NodeExpert, PythonExpert | 根据项目技术栈动态创建 |
| 动态专家 | 根据任务特征实时生成 | 特殊需求时创建 |

### 10.2 任务分片与上下文管理

每个任务独立执行，上下文控制在模型限制内：
1. 根据任务类型，从记忆中检索相关片段
2. 加载必要的项目规范、组件、API文档
3. 加载依赖任务的产物
4. 控制上下文大小在模型限制内

### 10.3 并行执行机制

```
任务依赖图示例:
    Task A (无依赖)
       ↓
    Task B (依赖A)    Task C (依赖A)    ← 可并行
       ↓                   ↓
    Task D (依赖B)    Task E (依赖C)    ← 可并行
       ↓                   ↓
       └─────── Task F (依赖D, E) ───────┘

执行顺序:
  Step 1: Task A
  Step 2: Task B || Task C (并行)
  Step 3: Task D || Task E (并行)
  Step 4: Task F
```

### 10.4 开发自检机制

每个SubAgent完成任务后执行自检：
- 逻辑准确性：代码逻辑是否符合设计文档
- 完整性：功能是否全部实现，是否有遗漏
- 规范一致性：代码是否符合项目编码规范
- 类型安全：TypeScript类型是否正确
- 依赖正确性：import路径是否正确，依赖是否安装

---

## 11. 测试系统

### 11.1 测试类型

| 测试类型 | 工具/方式 | 执行者 |
|----------|-----------|--------|
| 前端页面测试 | Playwright + 浏览器自动化 | TestAgent |
| 后端接口测试 | Jest/Mocha + Supertest | TestAgent |
| 业务流程测试 | E2E测试 + 浏览器自动化 | TestAgent |
| 代码质量检查 | ESLint/TypeScript/Prettier/安全扫描 | TestAgent |

### 11.2 测试流程

1. **测试用例生成**：分析代码变更，识别测试点，结合项目记忆生成测试用例
2. **测试执行**：单元测试、接口测试、前端测试（浏览器自动化）、业务流程E2E测试
3. **测试报告**：通过/失败统计、错误详情、覆盖率报告、截图/录屏
4. **Bug修复**：分析失败原因，定位问题代码，生成修复方案，执行修复
5. **回归测试**：重新执行失败的测试用例，确认修复有效，生成最终报告

### 11.3 浏览器测试集成

- TestAgent启动测试服务器（npm run dev / npm start）
- 使用Playwright进行浏览器自动化
- 执行页面交互操作（点击、输入、滚动等）
- 验证页面状态和渲染结果
- 截图/录屏保存

### 11.4 测试报告格式

```markdown
# 测试报告 - [日期时间]

## 概览
- 总用例数: [N]
- 通过: [N]
- 失败: [N]
- 跳过: [N]
- 覆盖率: [N]%

## 失败用例详情
### [用例名称]
- **状态**: ❌ 失败
- **预期**: [预期结果]
- **实际**: [实际结果]
- **截图**: [screenshot.png]
- **定位**: [文件路径:行号]

## 建议
[修复建议列表]
```

---

## 12. 学习系统

### 12.1 学习类型

| 学习类型 | 触发时机 | 学习内容 | 存储位置 |
|----------|----------|----------|----------|
| 反馈学习 | 每次任务完成后 | 用户确认/修改、成功/失败模式 | `patterns/feedback.json` |
| 模式挖掘 | 阶段完成时 | 代码模式、最佳实践、常见问题 | `patterns/learned.json` |
| 规范学习 | 项目调研时 | 编码规范、命名规范、Git规范 | `conventions/` |

### 12.2 学习流程

1. **收集学习素材**：阶段产物（代码、文档、测试）、用户反馈、执行数据
2. **模式提取**：代码模式、流程模式、问题模式
3. **知识整合**：与现有知识库对比，去重、合并、更新，标记置信度
4. **记忆更新**：更新项目规范、添加新的最佳实践、更新向量索引

### 12.3 学习应用

在后续开发中：
- **检索相关模式**：根据当前任务，检索相似的历史模式
- **应用最佳实践**：在生成代码时应用已学习的模式
- **避免已知问题**：根据问题模式，主动预防常见错误
- **优化流程**：根据成功率高的流程模式，优化任务拆分

---

## 13. 安装分发系统

### 13.1 安装方式

```bash
# 项目级安装（推荐）
npx dev-flow install

# 全局安装
npx dev-flow install --global
```

### 13.2 安装流程

1. **检测环境**：检测AI编程工具类型（可能同时存在多个）、项目技术栈、包管理器
2. **创建目录结构**：创建 `.dev-flow/` 目录及子目录
3. **初始化配置**：生成 `config.yaml`、初始化 SQLite 数据库
4. **注册技能**：根据检测到的AI工具，复制对应的技能文件到目标项目
5. **完成提示**：显示安装成功信息和使用示例

### 13.3 多工具适配

| AI工具 | 检测方式 | 技能文件位置 |
|--------|----------|-------------|
| Cursor | 检测 `.cursor/` 目录 | `.cursor/commands/dev-flow.md` |
| Trae | 检测 `.trae/` 目录 | `.trae/skills/dev-flow/SKILL.md` |
| Claude Code | 检测 `.claude/` 目录 | `.claude/commands/dev-flow.md` |
| Qoder | 检测 `.qoder/` 目录 | `.qoder/commands/dev-flow.md` |

### 13.4 安装后验证

安装完成后，用户可以在AI编程工具中直接使用：

```
/dev-flow 实现用户登录功能
```

AI工具会自动读取对应的技能文件，按照指引执行开发流程。

---

## 14. 配置文件

### 14.1 config.yaml

```yaml
name: dev-flow
version: 1.0.0

# 项目配置
project:
  techStack: auto-detect
  conventions: auto-detect

# Agent配置
agents:
  maxParallel: 3
  timeout: 300000
  retryCount: 2

# 记忆配置
memory:
  autoLearn: true
  vectorSearch: true
  maxContextTokens: 100000

# 测试配置
test:
  browser: playwright
  unitTest: vitest
  coverage: true
```

---

## 15. 技术实现概要

### 15.1 项目结构

```
dev-flow/
├── package.json
├── tsconfig.json
├── SKILL.md                          # 核心：技能定义文件
├── bin/
│   └── dev-flow.js                   # CLI入口
├── src/
│   ├── index.ts                      # 主入口
│   ├── cli/
│   │   ├── commands.ts               # 命令解析
│   │   ├── installer.ts              # 安装逻辑
│   │   └── interactive.ts            # 交互式入口
│   ├── agents/
│   │   ├── base-agent.ts             # Agent基类
│   │   ├── research-agent.ts         # 调研Agent
│   │   ├── analyze-agent.ts          # 分析Agent
│   │   ├── design-agent.ts           # 设计Agent
│   │   ├── plan-agent.ts             # 计划Agent
│   │   ├── develop-agent.ts          # 开发Agent
│   │   ├── test-agent.ts             # 测试Agent
│   │   ├── fix-agent.ts              # 修复Agent
│   │   └── orchestrator.ts           # 主编排Agent
│   ├── scanners/
│   │   ├── structure-scanner.ts      # 结构扫描
│   │   ├── dependency-scanner.ts     # 依赖扫描
│   │   ├── convention-scanner.ts     # 规范扫描
│   │   ├── component-scanner.ts      # 组件扫描
│   │   ├── api-scanner.ts            # API扫描
│   │   └── util-scanner.ts           # 工具扫描
│   ├── analyzers/
│   │   ├── requirement-parser.ts     # 需求解析
│   │   ├── context-linker.ts         # 上下文关联
│   │   ├── impact-analyzer.ts        # 影响分析
│   │   └── ambiguity-detector.ts     # 歧义检测
│   ├── designers/
│   │   ├── data-designer.ts          # 数据层设计
│   │   ├── api-designer.ts           # 接口层设计
│   │   ├── component-designer.ts     # 组件层设计
│   │   ├── logic-designer.ts         # 业务逻辑设计
│   │   └── style-designer.ts         # 样式设计
│   ├── planner/
│   │   ├── task-splitter.ts          # 任务拆分
│   │   ├── dependency-graph.ts       # 依赖图
│   │   └── scheduler.ts              # 调度器
│   ├── experts/
│   │   ├── expert-registry.ts        # 专家注册表
│   │   ├── frontend-expert.ts        # 前端专家
│   │   ├── backend-expert.ts         # 后端专家
│   │   ├── db-expert.ts              # 数据库专家
│   │   └── dynamic-expert.ts         # 动态专家生成器
│   ├── testing/
│   │   ├── test-generator.ts         # 测试用例生成
│   │   ├── test-runner.ts            # 测试执行
│   │   ├── browser-tester.ts         # 浏览器测试
│   │   └── reporter.ts               # 报告生成
│   ├── learning/
│   │   ├── learner.ts                # 学习引擎
│   │   ├── pattern-extractor.ts      # 模式提取
│   │   └── feedback-collector.ts     # 反馈收集
│   ├── memory/
│   │   ├── memory-manager.ts         # 记忆管理器
│   │   ├── file-store.ts             # 文件存储
│   │   ├── db-store.ts               # SQLite存储
│   │   └── vector-index.ts           # 向量索引
│   └── utils/
│       ├── context-manager.ts        # 上下文管理
│       ├── file-scanner.ts           # 文件扫描
│       ├── logger.ts                 # 日志
│       └── fs-utils.ts               # 文件系统工具
├── templates/
│   ├── config.yaml                   # 配置模板
│   ├── design-doc.md                 # 设计文档模板
│   ├── requirement-doc.md            # 需求文档模板
│   └── test-report.md                # 测试报告模板
└── skill-templates/                  # 各工具的技能适配文件
    ├── trae/
    │   └── SKILL.md
    ├── cursor/
    │   └── dev-flow.md
    ├── claude/
    │   └── dev-flow.md
    └── qoder/
        └── dev-flow.md
```

### 15.2 核心依赖

| 依赖 | 用途 |
|------|------|
| commander | CLI命令解析 |
| better-sqlite3 | SQLite数据库 |
| playwright | 浏览器自动化测试 |
| glob | 文件匹配 |
| yaml | YAML解析 |
| chokidar | 文件监听 |
| chalk | 终端彩色输出 |
| ora | 终端加载动画 |
| inquirer | 交互式问答 |

---

## 16. 关键设计决策

### 16.1 为什么选择 Prompt引导模式

| 方案 | 优点 | 缺点 |
|------|------|------|
| **CLI调用模式** | 流程可控、易于调试 | AI与CLI交互复杂、用户体验差 |
| **Prompt引导模式** | AI自主执行、用户体验好、跨工具一致 | 调试困难、依赖AI理解能力 |
| **混合模式** | 灵活可控 | 实现复杂度高 |

选择 **Prompt引导模式** 的原因：
1. **用户体验**：用户只需输入 `/dev-flow <需求>`，AI自动执行全流程
2. **跨工具一致**：无论使用哪个AI工具，行为一致
3. **简化实现**：CLI只负责安装和记忆管理，核心逻辑在 SKILL.md 中

### 16.2 为什么需要 SKILL.md

1. **AI需要指引**：AI工具读取 SKILL.md 后才知道如何执行各阶段
2. **可定制**：用户可以根据项目特点修改 SKILL.md
3. **版本控制**：SKILL.md 可以随项目一起版本控制
4. **跨工具兼容**：不同AI工具读取同一个 SKILL.md（或适配版本）

### 16.3 上下文控制策略总结

| 策略 | 实现方式 |
|------|---------|
| 任务拆分 | 单个任务控制在 8000 tokens 以内 |
| 记忆检索 | 使用向量索引，限制 4000 tokens |
| 增量加载 | 按需加载任务相关上下文 |
| 摘要传递 | 阶段间传递关键摘要而非完整文档 |
| 目录级分片 | 按目录逐个扫描，每个目录独立处理 |
