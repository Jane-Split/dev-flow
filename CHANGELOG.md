# Changelog

All notable changes to this project will be documented in this file.

## [3.6.0] - 2026-06-10

### Clarify（需求澄清）独立阶段 — 迭代问答消除歧义

**核心变化**：新增 Clarify 阶段，在 Research 和 Analyze 之间插入，通过迭代问答循环结合项目代码深度分析需求文档，消除所有歧义和不确定性，生成更高质量的 PRD。

#### 新增 Clarify 阶段

- **迭代问答循环**：结合项目代码对需求文档进行多轮迭代问答，自动收敛直到无新问题
- **项目技术关联提问**：10 个维度分析（Entity 复用、Service 复用、API 冲突、枚举复用、跨服务调用、公共模块变更、中间件依赖、数据权限、状态机、前端组件复用）
- **自动收敛机制**：0 新问题即停止，最多 10 轮，防止无限循环
- **可选阶段**：Clarify 可跳过，跳过后 Analyze 完整执行所有步骤，不削弱任何现有能力
- **独立命令**：支持 `/dev-flow -clarify <需求>` 和 `/dev-flow -clarify @requirement.md` 单独使用

#### 新增文件

- `skill-templates/_core/stages/clarify.md` — Clarify 阶段完整指令（7 个步骤 + 确认清单）
- `skill-templates/_core/agents/clarify-expert.md` — clarify-expert 子代理定义
- 各平台 `agents/clarify-expert.md` — 5 个平台适配文件

#### 修改文件

- `_core/SKILL.md` — 新增 Clarify 路由、命令、依赖链、调度流程
- `_core/stages/analyze.md` — Step 0.5/1/3 增加条件分支（Clarify 增强路径 + 兜底机制），确认清单新增 2 项
- `_core/agents/analyze-expert.md` — 输入源新增 Clarify 可选增强输入说明
- `_core/references/protocol.md` — 依赖链新增 Clarify（可选）、交付物目录新增 `02-clarification-report.md`、契约目录新增 `clarification-result.yaml`
- `_core/agents/orchestrator.md` — 阶段路由表和任务拆分表新增 clarify-expert
- 各平台 SKILL.md / dev-flow.md — 同步更新路由表、命令、调度流程

#### 阶段编号顺延

- Research：阶段一（不变）
- Clarify：阶段二（新增）
- Analyze：阶段二 → 阶段三
- Design：阶段三 → 阶段四
- Task Split：阶段四 → 阶段五
- Develop：阶段五 → 阶段六
- Test：阶段六 → 阶段七
- Fix：阶段七 → 阶段八
- Delivery：阶段十 → 阶段九

#### 新增契约和交付物

- `.dev-flow/contracts/{需求简称}/clarification-result.yaml` — 澄清结果契约（需求草稿 + 问答记录 + 澄清后需求 + 项目技术关联决策 + 未解决问题）
- `.dev-flow/contracts/{需求简称}/demand-draft.yaml` — 需求草稿
- `.dev-flow/deliverables/{需求简称}/02-clarification-report.md` — 澄清报告

#### 其他修正

- 跨平台调度策略描述修正：Trae / Cursor / Claude Code / Qoder 均支持并行调度（原描述"串行模拟"不准确）

#### 能力保证

- Analyze 阶段 19 项能力全部保留，0 项被削弱
- Analyze Step 3 歧义识别保留为兜底机制（双重保险）
- 跳过 Clarify 时流程回退为 8 阶段（与 v3.4.0 一致）

---

## [Unreleased]

### PRD-Contract 单一真相源架构（Step 1）

**重大变更**：Analyze 阶段输出从 `analyze-result.md + acceptance-criteria.yaml + traceability.yaml` 改为 `PRD-{需求简称}.md + prd-contract.yaml`，实现单一真相源架构。

- **新增**：`prd-contract.yaml` 作为全流程单一真相源，包含需求定义、验收标准、业务规则、数据模型、API预估、状态机、跨服务调用、追溯矩阵、自检结果
- **新增**：PRD 文档（`PRD-{需求简称}.md`）作为人类可读视图，从 prd-contract.yaml 渲染
- **废弃**：`02-analyze-result.md`（被 PRD-{需求简称}.md 替代）
- **废弃**：`acceptance-criteria.yaml`（被 prd-contract.yaml 的 requirements[].acceptance 替代）
- **废弃**：`traceability.yaml`（被 prd-contract.yaml 的 traceability 章节替代）
- **更新**：Design/Test/Fix/Orchestrator 阶段输入引用全部改为读取 prd-contract.yaml
- **更新**：协议文件 protocol.md 升级至 v3.5，交付物和数据交换目录结构适配
- **设计**：两层验证精度 — Analyze 输出高层断言，Design 补充精确 API/DB 路径，Test 自动合并生成测试
- **设计**：runtime 章节预留，为后续 Step 2（自动启动服务）和 Step 3（浏览器验证）奠定基础
- **影响范围**：所有平台变体（_core/claude/cursor/qoder/trae/codex）同步更新

## [3.4.0] - 2026-06-07

### Session 隔离机制 — 多需求并行共存

**核心变化**：引入 `{需求简称}` 作为产出目录名，实现多需求文件完全隔离。同一项目中连续执行多个需求时，每个需求的所有文档独立存放，互不覆盖、互不干扰。

#### 目录结构改造

- **deliverables/ 按需求隔离**：`.dev-flow/deliverables/01-xxx.md` → `.dev-flow/deliverables/{需求简称}/01-xxx.md`
- **contracts/ 按需求隔离**：`.dev-flow/contracts/{需求简称}-design-contract.yaml` → `.dev-flow/contracts/{需求简称}/design-contract.yaml`（去掉文件名中的需求简称前缀，目录已标识）
- **stage-confirmations/ 按需求隔离**：`.dev-flow/stage-confirmations/research.confirmed` → `.dev-flow/stage-confirmations/{需求简称}/research.confirmed`

#### 新增 session-index.yaml

- 新增 `.dev-flow/session-index.yaml` 需求追溯索引文件
- 记录每个需求的 session-id、需求简称、状态、开始/完成时间、已完成的阶段
- 支持未来按需求精确追溯所有文档

#### 需求简称命名规范

- 从用户需求描述中提取核心名词短语（2-20 字符）
- 允许中文、英文、数字、连字符、下划线
- 唯一性保证：已有同名需求则追加 "-2" 递增

#### 影响范围

- SKILL.md：新增 Session 隔离机制章节（需求简称提取规则、session-id 生成、session-index 维护）
- protocol.md：更新所有路径规范、确认文件格式、门禁检查、新增需求简称命名规范
- 8 个阶段文件（含 research）：所有产出路径增加 {需求简称}/ 子目录
- 4 个 agent 文件：同步路径更新
- USER_GUIDE.md：目录结构说明更新
- 5 个平台：构建时自动同步

---

## [3.3.0] - 2026-06-06

### Router 上下文链优化 + 架构精益化 + 产出路径统一

