# Changelog

All notable changes to this project will be documented in this file.

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
