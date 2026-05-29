# Changelog

All notable changes to this project will be documented in this file.

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