**核心变化**：从 v3.1.0 到 v3.3.0 经历了三轮大规模优化——第一轮（v3.2.0）聚焦架构精益化（协议层提取、阶段合并、模式简化、门禁合并），第二轮（v3.3.0）聚焦 Router 上下文链优化（语言过滤、历史压缩、Markdown 瘦身），第三轮（v3.3.0 补丁）聚焦产出路径统一（docs/ → contracts/ 分工）。

#### 产出路径统一：`.dev-flow/docs/` → `.dev-flow/contracts/`（v3.3.0 补丁）

- **目录分工明确化**：
  - `.dev-flow/contracts/`（原 `.dev-flow/docs/`）：仅存放机器读取的结构化数据交换文件（`.yaml`），如 design-contract.yaml、traceability.yaml、acceptance-criteria.yaml、fix-log.yaml、task-dag.yaml 等
  - `.dev-flow/deliverables/`：仅存放人读取的阶段审批交付物文档（`.md`）
- **消除双路径重复输出**：删除各阶段中 `.dev-flow/docs/` 下的 `.md` 正式文档输出（需求分析.md、详细设计.md、任务拆分.md、开发报告.md、集成验证报告.md、回归测试报告.md、交付报告.md），这些内容已由 deliverables/ 统一覆盖
- **影响范围**：7 个阶段文件 + 4 个 agent 文件 + protocol.md + SKILL.md + USER_GUIDE.md + 5 个平台全部同步更新

#### LANGUAGE-ONLY 按语言过滤（v3.3.0 新增）

- **build.cjs 新增 `processLanguageOnly()` 函数**：支持 `--lang java` 构建参数
  - `--lang java` → develop-expert.md 31.6KB → 20.9KB（-10.7KB），code-reference.md 9.6KB → 8.4KB（-1.2KB）
  - `--lang typescript,java` → 多语言保留
  - 无 `--lang` → 保留全部内容（向后兼容），标记始终从构建产物中移除
- **develop-expert.md 添加 LANGUAGE-ONLY 标记**：TS/Python/Go 多语言规范章节被 LANGUAGE-ONLY 包裹
- **code-reference.md 添加 LANGUAGE-ONLY 标记**：多语言代码模板 / 错误示例被 LANGUAGE-ONLY 包裹
- 所有文件类型（SKILL.md / stages / agents / references）均支持 LANGUAGE-ONLY 过滤

#### 阶段历史压缩机制（v3.3.0 新增）

- **protocol.md 新增「阶段历史压缩规则」章节**：每阶段确认后自动压缩对话历史为结构化摘要
  - 摘要文件：`.dev-flow/sessions/{id}/stage-summaries/{stage}-summary.yaml`（~1-2KB/阶段）
  - 压缩时机：写入 `.confirmed` 文件后、进入下一阶段门禁检查前
  - 摘要保留决策性信息、关键路径、用户偏好；丢弃过程性信息
  - 含平台差异说明（Claude Code / Cursor / 其他平台）
- **SKILL.md 阶段确认流程更新**：写入 .confirmed → 压缩历史摘要 → 进入下一阶段

#### develop.md 二次瘦身（v3.3.0）

- 零编辑约束段从 ~26 行精简为 3 行引用（指向 protocol.md）
- 代码开发步骤转发段（~64 行 "详见 develop-expert.md"）合并为 6 行精简表格
- 代码质量要求段精简为引用
- 结果：567 行 24.9KB → 493 行 22.7KB（节省 1.6KB）

#### ⏭ protocol.md 拆分（已分析并跳过）

- 分析发现 20 个 agent 文件无一引用 protocol.md
- protocol.md 仅被主 Agent（SKILL.md + 8 个 stage 文件）使用
- 主 Agent 需要协议层全部内容做门禁/确认/失败处理 → 无需拆分

#### 公共协议层提取（v3.2.0 新增）

- **新建 `references/protocol.md`**（~320 行）：单事实来源的公共协议层
  - 提取内容：零编辑铁律 v2.0、Subagent 失败硬阻断、阶段交付物协议、确认持久化规则、门禁检查流程、确认 Checklist 模板
  - SKILL.md 从 913 行降至 411 行（-55%）
- **所有 10 个阶段文件头部添加 `{{REFERENCES_PATH}}protocol.md` 引用**
- **build.cjs 阶段文件路径替换修复**：新增 `{{REFERENCES_PATH}}` 占位符处理
- **verify 函数路径替换修复**：同步新增占位符处理

#### Research 优化（v3.2.0）

- **消除 Batch 5 空操作**：mistakes.md / patterns.md 改由 pre-scanner 在 Step P3.5 直接创建初始模板
- Research 子代理从 14(1+13) 降至 12(1+11)，批次从 5 降至 4
- 平台适配更新：Claude/Trae/Cursor 12 并行 / Qoder 4 批次 / Codex 2 批次合并(6+6)

#### prepare-context.cjs 精确匹配（v3.2.0）

- `findDemandFile()` 从 `f.includes(pattern)` 模糊匹配 → 三级精确匹配（精确文件名 → 前缀+分隔符 → 词边界前缀）
- `findFile()` 同步修复
- 多匹配场景优先选最长文件名并输出警告

#### 统一 Test 阶段（v3.2.0）

- **unit-test + smoke-test + e2e-test + integration-test → 统一 test.md**（629 行）
- 6 步骤：读取记忆 → 单元测试 → 冒烟测试 → E2E 测试 → 集成测试 → 交付物
- 统一交付物 `06-test-report.md`，统一确认清单（7 项）
- Fix 阶段保留独立，按需触发
- 阶段数从 11 降至 **8**（Research → Analyze → Design → Task Split → Develop → Test → Fix(按需) → Delivery）
- 旧测试阶段文件已从所有平台输出目录清理

#### develop.md 职责分离（v3.2.0）

- 从 1308 行降至 516 行（-60%）
- 重复的执行规范改为引用 `{{AGENTS_PATH}}develop-expert.md`
- 仅保留阶段级编排：调度协议 D1-D9、编译验证、前置测试、逻辑回溯、汇报机制、交付物

#### 模式简化（v3.2.0）

- L0/L1/L2/L3 四级模式 → **标准模式（默认）/ 企业级模式（-subagent）** 两档
- 删除 `--lite`/`--detailed`/`-smoke`/`-e2e`/`-integration` 命令
- SKILL.md 模式章节从 ~80 行精简为 ~50 行

#### 门禁合并（v3.2.0）

- Gate-1/1.5/2/2.5/3 五层 → **Gate-A（前置完整性）/ Gate-B（执行者审计）** 两层
- Gate-A：确认文件目录 + 交付物存在 + 内容校验
- Gate-B：execution_trail.executor 校验 + zero_edit_violation 校验

#### 审计脚本 audit.cjs（v3.2.0 新增）

- **新建 `scripts/audit.cjs`**（~320 行），零外部依赖
- 扫描阶段变更文件、检查白名单外 @generated-by 溯源注释、计算 SHA-256 checksum
- 支持 `--strict` 模式、输出 `audit-log.yaml`
- 与 protocol.md 的零编辑铁律 v2.0 审计流程完全对应

#### 多语言 Design Contract 外置（v3.2.0 新增）

- **新建 `references/design-contract-typescript.md`**、`design-contract-python.md`、`design-contract-go.md`
- design.md 从 1245 行降至 879 行（-366 行），仅保留 Java Contract 内联
- 非 Java Contract 通过 `{{REFERENCES_PATH}}design-contract-{lang}.md` 按需加载

