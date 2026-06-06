# Changelog

All notable changes to this project will be documented in this file.

## [3.2.0] - 2026-06-06

### Router 瘦身重构（核心优化）

**目标**：将 Router（SKILL.md）从 49KB 瘦身至 ~23KB（-53%），详细内容外置到独立 reference 文件按需加载，最大化初始上下文可用空间。

**根因**：v3.0.0~v3.1.0 每次加新功能时，都把内容直接堆进 SKILL.md，缺乏"这段内容是否应该放在这里"的判断，导致 Router 从 17KB 膨胀到 49KB。

#### 优化方案

**核心原则**：
> **Router 只保留"主 Agent 随时需要知道的全局规则 + 路由表"；**
> **阶段专属逻辑 → 移入对应 stage 文件；**
> **详细协议和模板 → 移入 references，按需加载。**

#### 1. 零编辑铁律 v2.0（~8KB → ~3KB）

**保留在 Router**：
- 核心约束（主 Agent 不直接编辑文件）
- 文件白名单表格（2 行，必须始终可见）
- 违规检测与纠正（1-2 句话）

**移入 `references/zero-edit-audit.md`**：
- 溯源要求详情（`@generated-by` 注释格式）
- 文件修改审计详细流程
- 审计结果 YAML 格式详情

#### 2. Subagent 失败硬阻断（~10KB → ~3KB）

**保留在 Router**：
- 三级协议摘要（L1/L2/L3 各 2-3 行）
- 禁止行为表（紧凑）
- 一句话强调"不可跳过任何级别"

**移入 `references/failure-decision-tree.md`**：
- 详细决策树（ASCII 图）
- Level 2 诊断报告模板
- Level 3 升级报告模板

#### 3. 统一 Subagent 执行架构（~8KB → ~4KB）

**保留在 Router**：
- 核心原则（1-2 句话）
- 主/从角色表格（紧凑）
- Subagent 架构 ASCII 图（保留，但压缩注释）

**移入 `references/platform-adapters.md`**：
- 5 个平台的详细适配规则
- 上下文监控机制详情
- Subagent 调度策略表格

#### 4. 全局规则（~10KB → ~5KB）

**保留在 Router**：
- 执行原则 6 条（紧凑）
- 阶段确认机制核心规则（4 行）
- 禁止事项列表（紧凑）

**移入 `references/deliverable-protocol.md`**：
- 交付物目录结构详情
- 主 Agent 审批流程详情
- 确认文件 YAML 格式详情
- 标准 Checklist 模板

**移入 `references/gate-checks.md`**：
- Gate-1.5 交付物存在性检查详情
- Gate-2.5 执行者审计详情
- 确认文件内容校验规则详情

#### 5. 阶段指令路由（~5KB → ~3KB）

**保留在 Router**：
- 路由表格（紧凑）
- Gate-1 前置确认检查（核心逻辑）
- 加载规则 4 条（紧凑）

**移入 `references/gate-checks.md`**（已创建）：
- Gate-1.5 交付物存在性检查详情
- Gate-2.5 执行者审计详情
- 确认文件校验规则

**压缩**：
- 主 Agent 调度流程中对每个阶段的重复描述，改为"各阶段统一流程见 `references/stage-execution-flow.md`"

#### 6. 开发规模分级（~5KB → ~2KB）

**保留在 Router**：
- 模式检测规则（紧凑）
- 模式动态重评估网关核心逻辑（压缩为 10 行摘要）

**移入 `references/mode-comparison.md`**：
- 模式对比速查表
- 手动覆盖规则详情

#### 7. 冗余内容移除（~4KB）

**完全移除**（已在 `stages/research.md` 中重复）：
- `### 项目类型检测`（~1.5KB）
- `### 微服务架构检测`（~2.5KB）

**改为指针**：
- → 详见 `{{STAGES_PATH}}research.md`（Research 阶段指令文件）

### 新增 Reference 文件（6 个）

| 文件 | 大小 | 加载时机 | 内容 |
|------|------|---------|------|
| `references/zero-edit-audit.md` | ~5KB | 零编辑铁律违规审计时 | 溯源格式、审计流程、audit-log.yaml 格式 |
| `references/failure-decision-tree.md` | ~7KB | Subagent 失败处理时 | 决策树、L2/L3 报告模板 |
| `references/deliverable-protocol.md` | ~5KB | 阶段交付物生成时 | 交付物结构、审批流程、Checklist 模板 |
| `references/gate-checks.md` | ~2KB | 阶段门禁检查时 | Gate-1.5/2.5 详情、校验规则 |
| `references/mode-comparison.md` | ~3KB | 开发模式选择时 | 模式对比表、手动覆盖规则 |
| `references/platform-adapters.md` | ~4KB | Subagent 调度时 | 5 平台适配规则、调度策略 |

### 预期效果

| 指标 | v3.1.0 | v3.2.0 | 变化 |
|------|---------|---------|------|
| Router 体积 | ~49KB | **~23KB** | **-53%** |
| 始终加载内容 | ~49KB | **~23KB** | **-53%** |
| References 文件数 | 4 个 | **10 个** | +6 个 |
| 代码生成可用上下文 | ~50% | **~70%** | **+20%** |

### 构建系统升级

- `scripts/build.cjs` 新增 6 个 reference 文件的复制和路径替换逻辑
- 构建验证新增 reference 文件存在性检查
- `scripts/version-check.js` 版本号一致性检查更新（package.json + README + CHANGELOG + SKILL.md）

### 修改文件清单

**新增**：
- `skill-templates/_core/references/zero-edit-audit.md`
- `skill-templates/_core/references/failure-decision-tree.md`
- `skill-templates/_core/references/deliverable-protocol.md`
- `skill-templates/_core/references/gate-checks.md`
- `skill-templates/_core/references/mode-comparison.md`
- `skill-templates/_core/references/platform-adapters.md`

**修改**：
- `skill-templates/_core/SKILL.md` — Router 瘦身至 ~23KB，新增 6 处 `{{REFERENCES_PATH}}xxx.md` 引用
- `README.md` — 版本号 v3.1.0 → v3.2.0，更新架构描述、Router 大小、reference 文件列表
- `USER_GUIDE.md` — 同步更新，移除历史迭代记录
- `CHANGELOG.md` — 新增 v3.2.0 条目（本文档）
- `package.json` — 版本号 3.1.0 → 3.2.0

**删除**：
- 无（所有历史功能保留，只是内容位置调整）

### 风险提示与验证

1. **Reference 加载时机必须验证**：移出去的内容在需要时必须能被正确加载。需要在构建脚本中验证每个 reference 的注入点是否正确。
2. **阶段文件冗余检查**：全局规则里的"项目类型检测"和"微服务检测"已经存在于 `research.md` 中。需要确认后只保留一处，不能造成新的不一致。
3. **README 同步更新**：Router 瘦身完成后，README 里的架构描述、文件大小等需要同步更新（本次先把假的"17KB"改正确）。
4. **构建验证**：运行 `npm run build` 验证构建成功，检查所有 `{{REFERENCES_PATH}}` 引用路径是否正确指向新增的 reference 文件。

### 迁移指南

**无需迁移**。v3.2.0 是纯架构优化，不改变任何用户可见行为：
- 所有阶段交付物格式不变
- 所有 memory 文件格式不变
- 所有 Agent 文件不变
- 只是 Router（SKILL.md）内容重新组织，详细内容移到 references 按需加载

**唯一注意事项**：如果你在项目中自定义了 SKILL.md，需要手动合并 v3.2.0 的变更（建议重新安装 dev-flow）。
