# dev-flow 用户指南

## 目录

1. [概述](#1-概述)
2. [安装](#2-安装)
3. [快速上手](#3-快速上手)
4. [命令参考](#4-命令参考)
5. [阶段详解](#5-阶段详解)
   - [5.1 Research（项目调研）](#51-research项目调研)
   - [5.2 Clarify（需求澄清）](#52-clarify需求澄清)
   - [5.3 Analyze（需求分析）](#53-analyze需求分析)
   - [5.4 Design（详细设计）](#54-design详细设计)
   - [5.5 Task Split（智能任务拆分）](#55-task-split智能任务拆分)
   - [5.6 Develop（开发执行）](#56-develop开发执行)
   - [5.7 Test（统一测试）](#57-test统一测试)
   - [5.8 Fix（Bug 修复）](#58-fixbug-修复)
6. [Subagent 模式](#6-subagent%E6%A8%A1%E5%BC%8F)
   - [6.1 两种运行模式](#61-%E4%B8%A4%E7%A7%8D%E8%BF%90%E8%A1%8C%E6%A8%A1%E5%BC%8F)
   - [6.2 命令](#62-%E5%91%BD%E4%BB%A4)
   - [6.3 架构](#63-%E6%9E%B6%E6%9E%84)
   - [6.4 工作流程](#64-%E5%B7%A5%E4%BD%9C%E6%B5%81%E7%A8%8B)
   - [6.5 跨平台调度策略](#65-%E8%B7%A8%E5%B9%B3%E5%8F%B0%E8%B0%83%E5%BA%A6%E7%AD%96%E7%95%A5)
   - [6.6 任务拆分与依赖处理](#66-%E4%BB%BB%E5%8A%A1%E6%8B%86%E5%88%86%E4%B8%8E%E4%BE%9D%E8%B5%96%E5%A4%84%E7%90%86)
   - [6.7 方案C：子任务级设计与接口契约](#67-%E6%96%B9%E6%A1%88c%E5%AD%90%E4%BB%BB%E5%8A%A1%E7%BA%A7%E8%AE%BE%E8%AE%A1%E4%B8%8E%E6%8E%A5%E5%8F%A3%E5%A5%91%E7%BA%A6)
   - [6.8 精准按需加载](#68-%E7%B2%BE%E5%87%86%E6%8C%89%E9%9C%80%E5%8A%A0%E8%BD%BD)
7. [Hotfix 模式](#7-hotfix-%E6%A8%A1%E5%BC%8F)
8. [断点续传](#8-%E6%96%AD%E7%82%B9%E7%BB%AD%E4%BC%A0)
9. [记忆系统](#9-%E8%AE%B0%E5%BF%86%E7%B3%BB%E7%BB%9F)
10. [学习能力](#10-%E5%AD%A6%E4%B9%A0%E8%83%BD%E5%8A%9B)
11. [常见问题（FAQ）](#11-%E5%B8%B8%E8%A7%81%E9%97%AE%E9%A2%98faq)

---

## 1\. 概述

dev-flow 是一款为 Cursor、Trae、Qoder、Claude Code、OpenAI Codex 等 AI 编程工具打造的开发流程编排 Skill。

它遵循结构化的 **9 阶段工作流**（Research → Clarify → Analyze → Design → Task Split → Develop → Test → Fix（按需）→ Delivery），引导 AI 编程工具逐步执行开发任务，避免跳过步骤、代码生成不一致、遗漏边界情况等问题。

**核心特性**：

- 每个阶段完成后，输出**结构化确认检查清单**——下一阶段需逐项确认后才继续
- 自动记忆项目结构和编码规范，后续开发自动遵守
- 具备学习能力——越用越懂你的偏好
- **主 Agent 零编辑架构**：主 Agent 仅作为纯调度枢纽；所有文件操作由专门的阶段子代理执行
- **9 阶段工作流**：Research → Clarify → Analyze → Design → Task Split → Develop → Test → Fix（按需）→ Delivery
- **两种运行模式**：标准模式（串行子代理）/ 企业级模式（并行子代理）
- **两层门禁检查**：Gate-A（前置完整性）/ Gate-B（执行者审计）
- **LANGUAGE-ONLY 语言过滤**：构建时按项目类型过滤多语言规范，减少子代理上下文负担
- **阶段历史压缩**：每阶段确认后自动将对话历史压缩为结构化摘要，防止主 Agent 上下文溢出
- **Research 多子代理架构**：pre-scanner + 11 个文件级子代理分 4 批次
- **上下文自动注入**：子代理派发前自动收集完整上下文
- **结构化代码分段生成**：大文件自动启用"骨架 + 逐方法填充"
- **设计→代码逻辑回溯验证**：Step 4.3 强制 100% 覆盖率验证
- **设计契约多语言**：Java / TypeScript / Python / Go 接口契约
- **前后端分离架构（v3.7.0）**：Research 前后端分离扫描 + Develop 双专家域路由调度 + Task Split 域标签，支持纯前端/纯后端/全栈三种场景
- **Session 隔离（v3.4.0）**：基于需求简称的目录隔离，支持连续多个需求不覆盖文件

---

## 2\. 安装

### 2.1 前提条件

- Node.js >= 18.0.0
- 已安装以下 AI 编程工具中的至少一个：Cursor / Trae / Qoder / Claude Code / OpenAI Codex

### 2.2 安装步骤

```bash
# 1. 进入你的项目目录
cd your-project

# 2. 安装 dev-flow
npm install Jane-Split/dev-flow#release_3.7.0 --save-dev

# 3. 执行安装
npx dev-flow install
```

### 2.3 安装输出

安装完成后，项目中会新增以下文件：

```text
your-project/
├── .trae/skills/dev-flow/
│   ├── SKILL.md                           # Router（~10KB 骨架）
│   ├── stages/                            # 9 个阶段指令文件（按需加载）
│   │   ├── research.md
│   │   ├── clarify.md
│   │   ├── analyze.md
│   │   ├── design.md
│   │   ├── task-split.md
│   │   ├── develop.md                      # 包含代码完整性铁律 + 强制编译验证
│   │   ├── test.md                        # 统一测试阶段
│   │   ├── fix.md
│   │   ├── hotfix.md
│   │   └── delivery.md
│   ├── agents/                            # 20 个子代理定义
│   └── references/                        # 按需加载的参考文档
│       ├── protocol.md                    # 公共协议层
│       ├── memory-system.md              # 记忆系统详细规则
│       ├── learning-system.md            # 学习能力详细说明
│       ├── error-pattern-db.md          # 错误模式数据库
│       └── model-context-config.md      # 模型上下文配置
├── .cursor/
│   ├── commands/dev-flow.md             # Cursor Router
│   ├── stages/                            # 8 个阶段文件
│   ├── agents/
│   └── references/
├── .qoder/
│   ├── commands/dev-flow.md
│   ├── stages/
│   ├── agents/
│   └── references/
├── .claude/
│   ├── commands/dev-flow.md
│   ├── stages/
│   ├── agents/
│   └── references/
├── AGENTS.md                              # OpenAI Codex 项目指令
├── .agents/skills/dev-flow/SKILL.md       # OpenAI Codex 仓库级 Skill
├── .codex/
│   ├── config.toml
│   ├── agents/*.toml                      # Codex 自定义 Agent
│   └── references/
└── .dev-flow/
    ├── memory/                            # 长期记忆目录
    │   ├── project-overview.md
    │   ├── conventions.md
    │   ├── patterns.md                    # 代码模式（跨会话累积）
    │   ├── mistakes.md                   # 常见错误（跨会话累积）
    │   ├── preferences.md                # 用户偏好（跨会话累积）
    │   ├── decisions.md                 # 架构决策（跨会话累积）
    │   └── session/                       # 会话记忆（每次 Research 重建）
    │       ├── modules.md                 # 模块列表（每次 Research 重建）
    │       ├── apis.md
    │       ├── models.md
    │       ├── utils.md
    │       ├── config.md
    │       └── architecture.md
    ├── sessions/                           # 会话记录目录
    │   └── .gitkeep
    ├── session-index.yaml                  # 需求追溯索引（v3.4.0）
    ├── deliverables/                       # 人读取的阶段审批交付物
    │   └── {需求简称}/      # Session 隔离
    │       ├── 01-research-report.md
    │       ├── 02-clarification-report.md
    │       └── ...
    └── contracts/                         # 机器读取的结构化数据交换文件
        └── {需求简称}/      # Session 隔离（v3.4.0）
            ├── design-contract.yaml
            ├── task-breakdown.yaml
            └── ...
```

**注意**：`modules.md` 用于 Java 项目（记录 Entity/Mapper/Service/Controller/DTO/Enum），`components.md` 用于前端项目。安装脚本会根据项目类型自动创建对应文件。

### 2.4 仅为特定工具安装

如果你只使用一种 AI 编程工具，可以只安装对应的 Skill 文件：

```bash
npx dev-flow trae      # 仅安装到 Trae
npx dev-flow cursor    # 仅安装到 Cursor
npx dev-flow qoder     # 仅安装到 Qoder
npx dev-flow claude    # 仅安装到 Claude Code
npx dev-flow codex     # 仅安装到 OpenAI Codex
```

### 2.5 重新安装

如果记忆文件已存在，安装脚本会跳过它们，不会覆盖。要重新生成记忆文件，先删除 `.dev-flow/memory/` 目录：

```bash
rm -rf .dev-flow/memory
npx dev-flow install
```

---

## 3\. 快速上手

### 3.1 前端项目示例（React + TypeScript）

**场景**：在 React + TypeScript 项目中实现用户登录功能。

#### 步骤 1：安装

```bash
cd my-react-app
npm install Jane-Split/dev-flow#release_3.7.0 --save-dev
npx dev-flow install
```

#### 步骤 2：在 AI 编程工具中使用

打开 Cursor / Trae / Qoder / Claude Code，在输入框中输入：

```text
/dev-flow 实现用户登录功能，包含邮箱/密码登录、表单验证、记住密码
```

#### 步骤 3：跟随阶段确认

AI 会执行以下工作流，每个阶段完成后暂停等待你的确认：

1. **Research** → AI 扫描你的项目，展示技术栈、已有组件等 → 你确认
2. **Clarify** → AI 结合项目代码对需求进行迭代问答，消除歧义 → 你确认
3. **Analyze** → AI 分析需求，列出功能点和影响范围 → 你确认
4. **Design** → AI 设计数据模型、API、组件 → 你确认
5. **Task Split** → AI 将设计拆分为可并行的子任务，生成 DAG 依赖图 → 你确认
6. **Develop** → AI 按子任务并行生成完整、可运行的代码 → 你确认
7. **Test** → AI 生成并执行测试 → 你确认
8. **Fix** → 如果有测试失败，AI 自动修复（最多 3 轮）

### 3.2 Java 项目示例（Spring Boot + MyBatis-Plus）

**场景**：在 Spring Boot 微服务项目中实现订单管理功能。

#### 步骤 1：安装

```bash
cd my-java-service
npm install Jane-Split/dev-flow#release_3.7.0 --save-dev
npx dev-flow install
```

#### 步骤 2：在 AI 编程工具中使用

打开 Cursor / Trae / Qoder / Claude Code，在输入框中输入：

```text
/dev-flow 实现订单管理功能，包含订单创建、查询、取消，使用 MyBatis-Plus 进行数据库操作
```

#### 步骤 3：跟随阶段确认

AI 会执行适配 Java 项目特点的工作流：

1. **Research** → AI 扫描 `pom.xml`，识别 Spring Boot 版本、MyBatis-Plus、分层架构（Entity/Mapper/Service/Controller）→ 你确认
2. **Clarify** → AI 结合项目已有代码对需求进行迭代问答（如"订单实体是否复用已有 Order 类？"）→ 你确认
3. **Analyze** → AI 分析订单管理需求，列出功能点和影响范围 → 你确认
4. **Design** → AI 设计订单 Entity、Mapper 接口、Service 方法、Controller 接口、DTO → 你确认
5. **Task Split** → AI 将设计拆分为可并行的子任务（Entity → Mapper → Service → Controller → Test）→ 你确认
6. **Develop** → AI 按子任务逐层生成代码，遵守 MyBatis-Plus 规范 → 你确认
7. **Test** → AI 生成单元测试和集成测试，执行 `mvn test` → 你确认
8. **Fix** → 如果有测试失败，AI 自动修复（最多 3 轮）

---

## 4\. 命令参考

### 4.1 完整流程模式

```text
/dev-flow <需求描述>
```

执行：Research → Clarify → Analyze → Design → Task Split → Develop → Test → Fix（按需）→ Delivery

### 4.2 单阶段模式

| 命令 | 说明 | 适用场景 |
| --- | --- | --- |
| `/dev-flow -research` | 仅执行 Research 阶段 | 第一次使用 dev-flow，或项目结构有重大变化 |
| `/dev-flow -clarify <需求>` | 仅执行 Clarify 阶段（迭代问答） | 产品经理想完善需求文档，或开发前想澄清需求 |
| `/dev-flow -clarify @requirement.md` | 从文件读取需求并澄清 | 需求文档已写好，需要结合项目分析确认项 |
| `/dev-flow -analyze <需求>` | 仅执行 Analyze 阶段 | 需要先理解需求范围 |
| `/dev-flow -design <需求>` | 仅执行 Design 阶段 | 需要在开发前评审设计 |
| `/dev-flow -split <需求>` | 仅执行 Task Split 阶段（方案 C） | 需要将设计拆分为可并行子任务 |
| `/dev-flow -develop <需求>` | 直接开发（跳过设计和拆分） | 小型需求，无需详细设计 |
| `/dev-flow -test` | 统一测试（单元+冒烟+E2E+集成） | 已有代码，需要完整测试验证 |
| `/dev-flow -fix` | 分析并修复 Bug | 测试失败，需要修复 |
| `/dev-flow -hotfix <错误信息>` | 生产环境错误紧急热修复 | 生产报错，需要快速修复 |
| `/dev-flow -subagent <需求>` | 企业级并行子代理模式 | 复杂任务，涉及多服务/多模块 |

### 4.3 Session 隔离

```text
/dev-flow <需求描述>   # 第一个需求
/dev-flow <另一个需求>   # 第二个需求 —— 文件自动隔离
```

每个需求的交付物和契约分别存放在独立的 `{需求简称}` 目录下，防止文件覆盖，支持完整追溯。

**需求简称命名规则**：

- 从用户需求描述中提取核心名词短语（2-20 个字符）
- 允许中文、英文、数字、连字符、下划线
- 唯一性保证：已有同名需求则追加 `-2` 递增（如 `用户管理-2`）

**session-index.yaml** 追溯索引：

- 记录每个需求的 session-id、需求简称、状态、开始/完成时间、已完成的阶段
- 支持未来按需求精确追溯所有文档

### 4.4 记忆管理

| 命令 | 说明 |
| --- | --- |
| `/dev-flow -cleanup` | 清理会话记忆（`session/` 目录），保留长期记忆 |
| `/dev-flow -cleanup --all` | 重置所有记忆文件（谨慎使用） |

### 4.5 断点续传

| 命令 | 说明 |
| --- | --- |
| `/dev-flow --resume` | 从上次中断处继续 |

---

## 5\. 阶段详解

### 5.1 Research（项目调研）

**目标**：全面扫描项目结构、技术栈、依赖关系、编码规范，为后续阶段提供完整的项目上下文。

**执行步骤**：

1. **Phase 0：pre-scanner（全局快速扫描）**
   - 扫描项目目录结构
   - 识别技术栈（package.json / pom.xml / build.gradle）
   - 生成 `file-index.yaml`（\~15KB，无源码读取）
2. **Phase 0.5：前后端存在性检测（v3.7.0 新增）**
   - 自动识别项目类型（纯后端 / 纯前端 / 全栈）
   - 输出 `project-domains.yaml` + 分域索引文件
3. **后端扫描组**：11 个文件级子代理分 4 批次并行（与 v3.6.0 完全一致）
   - Batch 1（基础层，3 并行）：project-overview / service-registry / architecture
   - Batch 2（数据层，3 并行）：common-modules / models / config
   - Batch 3（行为层，3 并行）：apis / utils / conventions
   - Batch 4（横切层，2 并行）：dependency-graph / decisions
4. **前端扫描组**（v3.7.0 新增）：9 个文件级子代理分 3 批次并行
   - Batch 1（基础层，3 并行）：frontend-overview / frontend-structure / frontend-architecture
   - Batch 2（组件层，3 并行）：components / routes-and-state / frontend-config
   - Batch 3（行为层，3 并行）：frontend-apis / frontend-utils / frontend-conventions
5. **Smart Sampling 服务级独立采样**
   - 每个服务/模块独立执行采样
   - 关键类强制全量读取（Base/Abstract/Core/Common 类 + @Configuration/@Primary 注解类）
   - 公共模块强制全量扫描
6. **记忆完整性评级**
   - A/B/C/D 四级
   - 低于 B 级不允许进入 Analyze

**项目类型自动适配**：

| 项目类型 | 扫描策略 | Memory 目录 |
|----------|---------|------------|
| 纯后端 | 仅后端扫描组（11 子代理） | `backend/` + 共享根目录 |
| 纯前端 | 仅前端扫描组（9 子代理） | `frontend/` + 共享根目录 |
| 全栈 | 两组并行扫描（11+9 子代理） | `frontend/` + `backend/` + 共享根目录 |

**产出**：

- `.dev-flow/memory/` 13+ 文件（含 `frontend/` 和 `backend/` 子目录）
- `memory/_index/file-index.yaml`
- `.dev-flow/deliverables/{需求简称}/01-research-report.md`（阶段交付物）

---

### 5.2 Clarify（需求澄清）

**目标**：深度分析需求文档，结合项目上下文进行迭代问答，消除所有歧义和不确定性。

**触发条件**：
- 全流程模式（Research 确认后自动触发）
- 用户输入 `/dev-flow -clarify <需求>`
- 用户输入 `/dev-flow -clarify @requirement.md`

**可选性**：Clarify 是可选阶段，跳过后 Analyze 完整执行所有步骤，不削弱任何现有能力。

**执行步骤**：

1. **输入源识别与解析**（Step 0）
   - 支持文件路径（@xxx.md）、URL（飞书/Confluence）、产品需求模板、对话描述
   - 解析为结构化需求草稿（demand-draft.yaml）
2. **项目上下文关联分析**（Step 1）
   - 读取项目记忆（project-overview / service-registry / dependency-graph / common-modules / conventions / models / apis）
   - 10 个维度分析：Entity 复用、Service 复用、API 冲突、枚举复用、跨服务调用、公共模块变更、中间件依赖、数据权限、状态机、前端组件复用
3. **生成问题清单**（Step 2）
   - 三类问题：业务歧义（P0）、项目技术关联（P1）、业务规则确认（P2）
   - 一次性提交所有问题给用户
4. **用户回答收集与整合**（Step 3）
   - 支持逐项回复、全部确认、补充说明
5. **收敛检测**（Step 4）
   - 整合用户回答，重新分析是否产生新问题
   - 0 新问题 → 自动收敛
   - 有新问题且未达最大轮次(5) → 继续下一轮
   - 达到最大轮次 → 强制收敛，未解决问题使用默认假设
6. **生成澄清结果契约**（Step 5）
   - clarification-result.yaml（需求草稿 + 问答记录 + 澄清后需求 + 项目技术关联决策 + 未解决问题）
7. **生成阶段交付物**（Step 6）
   - 02-clarification-report.md

**产出**：

- `.dev-flow/contracts/{需求简称}/clarification-result.yaml`（澄清结果契约）
- `.dev-flow/contracts/{需求简称}/demand-draft.yaml`（需求草稿）
- `.dev-flow/deliverables/{需求简称}/02-clarification-report.md`（阶段交付物）

**独立使用场景**：

- 产品经理只想完善需求文档：`/dev-flow -clarify @产品需求.md`
- 开发前先澄清需求：`/dev-flow -clarify <需求>` 后再 `/dev-flow -analyze <需求>`

---

### 5.3 Analyze（需求分析）

**目标**：解析用户需求，关联已有代码，识别歧义点，输出结构化需求分析文档。

**执行步骤**：

1. 读取 Research 阶段产出的项目记忆
2. 解析用户需求描述
3. 关联已有代码和接口
4. 识别需求歧义点和不完整处
5. 输出需求分析文档
6. 生成阶段交付物

**产出**：

- 需求分析文档（包含功能点列表、影响范围、依赖分析、风险识别）
- `.dev-flow/contracts/{需求简称}/prd-contract.yaml`（PRD 契约）
- `.dev-flow/contracts/{需求简称}/test-case-contract.yaml`（测试用例契约）
- `.dev-flow/contracts/{需求简称}/runtime-contract.yaml`（运行时契约）
- `.dev-flow/deliverables/{需求简称}/PRD-{需求简称}.md`（阶段交付物）

---

### 5.4 Design（详细设计）

**目标**：基于需求分析结果，输出详细设计文档和 Design Contract。

**执行步骤**：

1. 读取需求分析文档
2. 设计数据模型（Entity / DTO / VO）
3. 设计 API 接口（RESTful / GraphQL）
4. 设计组件树（前端项目）或分层架构（Java 项目）
5. 设计业务流程和结构化决策表
6. 输出 Design Contract（多语言接口契约）
7. 生成阶段交付物

**产出**：

- `design-result.md`（详细设计文档）
- `design-contract.yaml`（设计契约，含多语言接口契约）
- `.dev-flow/deliverables/{需求简称}/03-design-result.md`（阶段交付物）

---

### 5.5 Task Split（智能任务拆分）

**目标**：将详细设计拆分为可并行的子任务，生成 DAG 依赖图，检测文件冲突，标记域标签。

**执行步骤**：

1. 读取 Design Contract
2. 拆分为子任务
3. 为每个任务标记 `domain: frontend | backend` 标签（v3.7.0 新增）
   - 前端标识：`.tsx/.jsx/.vue/.svelte/.css/.scss/.less` + `src/components/` / `src/pages/` / `src/views/`
   - 后端标识：`.java/.py/.go/.rs` + `src/main/java/` / `controller/` / `service/` / `mapper/`
4. 检测文件冲突（write-write / write-read / read-write）
5. 构建 DAG 依赖图
6. 双维度选择（并行度 vs 上下文占用）
7. 生成子任务级设计
8. 生成阶段交付物

**产出**：

- `task-breakdown.yaml`（任务拆分）
- `subtask-{id}-design.yaml`（子任务级设计）
- `interface-registry.yaml`（接口注册表）
- `.dev-flow/deliverables/{需求简称}/04-task-breakdown.md`（阶段交付物）

---

### 5.6 Develop（开发执行）

**目标**：按子任务生成完整、可运行的代码，遵循项目编码规范。

**域路由调度（v3.7.0 新增）**：

- 每个子任务根据 `domain` 标签自动路由到对应开发专家
- `domain: backend` → `backend-develop-expert`
- `domain: frontend` → `frontend-develop-expert`
- 前后端任务可并行执行（全栈项目）

**执行步骤**：

1. **读取上下文注入文件**（task-brief），如存在则跳过依赖扫描
2. **域路由调度**（v3.7.0 新增）
   - 读取任务 `domain` 标签
   - 路由到 `backend-develop-expert` 或 `frontend-develop-expert`
   - 前后端任务可并行派发
2. **代码生成规划与分段决策**（Step 0.5）
   - 预估输出量
   - 决策流程
   - 分段模式核心规则
3. **分段执行模式**（如启用）
   - Phase 0：代码架构规划
   - Phase 1：骨架生成
   - Phase 2：逐方法填充
   - Phase 3：全量验证
4. **业务代码优先铁律**
   - P0 业务代码必须先完成
   - P1 测试代码仅是验证手段
5. **强制编译验证**
   - Java：mvn compile
   - 前端：tsc --noEmit
   - 自动解析错误并修复（最多 3 轮）
6. **设计→代码逻辑回溯验证**（Step 4.3）
   - 从 design-contract.yaml 提取所有逻辑单元
   - 在代码中逐条定位实现
   - 计算覆盖率（必须 100%）
7. **自动产出校验**（validate-result.cjs）
   - 文件存在性+非空
   - TODO/FIXME 检测
   - 空方法体检测
   - log-only 方法体检测
   - return null 检测
   - Design Contract 方法签名一致性
8. **生成阶段交付物**

**产出**：

- 代码文件
- `logic-coverage-matrix.yaml`（逻辑覆盖率矩阵）
- `validation-report-{taskId}.yaml`（产出校验报告）
- `.dev-flow/deliverables/{需求简称}/05-develop-result.md`（阶段交付物）

---

### 5.7 Test（统一测试）

**目标**：执行完整的测试验证，包括单元测试、冒烟测试、E2E 测试、集成测试。

**执行步骤**：

1. 读取 Develop 阶段产出的代码
2. 执行单元测试
3. 执行冒烟测试
4. 执行 E2E 测试
5. 执行集成测试
6. 生成统一测试报告

**产出**：

- 测试代码
- 统一测试报告
- `.dev-flow/deliverables/{需求简称}/06-test-report.md`（阶段交付物）

---

### 5.8 Fix（Bug 修复）

**目标**：分析测试失败原因，修复代码，回归测试。

**执行步骤**：

1. 读取测试报告
2. 分析失败原因
3. 修复代码
4. 回归测试
5. 重复 3-4，最多 3 轮

**产出**：

- 修复后的代码
- `fix-report.md`（修复报告）
- `.dev-flow/deliverables/{需求简称}/07-fix-report.md`（阶段交付物）

---

## 6\. Subagent 模式

### 6.1 两种运行模式

dev-flow 提供两种子代理调度模式，适应不同规模的开发需求。

#### 6.1.1 模式对比

| 维度 | **标准模式**（默认） | **企业级模式**（并行调度） |
| --- | --- | --- |
| **触发命令** | `/dev-flow <需求描述>` | `/dev-flow -subagent <需求描述>` |
| **调度方式** | 串行：主 Agent 逐个创建子代理，一个完成后再启动下一个 | 并行：Task Split 后按 DAG 依赖图，同批次多个子代理同时执行 |
| **适用规模** | 中小型需求（< 20 个文件、单模块修改） | 大型需求（≥ 20 个文件、多服务/多模块并行） |
| **并行能力** | 无并行（但 Task Split 后动态重评估，满足条件可自动升级） | 完全并行（Trae / Cursor / Claude Code 原生并行；Qoder / Codex 模拟并行） |
| **上下文占用** | 低（一次只加载一个子代理上下文） | 中-高（同时加载多个子代理上下文，视平台并发上限） |
| **失败处理** | 即时发现、即时修复 | 同级子代理独立失败，不影响其他并行任务 |

> **核心原则**：无论哪种模式，主 Agent 始终是纯调度枢纽，绝不直接编辑任何文件。所有文件操作均由专业阶段子代理执行。区别仅在于子代理的创建方式——串行还是并行。

#### 6.1.2 工作流对比

```text
标准模式（/dev-flow <需求描述>）：
主 Agent → Research → Clarify → Analyze → Design → Task Split → [动态重评估]
  → Develop（串行：Subtask 1 → Subtask 2 → ... → Subtask N）
  → Test → Fix(按需) → Delivery

企业级模式（/dev-flow -subagent <需求描述>）：
主 Agent → Research → Clarify → Analyze → Design → Task Split → [DAG 批次并行]
  → Develop（并行：Batch 1 — Subtask A/B/C 同时执行）
  → Develop（并行：Batch 2 — Subtask D/E 同时执行，依赖 Batch 1）
  → Develop（串行：Subtask F，依赖 Batch 2，且存在写写冲突）
  → Test → Fix(按需) → Delivery
```

#### 6.1.3 选择建议

| 场景 | 推荐模式 | 原因 |
| --- | --- | --- |
| 初次使用 dev-flow | **标准模式** | 逐步体验完整流程，每阶段确认 |
| 中小需求（< 20 文件） | **标准模式** | Task Split 后可能自动升级，无需手动选择 |
| 大型需求（≥ 20 文件） | **企业级模式** | 并行大幅缩短总耗时 |
| 多服务/多模块需求 | **企业级模式** | 天然适合并行，各模块独立开发 |
| 存在写写冲突 | **标准模式**（自动降级） | 冲突任务必须串行处理 |
| 不确定选哪个 | **标准模式** | Task Split 后动态评估，自动通知是否适合升级 |

### 6.2 命令

| 命令 | 说明 |
| --- | --- |
| `/dev-flow -subagent <需求>` | 企业级并行子代理模式 |
| `/dev-flow -split <需求>` | 方案 C：子任务级设计与接口契约 |

### 6.3 架构

```text
用户 ←→ 主 Agent（纯调度枢纽，零编辑）
              │
              ├── [Research: pre-scanner + 前后端分离扫描]
              │     Phase 0: pre-scanner × 1          → file-index.yaml
              │     Phase 0.5: 前后端存在性检测        → project-domains.yaml
              │     后端扫描组 (11 子代理, 4 批次)
              │     ├── Batch 1（基础层，3 并行）→ project-overview / service-registry / architecture
              │     ├── Batch 2（数据层，3 并行）→ common-modules / models / config
              │     ├── Batch 3（行为层，3 并行）→ apis / utils / conventions
              │     └── Batch 4（横切层，2 并行）→ dependency-graph / decisions
              │     前端扫描组 (9 子代理, 3 批次)
              │     ├── Batch 1（基础层，3 并行）→ frontend-overview / frontend-structure / frontend-architecture
              │     ├── Batch 2（组件层，3 并行）→ components / routes-and-state / frontend-config
              │     └── Batch 3（行为层，3 并行）→ frontend-apis / frontend-utils / frontend-conventions
              ├── clarify-expert     → 需求澄清，迭代问答消除歧义
              ├── analyze-expert     → 需求分析
              ├── design-expert      → 详细设计
              ├── task-split-expert  → 任务拆分 + DAG + 域标签
              ├── backend-develop-expert  → 后端代码开发（可并行多个）
              ├── frontend-develop-expert → 前端代码开发（可并行多个）
              ├── test-expert        → 统一测试
              ├── fix-expert         → Bug 修复
              ├── delivery-expert    → 交付报告
              └── contract-validator → 契约校验 + 逻辑覆盖率验证（R5）
```

### 6.4 工作流程

1. **Task Split 阶段**：生成子任务列表和 DAG 依赖图
2. **模式动态重评估**：Task Split 后自动评估是否需要升级为并行模式
   - 任务数 > 5 → 升级
   - 写写冲突 > 0 → 升级（但冲突任务会串行化）
   - DAG 深度 > 3 → 升级
   - 批次 > 3 → 升级
3. **Develop 阶段**：按 DAG 顺序派发子代理
   - 标准模式：逐批次串行
   - 企业级模式：同批次并行
4. **验证链**：每个子代理完成后，执行验证链
   - Step 5.1：develop-expert 开发自检（Step 4.3 逻辑回溯）
   - Step 5.2：contract-validator 独立验证（R1-R5，R5 为阻塞级）
   - Step 5.3：verify-expert 质量检查（编译验证、代码质量）
5. **失败处理**：子代理失败触发三级失败处理协议
   - Level 1：自动重试（1 次，附加错误信息）
   - Level 2：诊断重试（1 次，输出诊断报告后调整重试）
   - Level 3：人工升级（停止一切自动化，输出升级报告等待用户决策）

### 6.5 跨平台调度策略

| 平台 | 子代理支持 | 并行能力 | Research 调度 | References 支持 |
| --- | --- | --- | --- | --- |
| **Trae** | `/agent-name` 斜杠命令 | 并行调度 | 12 并行 | ✅ |
| **Cursor** | Task 工具 | 并行调度 | 12 并行 | ✅ |
| **Claude Code** | Sub agent | 并行调度 | 12 并行 | ✅ |
| **Qoder** | 并行调度 | 并行调度 | 4 批次 | ✅ |
| **Codex** | `AGENTS.md` Agent | 有限并行 | 2 批次合并 | ✅ |

### 6.6 任务拆分与依赖处理

**DAG 依赖图**：

- 每个子任务定义 `dependencies:` 列表
- 使用 Kahn 算法进行拓扑排序
- 循环依赖检测：发现循环时立即报错退出

**文件冲突检测**：

- 3 种冲突类型：
  - write-write：两个任务写同一个文件 → 添加依赖
  - write-read：一个任务写，另一个读 → 添加依赖
  - read-write：一个任务读，另一个写 → 添加依赖
- 自动修复：write-read / read-write 冲突自动添加依赖并重新拓扑排序

**并行分组**：

- 无依赖关系的任务分为一组，并行执行
- 有依赖关系的任务按 DAG 顺序分批次执行

### 6.7 方案 C——子任务级设计与接口契约

**核心思想**：Design 输出全局契约（design-contract.yaml），Task Split 生成子任务级设计 + DAG 依赖图，确保每个子任务的接口定义清晰、无冲突。

**接口契约机制**：

- 跨子任务接口定义（serviceContracts / eventContracts / dataContracts）
- 契约冻结（stability: frozen），冻结后不允许任意修改
- 契约一致性校验：contract-validator R1-R5 规则

**子任务级设计**：

- 每个子任务有独立的 `subtask-{id}-design.yaml`
- 包含：任务描述、目标文件、依赖任务、接口定义、逻辑步骤

### 6.8 精准按需加载

**目标**：每个子代理仅加载所需的上下文，控制上下文消耗。

**实现**：

- **prepare-context.cjs**：子代理派发前自动收集上下文并生成 `task-brief-{taskId}.md`
  - 自动收集内容：任务信息（DAG）、子任务设计文档、Design Contract 相关定义、开发核心规则、编码规范、历史错误模式、父任务产出、依赖类定义
  - 最大 brief 大小：120KB（为子代理模型上下文预留充足空间）
- **LANGUAGE-ONLY 语言过滤**：构建时按项目类型过滤多语言规范
  - `--lang java` → develop-expert.md 31.6KB → 20.9KB（-10.7KB）
  - 无 `--lang` → 保留全部内容（向后兼容）

---

## 7\. Hotfix 模式

**目标**：生产环境报错时，快速定位问题并修复。

**命令**：

```text
/dev-flow -hotfix <错误信息>
```

**执行步骤**：

1. 读取错误信息
2. 定位问题代码
3. 分析根因
4. 生成修复方案
5. 执行修复
6. 验证修复（编译 + 单元测试）
7. 生成热修复报告

**产出**：

- 修复后的代码
- `hotfix-report.md`（热修复报告）
- `.dev-flow/deliverables/{需求简称}/hotfix-report.md`（阶段交付物）

---

## 8\. 断点续传

**目标**：从上次中断处继续，无需重复执行已完成的阶段。

**命令**：

```text
/dev-flow --resume
```

**工作原理**：

- 读取 `.dev-flow/sessions/` 中的最近会话记录
- 定位到最后完成的阶段
- 从该阶段的下一个阶段继续执行

**注意事项**：

- 仅恢复阶段执行状态，不恢复上下文
- 如果项目结构有重大变化，建议重新执行 Research 阶段

---

## 9\. 记忆系统

dev-flow 具备**项目记忆**能力，自动记录项目结构、技术栈、编码规范等信息，后续开发自动遵守。

### 9.1 记忆分类

| 类型 | 文件 | 生命周期 | 说明 |
| --- | --- | --- | --- |
| **长期记忆** | `patterns.md` / `mistakes.md` / `preferences.md` / `decisions.md` / `project-overview.md` / `conventions.md` | 跨会话累积 | 每次 Research 更新，不会删除 |
| **会话记忆** | `modules.md` / `apis.md` / `models.md` / `utils.md` / `config.md` / `architecture.md` | 每次 Research 重建 | 每次 Research 清空后重新生成 |

### 9.2 记忆管理命令

| 命令 | 说明 |
| --- | --- |
| `/dev-flow -cleanup` | 清理会话记忆（`session/` 目录），保留长期记忆 |
| `/dev-flow -cleanup --all` | 重置所有记忆文件（谨慎使用） |

### 9.3 记忆文件详解

**长期记忆**（跨会话累积）：

- `project-overview.md`：项目概述（技术栈、架构、模块说明）
- `conventions.md`：编码规范（命名约定、注释规范、格式要求）
- `patterns.md`：代码模式（常见写法、最佳实践）
- `mistakes.md`：常见错误（易错点、错误模式）
- `preferences.md`：用户偏好（用户明确指定的偏好）
- `decisions.md`：架构决策（重要决策记录）

**会话记忆**（每次 Research 重建）：

- `modules.md`（Java 项目）或 `components.md`（前端项目）：模块/组件列表
- `apis.md`：API 接口列表
- `models.md`：数据模型列表
- `utils.md`：工具类列表
- `config.md`：配置文件列表
- `architecture.md`：架构图

---

## 10\. 学习能力

dev-flow 具备**学习能力**，自动从用户反馈、代码修改、测试 Bug 中学习，越用越懂你的项目和企业。

### 10.1 学习来源

| 来源 | 学习内容 | 更新文件 |
| --- | --- | --- |
| **用户反馈** | 用户明确指出的错误或偏好 | `preferences.md` / `decisions.md` |
| **代码修改** | 用户手动修改的代码（vs AI 生成的代码） | `patterns.md` |
| **测试 Bug** | 测试失败暴露的问题 | `mistakes.md` / `error-pattern-db.md` |

### 10.2 学习流程

1. **收集**：从用户反馈、代码修改、测试 Bug 中收集学习素材
2. **提取**：提取可复用的模式、错误模式、偏好
3. **分析**：分析根因，形成预防策略
4. **应用**：更新到记忆文件，后续开发自动遵守
5. **验证**：追踪策略效果，调整优先级

### 10.3 学习产出

- `patterns.md`：学到的代码模式（出现 ≥ 2 次自动更新，≥ 5 次自动升级为强制检查项）
- `mistakes.md`：学到的错误模式（出现 ≥ 2 次自动更新，≥ 5 次自动升级为强制检查项）
- `preferences.md`：学到的用户偏好
- `error-pattern-db.md`：错误模式数据库（结构化存储）

---

## 11\. 常见问题（FAQ）

### Q1：dev-flow 支持哪些 AI 编程工具？

支持 Cursor、Trae、Qoder、Claude Code、OpenAI Codex。

### Q2：dev-flow 支持哪些编程语言？

支持 Java、TypeScript、Python、Go。通过多语言设计契约（design-contract-typescript.md / design-contract-python.md / design-contract-go.md）实现。

### Q3：如果项目已经有代码，dev-flow 会覆盖吗？

不会。dev-flow 的 **主 Agent 零编辑架构** 确保主 Agent 不直接编辑任何文件。所有文件操作由专门的阶段子代理执行，且会读取已有代码并遵守项目编码规范。

### Q4：如果测试失败，dev-flow 会自动修复吗？

会。Test 阶段失败后，会自动进入 Fix 阶段，分析失败原因并修复代码，最多 3 轮循环。

### Q5：Session 隔离是什么？为什么需要它？

Session 隔离是 v3.4.0 新增的特性。当你在同一项目中连续执行多个需求时，每个需求的所有文档（交付物、契约）会分别存放在独立的 `{需求简称}` 目录下，防止文件覆盖，支持完整追溯。

### Q6：如何查看 dev-flow 的版本号？

查看 `package.json` 中的 `version` 字段，或查看 README.md 中的版本徽章。

### Q7：如何更新 dev-flow 到最新版本？

```bash
npm install dev-flow@latest --save-dev
npx dev-flow install
```

### Q8：LANGUAGE-ONLY 是什么？如何使用？

LANGUAGE-ONLY 是 build.cjs 支持的语言过滤功能。构建时可以通过 `--lang` 参数指定项目语言，过滤掉其他语言的规范，减少子代理上下文负担。

示例：

```bash
npm run build -- --lang java   # 仅保留 Java 语言内容
npm run build -- --lang typescript,python   # 保留 TypeScript 和 Python 内容
```

### Q9：需求简称可以自定义吗？

需求简称由 AI 从用户需求描述中自动提取（核心名词短语，2-20 个字符）。如果提取的不准确，可以在阶段确认时手动修改。

### Q10：如何查看所有历史需求记录？

查看 `.dev-flow/session-index.yaml` 文件，其中记录了所有需求的历史记录（session-id、需求简称、状态、时间）。

---

*本用户指南基于 dev-flow v3.7.0 编写。*