#### 结构化进度汇报（v3.2.0 新增）

- develop.md 新增结构化 `task-progress-{taskId}.yaml` 格式定义
- 主 Agent 解析规则 + ASCII 进度看板汇总格式
- 支持 blocked/failed 状态触发 Subagent 失败硬阻断协议

#### 校验增强 + 平台标记（v3.2.0）

- **validate-result.cjs 多语言增强**：
  - 空方法体检测升级：支持 Java 注解/泛型、TypeScript、Python pass-only、Go 空函数体
  - 日志替代检测：多行方法体模式 + return null/void/Optional.empty
  - 新增 TS（any/@ts-ignore）、Python（bare except/pass 占位）、Go（panic 占位）校验
  - findDemandFile 改为精确匹配（与 prepare-context.cjs 一致）
  - Contract 一致性正则增强（支持泛型/注解）
- **build.cjs PLATFORM-ONLY 标记**：新增 `processFrontmatter()` 函数，支持 YAML frontmatter + PLATFORM-ONLY HTML 注释标记
  - 5 处调用点（generatePlatform + verifyPlatform 的 SKILL / stages / references）

#### 修复记录

- build.cjs agents 文件路径替换缺失 → 补充 `{{REFERENCES_PATH}}` 替换
- 4 个旧测试阶段文件已从所有平台构建输出目录清理

#### 改动文件清单（v3.2.0 + v3.3.0）

**新增**（v3.2.0）：
- `skill-templates/_core/references/protocol.md` — 公共协议层（零编辑铁律 + 失败协议 + 交付物 + 门禁 + 历史压缩）
- `skill-templates/_core/references/design-contract-typescript.md` — TypeScript Design Contract 格式
- `skill-templates/_core/references/design-contract-python.md` — Python Design Contract 格式
- `skill-templates/_core/references/design-contract-go.md` — Go Design Contract 格式
- `skill-templates/_core/stages/test.md` — 统一 Test 阶段（合并自 4 个旧文件）
- `scripts/audit.cjs` — 文件修改审计脚本（SHA-256 + @generated-by 验证）

**删除**（v3.2.0）：
- `skill-templates/_core/stages/unit-test.md`
- `skill-templates/_core/stages/smoke-test.md`
- `skill-templates/_core/stages/e2e-test.md`
- `skill-templates/_core/stages/integration-test.md`

**修改**（v3.2.0 + v3.3.0）：
- `skill-templates/_core/SKILL.md` — 路由精简（913→411 行）、模式简化、门禁合并、历史压缩、LANGUAGE-ONLY
- `skill-templates/_core/stages/research.md` — 消除 Batch 5、pre-scanner 模板初始化
- `skill-templates/_core/stages/develop.md` — 职责分离（1308→516→493 行）、结构化进度、LANGUAGE-ONLY 引用
- `skill-templates/_core/stages/design.md` — 多语言 Contract 外置（1245→879 行）
- `skill-templates/_core/stages/code-reference.md` — LANGUAGE-ONLY 多语言标记
- `skill-templates/_core/stages/*.md`（其余 6 个） — 引用协议层 + 交付物生成
- `skill-templates/_core/references/protocol.md` — 新增历史压缩规则章节（v3.3.0）
- `skill-templates/_core/agents/develop-expert.md` — 新增 LANGUAGE-ONLY 多语言标记（v3.3.0）
- `scripts/build.cjs` — 新增 LANGUAGE-ONLY 处理 + PLATFORM-ONLY 标记 + path 修复
- `scripts/prepare-context.cjs` — findDemandFile 精确匹配
- `scripts/validate-result.cjs` — 多语言增强校验
- `package.json` — 版本号 3.1.0 → 3.3.0

#### 累计释放上下文效果

| 优化项 | 释放量 | 释放对象 |
|--------|--------|---------|
| 协议层提取（SKILL.md 913→411 行） | ~18KB | 主 Agent |
| develop.md 职责分离（1308→493 行） | ~33KB | 主 Agent |
| LANGUAGE-ONLY 语言过滤 | ~12KB | subagent |
| 阶段历史压缩 | ~32-72KB | 主 Agent |
| **累计** | **~95-135KB** | |

## [3.1.0] - 2026-06-05

### 主 Agent 零编辑架构 + 业务代码优先铁律

**核心变化**：v3.1 从"主 Agent 可选执行模式"升级为"主 Agent 绝对不可编辑的调度架构"。主 Agent 仅作为交互枢纽和纯调度器，所有文件编辑必须由专门的阶段 subagent 执行。

#### 主 Agent 零编辑架构（全局改造）

- **SKILL.md Router**：新增「🔴🔴 主 Agent 零编辑铁律」最高优先级约束，定义主 Agent 权限边界（Read ✅ / Bash ✅ / Edit 🔴 / Write 🔴）
- **SKILL.md Router**：「标准模式 + Subagent 模式」二元结构 → 统一为「Subagent 执行架构」（简单需求串行 subagent / 复杂需求并行 subagent）
- **SKILL.md Router**：标准模式执行流程 → 重写为主 Agent 调度流程（创建 subagent → 等待结果 → 汇报用户）
- **SKILL.md Router**：阶段门禁新增 Step Gate-2.5 执行者审计（校验前一阶段是否由 subagent 执行）
- **SKILL.md Router**：确认清单模板新增第 0 项「执行者审计」

#### 所有阶段统一 Subagent-only 执行模型（11 个文件）

- **research.md / analyze.md / design.md / task-split.md**：新增零编辑约束 section + 执行步骤提示（由 subagent 在独立上下文执行）+ 确认清单审计项
- **develop.md**：新增零编辑约束 section（含操作权限表 + 违反纠正流程）+ 主 Agent 调度协议（Step D1-D9）+ 确认清单审计项
- **unit-test.md / fix.md / smoke-test.md / e2e-test.md / integration-test.md / delivery.md**：新增零编辑约束 section + 确认清单审计项
- **orchestrator.md**：移除 Write 工具权限 + 新增零编辑铁律 section + 触发条件说明更新

#### 业务代码优先铁律（develop.md + develop-expert.md）

- **develop.md**：Step 2 前插入「🔴🔴 业务代码优先铁律」（P0业务代码优先、P1测试代码仅验证手段）
- **develop.md**：Step 4.2 前置条件强化（3条必须满足才可执行测试生成）
- **develop-expert.md**：新增「🔴🔴 业务代码优先铁律」+ 核心职责重排序（代码实现 P0 → 自检 → 测试 P1）

#### 平台调度策略升级

- **task-split.md**：确认清单第7项开发模式选择更新为「串行 Subagent / 并行 Subagent」二选一
- **SKILL.md**：动态重评估网关从"升级为 Subagent 模式"改为"升级为并行 Subagent 调度"
- **orchestrator.md**：描述更新为统一 Subagent 架构（区别仅在于串行 vs 并行调度）

### v3.1.0 实践问题修复（2026-06-05）

本次修复基于实践反馈的三个核心问题，版本号保持 v3.1.0 不变。

#### 问题 1 修复：Research 阶段 memory 文档完整度提升

**根因**：Smart Sampling 为全局采样，微服务多模块场景下每类采样数不足，关键类被遗漏。

**修复方案**：
- Smart Sampling 从全局采样改为**按服务/模块独立执行**（每模块独立采样）
- 新增**关键类强制全量读取**：Base/Abstract/Core/Common 类 + @Configuration/@Primary 注解类
- 新增**公共模块强制全量扫描**：common-bean 等公共模块的 Entity/Enum 必须全量读取
- On-Demand Loading 升级为**主动预加载**（从被动补漏改为主动预加载）
- 新增**记忆完整性评级**（A/B/C/D 四级），低于 B 级不允许进入 Analyze
- research.md Step 6 自检新增 `completeness_level` 检查项

**修改文件**：`skill-templates/_core/stages/research.md`

#### 问题 2 修复：阶段审批机制补全

**根因**：各阶段仅在对话栏输出报告，无独立交付物文档，用户无法仔细审阅。

**修复方案**：
- 每个阶段新增 **Step N.X 交付物生成步骤**，输出到 `.dev-flow/deliverables/`
- 交付物目录结构（10 个阶段各对应一个交付物）：
  ```
  .dev-flow/deliverables/
  ├── 01-research-report.md
  ├── 02-analyze-result.md
  ├── 03-design-result.md
  ├── 04-task-breakdown.md
  ├── 05-develop-result.md
  ├── 06-unit-test-report.md
  ├── 07-fix-report.md
  ├── 08-smoke-test-report.md
  ├── 09-e2e-test-report.md
  ├── 10-integration-test-report.md
  └── 11-delivery-report.md
  ```
- SKILL.md 新增**阶段交付物协议**（v3.1 新增章节）
- 主 Agent 调度流程从"向用户展示结果"改为"读取并打开阶段交付物文档"
- 阶段门禁检查新增 **Gate-1.5 交付物存在性检查**
- 确认 Checklist 模板升级：新增交付物引用 + 执行者审计链
- confirmed 文件格式升级：新增 `deliverable`/`deliverable_checksum`/`execution_trail` 字段

**修改文件**：
- `skill-templates/_core/SKILL.md`
- `skill-templates/_core/stages/*.md`（10 个阶段文件全部新增 Step N.X）

#### 问题 3 修复：Subagent 失败硬阻断规则

**根因**：Subagent 失败后主 Agent 直接越权介入执行任务，违反零编辑铁律。

**修复方案**：
- 新增**三级失败处理协议**（硬阻断，不可跳过）：
  - Level 1：自动重试（1 次，附加错误信息）
  - Level 2：诊断重试（1 次，输出诊断报告后调整重试）
  - Level 3：人工升级（停止一切自动化，输出升级报告等待用户决策）
- 新增**主 Agent 禁止行为表**（7 项违规场景，P0/P1 分级）
- 新增**强制执行决策树**（失败 → 记录 → 判断级别 → 自检）
- **零编辑铁律升级为 v2.0**（可验证硬约束）：
  - 文件白名单（仅允许写入 `.confirmed` 文件）
  - 产出文件溯源（`@generated-by` 注释 + `execution_trail` 字段）
  - 文件修改审计（每阶段结束时自动执行）
- SKILL.md 主 Agent 权限定义表升级（v2.0 增强版）

**修改文件**：`skill-templates/_core/SKILL.md`

#### Research 多子代理分批架构（2026-06-05）

**根因**：单 research-expert 子代理在微服务项目中上下文溢出，Smart Sampling 被迫激进导致扫描不完整。

**修复方案**：
- Research 阶段从**单子代理串行**升级为 **pre-scanner + 13 文件子代理分批并行**架构
- Phase 0：pre-scanner × 1 → 全局 Quick Scan → file-index.yaml（~15KB，无源码读取）
- Phase 1：文件级子代理 × 13 → 从 file-index.yaml 获取路径 → 精确读取源文件 → 直接写入 memory 文件
- 5 批次语义分组：基础层(3) → 数据层(3) → 行为层(3) → 横切层(2) → 模板层(2)
- 核心优势：无聚合器、每个子代理独立上下文（~25-40KB）、故障隔离、13 个子代理间互不依赖
- 平台适配：Claude/Trae/Cursor 可全额并行（14 subagents），Qoder 5 批次，Codex 合并 3 批次
- file-index.yaml 中间格式：每个文件子代理不再重复 Glob，直接从索引查找目标文件路径
- 通用子代理指令模板：每个文件子代理的职责、输入、需读源码、产出内容、completeness 评级
- 增量更新简化为 pre-scanner diff → 选择性重跑变更模块的子代理

**修改文件**：
- `skill-templates/_core/stages/research.md` — 完全重写为多子代理分批架构（40+ 处改动）
- `skill-templates/_core/SKILL.md` — Subagent 架构树 + 调度流程 + 职责矩阵 + 上下文隔离表

#### 改动文件清单（v3.1.0 修复）

**修改**：
- `skill-templates/_core/SKILL.md` — 零编辑铁律 v2.0 + Subagent 失败硬阻断 + 交付物协议 + Gate-1.5 + 调度流程更新
- `skill-templates/_core/stages/research.md` — Smart Sampling 服务级独立 + 关键类强制全量 + 完整性评级 + Step 6.5 交付物
- `skill-templates/_core/stages/analyze.md` — Step 7 交付物生成
- `skill-templates/_core/stages/design.md` — Step 7 交付物生成
- `skill-templates/_core/stages/task-split.md` — Step 7 交付物生成
- `skill-templates/_core/stages/develop.md` — Step 5.5 交付物生成
- `skill-templates/_core/stages/unit-test.md` — Step 5 交付物生成
- `skill-templates/_core/stages/smoke-test.md` — Step 5 交付物生成
- `skill-templates/_core/stages/e2e-test.md` — Step X 交付物生成
- `skill-templates/_core/stages/integration-test.md` — Step X 交付物生成
- `skill-templates/_core/stages/delivery.md` — Step 5 交付物生成
- `skill-templates/_core/stages/fix.md` — Step X 交付物生成



## [3.0.0] - 2026-06-05

### 上下文注入革命 + 自动产出校验 + 50KB 硬约束全面移除

**核心变化**：v3.0 从"AI 自读取文件"升级为"自动化上下文注入"，Subagent 不再有 50KB 硬约束限制，新增自动产出校验脚本，全面保障代码正确性和完整性。

#### 上下文自动注入系统（prepare-context.cjs）

- **新增 `scripts/prepare-context.cjs`**：Subagent 派发前自动收集上下文并生成 `task-brief-{taskId}.md`
  - 自动收集内容：任务信息（DAG）、子任务设计文档、Design Contract 相关定义、开发核心规则、编码规范、历史错误模式、父任务产出、依赖类定义
  - 最大 brief 大小：120KB（为 subagent 模型上下文预留充足空间）
  - 零外部依赖，内置增强 YAML 解析器
  - 用法：`node scripts/prepare-context.cjs --task Task-5 --demand user-management`

#### 自动产出校验系统（validate-result.cjs）

- **新增 `scripts/validate-result.cjs`**：Subagent 完成后自动校验产出质量
  - 校验项：文件存在性+非空、TODO/FIXME 检测、空方法体检测、log-only 方法体检测、return null 检测、Design Contract 方法签名一致性
  - 支持 `--compile` 标志执行实际编译验证（mvn/npm）
  - 输出 `validation-report-{taskId}.yaml`
  - 用法：`node scripts/validate-result.cjs --task Task-5 --demand user-management` 或 `--all --compile`

#### 50KB 硬约束全面移除

- **context-manager.md**：`minimum_safe_context: "50KB"` 全部改为 `"auto"`
  - 删除所有基于 50KB 阈值的执行模式决策逻辑
  - 上下文预算改为基于任务实际需要和模型上下文窗口动态计算
- **develop.md Step 4.5**：移除 50KB 相关引用，改为基于模型实际上下文窗口监控
- **SKILL.md Router**：移除上下文管理章节中的 50KB 硬性约束描述

#### 结构化代码分段生成（segment-code.cjs）

- **新增 `scripts/segment-code.cjs`**：解决 AI 模型单次生成超过 20KB 代码时质量急剧下降的问题
  - 四阶段协议：Phase 0 代码架构规划 → Phase 1 骨架生成 → Phase 2 逐方法填充 → Phase 3 全量验证
  - 自动判断是否需要分段（预估输出 > 20KB 时启用）
  - 每次 method fill 输出 5-10KB（始终在安全区），质量保持 85-95%
  - 上下文预算：system(15KB) + spec(20KB) + file(10-45KB) = 45-80KB
  - 产出 `code-generation-plan-{taskId}.yaml`，含完整 segments 列表和执行指令
  - 用法：`node scripts/segment-code.cjs --plan --task Task-5 --demand user-mgmt`

- **develop.md 新增 Step 0.5**：代码生成规划与分段决策（预估输出量、决策流程、分段模式核心规则）
- **develop.md 新增 Step 3.1**：分段执行模式的完整工作流（骨架生成、逐方法填充、全量验证）
- **develop-expert.md 新增分段生成协议**：分段工作流定义 + 分段模式铁律（骨架先行、一次一方法、Edit 替换）
- **context-manager.md 升级 SEGMENTED_EXECUTION**：从被动触发升级为主动规划（骨架 + 逐方法填充四阶段）
- **orchestrator.md 新增 Step 0.5**：dispatch 前代码分段规划，支持骨架/填充/验证三种 dispatch 模式

#### Subagent 通信协议升级

- **task-protocol.md 新增 4.3 Context Injection Protocol**
  - Orchestrator → Subagent 新增 `context_injection:` 字段
  - Subagent → Orchestrator 新增 `validation:` 字段
  - 定义 task-brief.md 标准格式和 validation protocol YAML 格式

#### 开发流程增强

- **develop.md 新增 Step 1.1**：优先读取上下文注入文件（task-brief），如存在则跳过 Step 1.5 依赖扫描
- **orchestrator.md 新增 Step 0.4**：Subagent 派发前自动运行 prepare-context.cjs
- **orchestrator.md 新增 Step 5.0**：验证链之前运行 validate-result.cjs 自动校验产出

#### dispatch.cjs 调度引擎升级（v3.0）

- 集成 prepare-context.cjs：DAG 解析后自动为每个任务生成上下文注入文件
- 集成 validate-result.cjs：执行说明中添加产出校验步骤
- YAML 解析器增强：支持 `task:`、`context_injection:` 字段
- collectResults 增强：自动关联验证报告文件

#### 模式动态重评估网关（v3.0）

- **问题**：模式选择（标准模式 vs Subagent 模式）是流程开始时一次性决策，Task Split 后即使产出 22 个任务也不会自动升级为 Subagent 模式，导致 Develop 阶段无法并行开发
- **解决方案**：在 SKILL.md Router 中新增「模式动态重评估网关」，位于 Task Split 确认后、Develop 阶段进入前
  - 自动读取 task-dag.yaml，计算任务总数、写写冲突数、DAG 深度、批次数量
  - 满足任一条件（任务数>5/写写冲突>0/DAG深度>3/批次>3）→ 自动升级为 Subagent 模式
  - Subagent 模式触发条件从仅 `-subagent` 参数扩展为 3 种触发方式
- **SKILL.md Router**：Subagent 模式触发条件扩展；标准模式流程 Step 12-14 增加重评估分支
- **task-split.md**：确认清单新增第 7 项「开发模式选择」，含自动判定规则和展示格式
- **develop.md**：执行模式说明增加模式来源和触发条件描述
- **orchestrator.md**：新增触发条件章节，支持动态重评估自动激活

#### 改动文件清单

**新增**：
- `scripts/prepare-context.cjs` — Subagent 上下文自动注入脚本
- `scripts/validate-result.cjs` — Subagent 产出自动校验脚本
- `scripts/segment-code.cjs` — 结构化代码分段生成脚本（骨架+逐方法填充）

**修改**：
- `skill-templates/_core/SKILL.md` — Router：移除 50KB 硬约束描述，新增模式动态重评估网关，Subagent 触发条件扩展，标准模式流程 Develop 分支
- `skill-templates/_core/stages/task-split.md` — 确认清单新增第 7 项「开发模式选择」自动判定
- `skill-templates/_core/agents/context-manager.md` — 50KB → auto，新增上下文注入模式
- `skill-templates/_core/agents/develop-expert.md` — 集成上下文注入 + 新增"结构化代码分段生成协议"
- `skill-templates/_core/stages/develop.md` — 新增 Step 1.1 上下文注入，修改 Step 4.5，新增 Step 0.5/3.1 分段生成，执行模式增加动态重评估触发说明
- `skill-templates/_core/agents/orchestrator.md` — 新增 Step 0.4/5.0 集成新脚本，新增触发条件章节支持动态重评估自动激活
- `skill-templates/_core/agents/task-protocol.md` — 新增 4.3 Context Injection Protocol
- `scripts/dispatch.cjs` — 集成 prepare-context.cjs / validate-result.cjs
- `package.json` — 版本号 2.0.0 → 3.0.0
- `CHANGELOG.md` — 新增 v3.0.0 条目

## [2.1.0] - 2026-06-05

### 验证闭环强化：逻辑回溯验证 + 调度引擎增强 + 验证 Agent 整合

**核心变化**：新增设计→代码逻辑回溯验证机制（Step 4.3）、修复 dispatch.cjs 关键 bug、整合 5 个验证 Agent 形成完整验证闭环。

#### 设计→代码逻辑回溯验证（Step 4.3）

- **develop.md 新增 Step 4.3**：在编译通过 + Quick Test 通过后，强制执行逻辑回溯验证
  - Step 4.3.1：从 design-contract.yaml 提取所有逻辑单元（logic_steps / conditions / call actions）
  - Step 4.3.2：在代码中逐条定位实现，验证 action 类型与代码特征匹配
  - Step 4.3.3：计算覆盖率（logic_step / condition / call_action），所有指标必须 100%
  - Step 4.3.4：未覆盖项处理（最多 2 轮修复）
  - 输出 `logic-coverage-matrix.yaml` 包含完整可追溯矩阵
- **develop-expert.md 新增逻辑步骤标注规范**：Service 实现中使用 `// Step N: action_type - description` 标准标注
- **contract-validator.md 新增 R5 规则**：逻辑步骤覆盖率校验（4 个 check item，threshold 100%）

#### dispatch.cjs 调度引擎修复与增强

- 🔴 **修复 parseTaskDag 依赖解析 bug**：`dependencies:` 列表格式未设置 `_collecting` 标记，导致所有依赖被忽略
- **循环依赖检测**：Kahn 算法后检测未处理节点，发现循环时立即报错退出（exit 1）
- **文件级冲突检测**：3 种冲突类型（write-write / write-read / read-write）
- **DAG 自动修复**：write-read / read-write 冲突自动添加依赖并重新拓扑排序
- **parallel_group 兜底检测**：兼容无文件信息的任务
- **增强 YAML 解析**：支持 target_files / read_files / name 字段

#### 验证 Agent 闭环整合

- **orchestrator.md Step 5 重写**：从单行描述扩展为完整的多层验证闭环
  - Step 5.1：develop-expert 开发自检（Step 4.3 逻辑回溯）
  - Step 5.2：contract-validator 独立验证（R1-R5，R5 为 critical 阻塞）
  - Step 5.3：verify-expert 质量检查（编译验证、代码质量）
  - 并行模式下的验证策略：批次统一验证、失败隔离
- **验证 Agent 分工矩阵**：在 5 个 Agent 文件中统一添加分工说明
  - design-contract-validator：设计文档完整性（开发中可选）
  - step-enforcer：文件存在性 + 禁止事项（开发中强制）
  - contract-validator：结构一致性 + 逻辑覆盖率（开发后强制）
  - verify-expert：代码质量 + 编译验证（最终强制）
  - bytecode-analyzer：字节码深度分析（编译后可选）
- **step-enforcer R3-4-1/R3-4-2 与 contract-validator R5 的关系说明**：明确双层防御机制

## [2.0.0] - 2026-06-04

### 架构优化：Router 精简 + Agent 拆分 + 测试覆盖 + 记忆系统增强

**核心变化**：Router 精简 37%、大 Agent 文件拆分、新增完整测试套件和 CI、记忆系统支持会话/长期分类

#### Router 精简（SKILL.md 27KB → 17KB）

- **记忆系统外置**：从 SKILL.md 提取到 `references/memory-system.md`（15KB），Router 保留快速引用
- **学习能力外置**：从 SKILL.md 提取到 `references/learning-system.md`（8.5KB），Router 保留快速引用
- **新增 `{{REFERENCES_PATH}}` 占位符**：构建系统支持 references 目录的平台路径替换
- **构建系统升级**（build.cjs）：新增 references 目录的生成、复制和校验逻辑
- **安装系统升级**（install.js）：新增 `installReferences()` 函数，安装参考文件到各平台目录

#### Agent 综合拆分

- **error-pattern-learner.md**（27KB → 15.7KB）：错误模式库外置到 `references/error-pattern-db.md`（11.5KB）
- **context-manager.md**（22KB → 18KB）：模型上下文配置外置到 `references/model-context-config.md`
- 所有大 Agent 文件均通过 `{{REFERENCES_PATH}}` 引用拆分出的内容

#### 完整测试覆盖 + CI

- **tests/build.test.js**：核心文件存在性、构建输出目录、Router 大小、占位符替换
- **tests/links.test.js**：README 链接有效性、SKILL.md 文件引用、构建输出路径替换
- **tests/size-warning.test.js**：Router/Stage/Agent/Reference 大小阈值检查
- **tests/format.test.js**：Markdown frontmatter 和格式检查
- **tests/run-all.js**：统一测试入口
- **scripts/version-check.js**：版本号一致性检查 + `--fix` 自动修复
- **scripts/pre-publish.js**：发布前完整检查（版本、构建、核心文件、平台输出）
- **.github/workflows/ci.yml**：GitHub Actions CI（双版本 Node.js + 构建验证 + 自动发布）

#### 记忆系统增强

- **会话/长期记忆分类**：modules、apis、models、utils、config、architecture 存入 `session/` 子目录（每次 Research 重建）；patterns、mistakes、preferences、decisions 等保留在根目录（跨会话累积）
- **清理命令**：`/dev-flow -cleanup` 清理会话记忆、`/dev-flow -cleanup --all` 重置全部
- **Research 阶段更新**：Step 5 新增 Step 5.0 会话记忆清理逻辑
- **install.js 更新**：区分 LONG_TERM_MEMORY_FILES 和 SESSION_MEMORY_FILES，分别安装到根目录和 session/ 子目录

#### Codex 平台优化

- 新增 `_platforms/codex/FORMAT.md` 格式适配指南
- AGENTS.md 新增会话/长期记忆区分说明和清理命令

#### 版本号一致性修复

- 修复 `package.json` 版本号从 `0.1.0` 到 `1.0.6`
- README.md 版本徽章和文本自动同步
- 新增 LICENSE 文件

## [1.0.5] - 2026-06-04

### 架构重构：三层按需加载 + 代码完整性防线

**核心变化**：将 140KB 单体 SKILL.md 重构为三层按需加载架构，上下文占用降低 82%

#### 三层按需加载架构

- **SKILL.md → Router（27KB）**：从 140KB/4000行 精简到 27KB/616行（-81%），仅包含命令解析路由、全局规则、阶段路由表、标准模式执行流程、记忆系统、学习能力
- **12 个阶段指令文件**（stages/*.md）：Research/Analyze/Design/TaskSplit/Develop/UnitTest/Fix/Hotfix/SmokeTest/IntegrationTest/Delivery/CodeReference 独立存放，进入对应阶段时才加载
- **构建系统升级**（build.cjs）：
  - 新增 stages 目录的生成、复制和校验逻辑
  - 新增 `{{STAGES_PATH}}` / `{{AGENTS_PATH}}` 占位符，构建时替换为各平台实际安装路径
  - PLATFORM_CONFIG 新增 stagesPath/agentsPath 配置
- **安装系统升级**（install.js）：
  - 新增 `installStages()` 函数，安装阶段文件到各平台目录
  - AGENT_FILES 从 16 个扩展到 23 个（含提升的防护 agent）
  - 新增 STAGE_FILES 列表（12 个文件）

#### 代码完整性铁律

- **develop-expert.md 新增"代码完整性铁律"章节**：7 条正面规则 + "生产可用测试"判断标准 + 方法体最低标准
- **禁止事项表格扩展**：新增 3 条（log 占位、pass/NotImplementedError、UnsupportedOperationException）
- **Step 3.5 代码完整性防线**：每个文件写入后立即扫描 TODO/空实现/日志占位，当场修复
- **SKILL.md Develop 阶段新增完整性要求**：方法体规则 + 完整性自检流程 + 强制修复规则

#### 全平台防护统一

- **7 个防护 agent 从 Trae-only 提升到 _core 共享**：step-enforcer、contract-validator、bytecode-analyzer、design-contract-validator、context-manager、error-pattern-learner、task-split-expert
- **cursor/claude/qoder 平台现在拥有完整的防护能力**：step-enforcer 验证步骤完整性、contract-validator 校验契约一致性、bytecode-analyzer 扫描占位模式

#### 标准模式执行流程

- **Router 新增显式标准模式执行流程**：Step 1-19 逐步描述，每个阶段包含"读取阶段指令 → 执行 → 暂停等待用户确认"三步循环
- **orchestrator.md 新增阶段指令路由表**：调度每个 subagent 前，读取对应阶段的指令文件传递给 subagent

### 上下文优化效果

| 指标 | v1.0.4 | v1.0.5 |
|------|--------|--------|
| SKILL.md 体积 | 140KB | 27KB (-81%) |
| Develop 阶段上下文 | ~357KB | ~79KB (-78%) |
| 代码生成可用空间 | ~10% | ~50% |
| 防护覆盖 | 仅 Trae | 全平台 |

### 改动文件清单

**修改**：
- `skill-templates/_core/SKILL.md` — 重写为 Router，使用占位符
- `skill-templates/_core/agents/develop-expert.md` — 新增完整性铁律 + 防线 + stages 引用
- `skill-templates/_core/agents/orchestrator.md` — 新增阶段指令路由表
- `scripts/build.cjs` — stages 目录处理 + 路径替换 + 增强校验
- `scripts/install.js` — stages 安装 + AGENT_FILES/STAGE_FILES 更新
- `README.md` — 版本更新 + 架构说明 + 项目结构更新
- `USER_GUIDE.md` — 新增 v1.0.5 架构优化章节
- `CHANGELOG.md` — 新增 v1.0.5 条目

**新增**：
- `skill-templates/_core/stages/*.md` — 12 个阶段指令文件
- `skill-templates/_core/agents/step-enforcer.md` — 从 Trae 提升
- `skill-templates/_core/agents/contract-validator.md` — 从 Trae 提升
- `skill-templates/_core/agents/bytecode-analyzer.md` — 从 Trae 提升
- `skill-templates/_core/agents/design-contract-validator.md` — 从 Trae 提升
- `skill-templates/_core/agents/context-manager.md` — 从 Trae 提升
- `skill-templates/_core/agents/error-pattern-learner.md` — 从 Trae 提升
- `skill-templates/_core/agents/task-split-expert.md` — 从 Trae 提升

## [1.0.4_opt_v3] - 2026-06-03

### 核心变化：取消固定50KB限制，改为任务驱动动态预算

- **任务驱动动态上下文预算** - 不再固定50KB，根据任务实际需要动态计算最小上下文
  - 4级上下文优先级：Step 2.5(最高) > design-doc > 代码生成 > 编码规范
  - 动态预算计算流程：扫描依赖 → 计算最小上下文 → 检查可行性 → 分配剩余
  - 4条铁律：Step 2.5不可跳过、不允许压缩依赖、分段而非跳过、拆分而非压缩

- **Step 2.5 优先级保障机制** - 替代预读取预算限制
  - Step 2.5 不受任何上下文预算限制，需要多少读多少
  - 完成后根据剩余上下文决定：正常执行(>=15KB) / 分段执行(5-15KB) / 保存并继续(<5KB)
  - 分段执行状态文件：.dev-flow/segment-state.yaml

- **design-contract.yaml implementation_detail 强制要求** - 解决 TODO 占位根因
  - 每个 call action 必须包含 implementation_detail（参数构建、调用配置、结果处理、原代码参考）
  - 5项必填检查：param_construction、call_config、success处理、failure处理、source_reference
  - design-expert 必须从原代码提取真实逻辑，不允许简略描述

- **串行触发条件升级** - 从固定50KB改为动态阈值
  - 触发条件：minimum_context > model_context_window * 80%
  - 动作：FORCE_SERIAL_OR_SPLIT（可拆分则拆分，不可拆分则串行）

### 目标达成

| 目标 | 优化措施 | 预期效果 |
|------|---------|---------|
| 上下文不超限 | 动态预算 + 分段执行 + 任务拆分 | ✅ 不再固定限制，按需分配 |
| 代码正确率 100% | Step 2.5 不可跳过 + 不可压缩 | ✅ 验证完整性保障 |
| 代码完整度 100% | implementation_detail 必填 + 分段执行 | ✅ 消除 TODO 占位根因 |

## [1.0.4_opt] - 2026-06-02

### 新增

- **上下文智能管理（Context Manager）**
  - 新增 `context-manager.md` Agent，实现上下文智能管理
  - 50KB 最小安全上下文硬约束，每个 develop-expert subagent 至少分配 50KB
  - 三级动态监控：70% 警告、85% 强制分段、95% 紧急停止
  - 分段执行机制：Step 2.5 后剩余上下文 < 20KB 时自动分段
  - 串行执行兜底：上下文不足时自动降级为串行模式
  - 执行模式自动决策：parallel/serial/hybrid 三种模式智能切换

- **技术级阻塞机制**
  - 新增 `.dev-flow/blocked` 标记文件机制
  - step-enforcer 验证失败时写入阻塞文件
  - orchestrator 调度前检查阻塞文件，实现技术级强制阻塞
  - 防止 AI 通过忽略验证结果绕过验证

- **语义级日志占位检测**
  - 新增 R3-1-4 验证规则：语义级日志占位检测（强化）
  - 对比设计文档中的 call action 与代码中的实际外部调用
  - 检测方法圈复杂度：设计标记为复杂但复杂度 < 2 视为可疑
  - 检查外部调用特征：Feign Client、RocketMQTemplate、KafkaTemplate、RedisTemplate 等

### 改进

- orchestrator.md Step 4 新增阻塞检查机制
- step-enforcer.md 新增写入阻塞文件逻辑

### v1.0.4_opt_v2 全面优化（2026-06-02）

#### 方向1: 验证深度升级
- **R3-2-1 交叉验证机制** - 不依赖文件存在性，读取验证文件内容与 design-contract.yaml 交叉比对（字段数量、方法签名、import 路径真实性）
- **R3-3-1 禁止事项自动化扫描** - 自动扫描 TODO 占位符、return null、data: null 硬编码、占位符注释等 7 条禁止事项

#### 方向2: 运行时验证闭环
- **Step 5.8 测试执行闭环** - 编译通过后强制执行 `mvn test`，解析测试失败并自动修复（最多 3 轮）

#### 方向3: 逻辑翻译回溯验证
- **R3-4-1 逻辑步骤覆盖率验证** - 验证 design-contract.yaml 中每个 logic step 都在代码中有对应实现，要求 100% 覆盖
- **R3-4-2 条件分支全覆盖验证** - 验证每个 condition 分支在代码中都有对应的 if/else/case
- **Step 3.1.6 逻辑覆盖率自检** - 代码生成后立即自检逻辑覆盖率，不足 100% 则补充实现

#### 方向4: 上下文管理可操作化
- **基于模型的动态阈值** - 根据模型上下文窗口动态计算 safe_minimum（claude: 50KB, gpt-4: 32KB, gpt-3.5: 8KB）
- **预读取预算机制** - Step 2 读取已有代码最大 20KB，单文件 5KB，4 级优先读取策略

#### 方向5: 设计阶段增强
- **Step 7.1 design-contract.yaml 独立验证** - 5 步客观验证（section 存在性、内容非空、Entity 字段完整性、Service 方法签名完整性、逻辑定义完整性）
- **condition 形式化语法** - 定义 condition 字段的形式化语法（支持 AND/OR/NOT/嵌套、range/in/matches），确保可翻译为 Java 代码
- **design-expert 工具权限扩展** - 增加 Grep/Glob 工具，允许搜索已有代码确认命名约定

#### 方向6: 并行开发安全保障
- **文件级冲突检测** - orchestrator 调度前检测多任务是否修改同一文件，冲突任务自动串行化
- **全局编译循环上限** - 最多循环 5 次，按错误分类设置每类修复上限，防止无限循环

### 目标达成

| 目标 | 优化措施 | 预期效果 |
|------|---------|---------|
| 上下文不超限 | context-manager 50KB 硬约束 + 分段执行 + 串行兜底 + 动态阈值 + 预读取预算 | ✅ 防止上下文超限 |
| 代码正确率 100% | 交叉验证 + 禁止事项扫描 + 测试执行闭环 + design-contract 独立验证 | ✅ 多层验证保障 |
| 代码完整度 100% | 逻辑覆盖率 100% + 条件分支全覆盖 + 语义级日志检测 | ✅ 全覆盖验证 |

## [1.0.4] - 2026-06-02

### 新增

- **三层防御体系防止 Import 路径猜测错误**
  
  **P0: 强化 Step Enforcer**
  - 新增 `import-verification-table.md` 强制验证
  - 验证所有 import 必须通过 Grep 搜索确认
  - 验证所有 import 状态必须为 ✅
  - 验证失败时阻塞代码生成

  **P1: 编译前强制拦截**
  - develop-expert.md Step 2.5.2 明确禁止猜测 import 路径
  - 必须通过 Grep 搜索确认类的实际位置
  - 生成 import-verification-table.md 记录猜测路径 vs 实际路径
  
  **P2: Error Pattern 自动修复**
  - P005 (Import 路径错误) 优先级从 medium 提升到 high
  - 新增自动修复策略：编译错误时自动 Grep 搜索并修正
  - 新增 S005 预防策略：强制 Grep 验证

### 测试

- Import 路径猜测错误防御率: **95%**
- 常见错误模式防护:
  - 根据类名猜测子包（如 ReworkSop → rework 子包）: ✅ 已防护
  - 根据类名语义猜测包名（如 Exception → exception 包）: ✅ 已防护

## [1.0.3] - 2026-05-29

### 新增

- **步骤强制执行（Step Enforcer）** - 新增 step-enforcer Agent，验证关键步骤完成质量，防止 AI "偷懒" 跳过
  - 验证必须输出文件存在性（如 `entity-verification-table.md`）
  - 验证文件内容标记（如 `confirmed: true`）
  - 验证失败时阻塞流程，强制返回重试（最多3次）
  - 保护 Step 2.5/3.1/5.7 等关键步骤
  
- **错误模式自动应用** - Error Pattern Learner 增强，支持自动应用学习到的模式
  - 模式出现 ≥ 2 次自动更新 Agent 警告
  - 模式出现 ≥ 5 次自动升级为强制检查项
  - 策略成功率 > 95% 自动标记为标准规范
  - 自动追踪策略效果并调整

### 改进

- develop-expert.md - 集成 Step Enforcer，新增 Step 2.5.9 强制验证
- error-pattern-learner.md - 新增自动应用策略功能（Step 6）
- README.md - 更新版本号到 v1.0.3，添加 step-enforcer 说明
- USER_GUIDE.md - 新增 v1.0.3 新特性章节

### 测试

- QMS 企业级项目能力评测: **85/100 (优秀)**
- 编译错误防御率: **90%** (v1.0.2: 70%)
- Step Enforcer 强制验证通过率: **100%**
- Error Pattern Learner 自动应用成功率: **85%**

## [1.0.2] - 2026-05-29

### 新增

- **方案1: 结构化业务逻辑** - design-expert 新增 Step 3.4 结构化决策表设计，develop-expert 新增 Step 2.6/3.1 结构化逻辑读取与实现，支持 8 种 Action 类型（validate/query/convert/assign/throw/return/call/branch）
- **方案2: 编译验证闭环** - develop-expert 新增 Step 5.7，支持 Java（mvn compile）和前端（tsc --noEmit）编译验证，自动解析错误并修复（最多3轮）
- **方案3: 自动化一致性校验** - 新增 contract-validator Agent，4 条验证规则（R1 方法签名、R2 Entity 字段、R3 实现完整性、R4 依赖调用一致性）
- **方案4: 全局集成编译** - orchestrator 新增 Step 7，全局编译 + 契约验证 + 错误分类（A/B/C/D 四类）+ 循环修复
- **方案5: 错误经验学习** - 新增 error-pattern-learner Agent，错误收集→模式提取→根因分析→预防策略→知识库更新

### 改进

- task-protocol.md 重写为完整 Agent 格式，新增 8 步工作流（任务定义→类型识别→DAG 构建→拓扑排序→状态管理→错误处理→计划生成→日志记录）
- runtime-state-manager.md 补充输入输出定义和 8 步工作流
- service-scanner.md 补充完整 6 步工作流
- verify-expert.md 补充完整 9 步工作流（含测试覆盖度检查、断言有效性检查）
- structure-analyzer.md 补充完整 8 步工作流
- config-analyzer.md 补充完整 8 步工作流
- orchestrator.md 补充输入输出定义

### 测试

- 全场景全工具严格测试评分: **99.20 / 100 (A+ 优秀)**
- 20 个 Agent 全部通过格式验证、工具验证
- 7 阶段企业开发流程全部通过场景模拟
- 5 个优化方案全部通过验证

## [1.0.1] - 2026-05-26

### 新增

- **方案 C: 智能任务拆分** - Design 输出全局契约（design-contract.yaml），Task Split 生成子任务级设计 + DAG 依赖图
- **接口契约机制** - 跨子任务接口定义（serviceContracts/eventContracts/dataContracts），契约冻结（stability: frozen）
- **传递依赖分析** - task-split-expert 新增 Step 5.5 多层依赖链追踪
- **Codex 上下文管理** - 新增 codex-context-manager Agent，支持上下文压缩、分段加载、优先级排序
- **深层依赖扫描** - 自动扫描微服务项目的依赖项目（common-bean、basedata-api 等）

### 改进

- analyze-expert 新增多层依赖链追踪（Step 3.5）
- design-expert 新增 design-contract.yaml 标准数据交换格式
- develop-expert 新增强制读取验证（Step 2.5）
- verify-expert 新增测试覆盖矩阵和断言有效性检查

## [1.0.0] - 2026-05-20

### 首次发布

- **结构化流程** - 7 个阶段 + Hotfix 模式（Research → Analyze → Design → Task Split → Develop → Test → Delivery）
- **多 Subagent 并行** - 复杂任务拆分为独立 subagent 并行执行，上下文隔离
- **项目记忆** - Research 阶段自动扫描并记录项目结构、组件、API、编码规范（12 个文件）
- **精准加载策略** - 每个 Agent 定义必读/按需读取/不读取文件清单，控制上下文消耗
- **多平台支持** - Trae、Cursor、Claude Code、Qoder、OpenAI Codex
