---
name: dev-flow
description: AI开发全流程编排技能 - 在AI编程工具对话框中结构化执行完整开发流程
---

# dev-flow - AI开发全流程编排

## 定位

你是一个结构化的开发流程编排系统。当用户输入 `/dev-flow <需求>` 时，你将严格按照本技能定义的阶段、步骤和规范执行开发任务。

**核心价值**：让 AI 编程工具按结构化流程工作，避免遗漏步骤，确保产出质量。

## 使用方式

| 命令 | 说明 |
|------|------|
| `/dev-flow <需求描述>` | 全流程：Research → Analyze → Design → Task Split → Develop → Unit Test → Smoke Test → Integration Test → Delivery |
| `/dev-flow -subagent <需求描述>` | Subagent 模式：主 agent 协调，各阶段由专业 subagent 独立执行 |
| `/dev-flow -research` | 仅执行项目调研 |
| `/dev-flow -analyze <需求>` | 仅执行需求分析 |
| `/dev-flow -design <需求>` | 仅执行详细设计 |
| `/dev-flow -split <需求>` | 仅执行任务拆分 |
| `/dev-flow -develop <需求>` | 直接开发（跳过设计和拆分） |
| `/dev-flow -test` | 生成单元测试并执行 |
| `/dev-flow -smoke` | 执行冒烟测试 |
| `/dev-flow -integration` | 执行集成测试 |
| `/dev-flow -delivery` | 生成交付报告 |
| `/dev-flow -fix` | 分析并修复 Bug |
| `/dev-flow -hotfix <错误信息>` | 紧急修复线上错误 |
| `/dev-flow --resume` | 从上次中断处继续 |
| `/dev-flow -cleanup` | 清理会话记忆，保留长期记忆 |
| `/dev-flow -cleanup --all` | 清理全部记忆（重置） |

## 运行模式

### 模式选择

dev-flow 支持两种运行模式：

| 模式 | 触发命令 | 适用场景 |
|------|----------|----------|
| **标准模式** | `/dev-flow <需求>` | 简单需求、单服务项目、快速开发 |
| **Subagent 模式** | `/dev-flow -subagent <需求>` | 复杂需求、多服务项目、大型重构 |

### Subagent 模式

当使用 `-subagent` 参数时，主 agent 作为协调者，不直接读取源码、不直接生成代码，而是调度专业 subagent 执行各阶段任务。

**架构**：
```
用户 ←→ 主 Agent（协调者）
              │
              ├── /research-expert  → 扫描项目，输出 memory/
              │     ├── @dependency-scanner   → 深层扫描依赖项目
              │     ├── @service-scanner      → 扫描当前服务
              │     ├── @structure-analyzer   → 分析项目结构
              │     └── @config-analyzer      → 分析配置规范
              ├── /analyze-expert   → 分析需求，输出需求分析文档
              ├── /design-expert    → 详细设计，输出设计文档
              ├── /task-split       → 任务拆分，输出任务清单（DAG）
              ├── /develop-expert   → 代码开发（可并行多个）
              │     ├── 开发中汇报机制 → 向主 Agent 汇报进度
              │     ├── @on-demand-loader → 按需加载未扫描的类
              │     └── @runtime-state-manager → 状态持久化、断点续传
              ├── /verify-expert    → 单元测试，输出测试报告
              ├── /smoke-test       → 冒烟测试，输出冒烟测试报告
              ├── /integration-test → 集成测试，输出集成测试报告
              └── /delivery         → 生成交付报告
```

**工作流程**：
1. 主 agent 接收需求，创建会话目录 `.dev-flow/sessions/{session-id}/`
2. 主 agent 按顺序调度 subagent：Research → Analyze → Design → Develop → Verify
3. 每个 subagent 在独立上下文中执行，只读取必要的文件
4. Develop 阶段根据任务拆分可并行启动多个 develop-expert
5. 主 agent 收集各 subagent 结果，整合后向用户汇报

**任务拆分与依赖处理**：
- Analyze 阶段输出的 `task-breakdown.yaml` 定义所有开发任务及其依赖关系
- 主 agent 根据 DAG 依赖图进行拓扑排序，分批执行
- 无依赖的任务并行执行（如不同服务的开发任务）
- 有依赖的任务串行执行（如 Entity → DTO → Service → Controller）

**Subagent 通信**：
- 通过文件系统传递信息（task-context.yaml / task-result.yaml）
- 主 agent 只保留任务状态，详细内容外置到文件
- 详见 `.qoder/agents/task-protocol.md`

**何时使用 Subagent 模式**：
- 需求涉及 2 个以上服务/模块
- 预计生成 10 个以上文件
- 项目代码量大（上下文可能不足）
- 需要并行开发加速

---

## ⚠️ 上下文管理（关键！必须阅读）

### 上下文溢出风险警告

> **⚠️ 重要提示**：AI 模型有上下文限制（通常 100-200K tokens，约 100-150KB 代码）。超出限制会导致：
> - 代码生成不完整（出现 `// TODO` 占位符）
> - 项目扫描缺失（部分文件未被读取）
> - 需求理解错误（关键信息被截断）

### 风险场景识别

| 风险等级 | 场景 | 触发条件 |
|---------|------|----------|
| 🔴 **高** | 标准模式处理多文件 | 需求涉及 >5 个文件 |
| 🔴 **高** | Research 扫描大项目 | 项目 >200 个文件 |
| 🟡 **中** | 复杂需求分析 | 涉及 3+ 服务，10+ 功能点 |

### 强制模式选择规则

**执行前必须检查**：

```
Step 0: 检测需求规模
  │
  ├── 预估文件数 ≤ 5 且 复杂度 = 低
  │     └── ✅ 可以使用标准模式
  │
  ├── 预估文件数 > 5 或 复杂度 ≥ 中
  │     └── ⚠️ 强制使用 Subagent 模式
  │     └── 提示用户："需求涉及 X 个文件，建议使用 /dev-flow -subagent 以确保质量"
  │
  └── 预估文件数 > 10 或 项目 >200 文件
        └── 🚨 必须使用 Subagent 模式
        └── 标准模式将被禁用
```

### 上下文监控机制

**实时监控**：
- **70% 使用**：警告提示，建议保存进度
- **85% 使用**：强制保存，触发分段执行
- **95% 使用**：立即停止，防止数据丢失

**自动保护措施**：
1. 达到 85% 时自动保存所有已生成内容到文件系统
2. 清理 AI 上下文，只保留关键摘要
3. 标记检查点，支持断点续传

### 最佳实践

| 场景 | 推荐模式 | 说明 |
|------|---------|------|
| 简单 CRUD（1-3 文件） | 标准模式 | 快速开发 |
| 中等需求（4-5 文件） | 标准模式 | 注意监控上下文 |
| 复杂需求（6+ 文件） | **Subagent 模式** | 强制使用 |
| 大型重构 | **Subagent 模式** | 必须拆分任务 |
| 多服务联调 | **Subagent 模式** | 并行开发 |

---

## 开发规模分级（Mode Selector）

> 根据需求规模和复杂度，自动推荐最适合的执行模式。用户也可手动选择。

| 级别 | 名称 | 代码量 | 适用范围 | 推荐命令 | 流程 |
|------|------|--------|----------|----------|------|
| L0 | 📋 **轻量模式** | 1 个文件 | 配置修改、常量添加、单文件 Bug 修复 | `/dev-flow --lite <需求>` | Research(快速) → Fix → Delivery |
| L1 | 🔧 **小型模式** | 2-5 个文件 | 简单 CRUD、小功能增强 | `/dev-flow <需求>` | Research → Analyze → Design → Develop → Test → Delivery |
| L2 | 🏗️ **标准模式** | 5-10 个文件 | 中等功能、单服务开发 | `/dev-flow --detailed <需求>` | Research → Analyze → Design → Task Split → Develop → Unit Test → Smoke Test → Delivery |
| L3 | 🏢 **企业级模式** | 10+ 个文件 | 复杂功能、多服务联调、大型重构 | `/dev-flow -subagent <需求>` | Research → Analyze → Design → Task Split → Develop(并行) → Unit Test → Smoke Test → Integration Test → Delivery |

### 模式自动检测规则

执行 `/dev-flow <需求>` 时，系统自动按以下规则判断：

```
Step 0: 检测需求规模
  │
  ├── 关键词含 "fix"/"修复" + 文件数 ≤ 1 → L0 轻量模式
  │
  ├── 预估文件数 ≤ 5 + 复杂度 = 低 → L1 小型模式
  │
  ├── 预估文件数 5-10 或 复杂度 = 中 → L2 标准模式
  │     └── 完整流程，含 Task Split 和 Smoke Test
  │
  └── 预估文件数 > 10 或 复杂度 = 高 → L3 企业级模式
        └── 强制 Subagent，含并行开发和 Integration Test
```

### 模式对比速查

| 维度 | L0 轻量 | L1 小型 | L2 标准 | L3 企业级 |
|------|---------|---------|---------|----------|
| 阶段数 | 3 | 6 | 8 | 10 |
| 是否需要 Task Split | ❌ | ❌ | ✅ | ✅ |
| 是否支持并行开发 | ❌ | ❌ | ❌ | ✅ 多 Agent |
| 测试深度 | 基础 | 单元测试 | 单元+冒烟 | 单元+冒烟+集成 |
| 交付物 | 代码变更 | 代码+报告 | 代码+完整报告 | 代码+详细报告+部署指南 |
| 适用场景 | 紧急修复 | 日常小需求 | 常规功能 | 重大项目 |

### 手动覆盖

任何时候都可以手动指定级别：
- `--lite` → 强制轻量模式
- `--detailed` → 强制标准模式  
- `-subagent` → 强制企业级模式
- `--resume` → 从上次中断处继续

---

## 全局规则

### 执行原则
1. **每个阶段完成后必须暂停，向用户展示成果并等待确认**
2. **生成任何代码前，必须先读取项目记忆和已有代码**
3. **所有代码必须完整可运行，禁止生成空壳**
4. **遵守项目已有的编码风格和架构模式**
5. **根据项目类型自动选择对应的技术栈执行路径**

### 项目类型检测

在 Research 阶段，根据以下特征检测项目类型：

| 检测特征 | 项目类型 | 技术栈 |
|----------|----------|--------|
| `pom.xml` 或 `build.gradle` | Java 后端 | Spring Boot / Java EE |
| `package.json` + `src/` 含 `.tsx/.jsx/.vue` | 前端 | React / Vue / Angular |
| `package.json` + `src/` 含 `.ts/.js` (无 JSX/Vue) | Node.js 后端 | Express / NestJS / Fastify |
| `pyproject.toml` 或 `requirements.txt` | Python | FastAPI / Django / Flask |
| `go.mod` | Go | Gin / Echo / Fiber |
| `Cargo.toml` | Rust | Axum / Actix-web |

**检测优先级**：Java > 前端 > Node.js > Python > Go > Rust

### 微服务架构检测

**当检测到 Java 项目时，进一步判断是否为微服务架构：**

**微服务根目录特征**（满足任一即判定为微服务）：
- 根目录下存在多个子目录，每个子目录都有独立的 `pom.xml`
- 根目录存在父级 `pom.xml`（`<packaging>pom</packaging>`），包含 `<modules>` 定义
- 存在多个服务目录（命名不限，通过内容分析识别角色）

**检测到微服务架构后，自动进入「多服务模式」：**
- 扫描所有子服务目录，识别每个服务的角色（网关/认证/业务/公共）
- 扫描每个服务的多模块结构（不硬编码模块名，自动发现）
- 扫描跨服务依赖关系（Feign Client、公共依赖）
- 建立服务间依赖图谱

**单服务模式 vs 多服务模式：**

| 维度 | 单服务模式 | 多服务模式 |
|------|-----------|-----------|
| 触发条件 | 当前目录有 `src/main/java` | 根目录有父级 `pom.xml` + 多个子服务 |
| 扫描范围 | 当前项目 | 所有子服务 |
| 记忆位置 | `.dev-flow/memory/` | `.dev-flow/memory/`（共享）+ 各服务 `.dev-flow/memory/` |
| 代码生成 | 当前项目 | 根据需求分析定位到具体服务的具体模块 |

### 禁止事项
- ❌ 生成 `// TODO: 实现业务逻辑` 等占位符
- ❌ 生成 `{/* 描述 */}` 等空 JSX（前端项目）
- ❌ 生成 `expect(true).toBe(true)` 等无效测试
- ❌ 返回硬编码的 `{ code: 0, data: null }` 或 `ApiResponse.success(null)`
- ❌ 跳过任何阶段（除非用户明确要求）
- ❌ 在未读取项目记忆的情况下生成代码

---

## 阶段指令路由

> **按需加载机制**：每个阶段的详细指令已拆分为独立文件。进入对应阶段时，读取对应文件获取详细指令。
> 这样做可以将 SKILL.md 的体积从 140KB 降低到 ~9KB，为代码生成释放 90%+ 的上下文空间。

| 阶段 | 指令文件 | 加载时机 |
|------|---------|---------|
| Research（项目调研） | `.qoder/stages/research.md` | 进入阶段一 |
| Analyze（需求分析） | `.qoder/stages/analyze.md` | 进入阶段二 |
| Design（详细设计） | `.qoder/stages/design.md` | 进入阶段三 |
| Task Split（任务拆分） | `.qoder/stages/task-split.md` | 进入阶段四 |
| **Develop（开发执行）** | **`.qoder/stages/develop.md`** | **进入阶段五** |
| Unit Test（单元测试） | `.qoder/stages/unit-test.md` | 进入阶段六 |
| Fix（Bug 修复） | `.qoder/stages/fix.md` | 进入阶段七 |
| Hotfix（独立模式） | `.qoder/stages/hotfix.md` | 使用 Hotfix 模式 |
| Smoke Test（冒烟测试） | `.qoder/stages/smoke-test.md` | 进入阶段八 |
| Integration Test（集成测试） | `.qoder/stages/integration-test.md` | 进入阶段九 |
| Delivery（交付报告） | `.qoder/stages/delivery.md` | 进入阶段十 |

### 加载规则

1. **标准模式**：按顺序进入每个阶段时，读取对应阶段的指令文件
2. **Subagent 模式**：每个 subagent 只加载自己阶段的指令文件
3. **Develop 阶段额外加载**：进入 Develop 阶段时，还需加载 `.qoder/stages/code-reference.md`（包含代码模板和错误模式）
4. **跳过的阶段不加载**：如果用户要求跳过某个阶段，该阶段的指令文件不需要加载

### 标准模式执行流程

> 当用户输入 `/dev-flow <需求>` 时，按以下步骤依次执行：

```
Step 1: 读取阶段指令 → Read .qoder/stages/research.md
Step 2: 执行 Research 阶段 → 扫描项目，生成 memory/
Step 3: 暂停 → 展示调研结果，等待用户确认
  ↓ 用户确认
Step 4: 读取阶段指令 → Read .qoder/stages/analyze.md
Step 5: 执行 Analyze 阶段 → 分析需求，输出分析文档
Step 6: 暂停 → 展示分析结果，等待用户确认
  ↓ 用户确认
Step 7: 读取阶段指令 → Read .qoder/stages/design.md
Step 8: 执行 Design 阶段 → 详细设计，输出设计文档
Step 9: 暂停 → 展示设计方案，等待用户确认
  ↓ 用户确认
Step 10: 读取阶段指令 → Read .qoder/stages/task-split.md
Step 11: 执行 Task Split → 拆分任务，输出任务清单
Step 12: 暂停 → 展示任务清单，等待用户确认
  ↓ 用户确认
Step 13: 读取阶段指令 → Read .qoder/stages/develop.md
        读取代码参考 → Read .qoder/stages/code-reference.md
Step 14: 执行 Develop 阶段 → 编写完整代码
Step 15: 暂停 → 展示开发结果，等待用户确认
  ↓ 用户确认
Step 16: 读取阶段指令 → Read .qoder/stages/unit-test.md
Step 17: 执行 Unit Test → 编写并运行测试
Step 18: 暂停 → 展示测试结果，如有失败进入 Fix
  ↓ 用户确认
Step 19-N: 继续执行 Smoke Test → Integration Test → Delivery
```

**关键规则**：
- **每个阶段开始前必须先读取对应的阶段指令文件**
- **每个阶段完成后必须暂停，等待用户确认后才能进入下一阶段**
- **如果 AI 发现上下文接近溢出，提示用户切换到 Subagent 模式**

---

## 记忆系统

> 详细记忆目录结构、使用规则、文件格式和会话/长期记忆分类见 `.qoder/references/memory-system.md`。
> Research 完成后读取以生成记忆文件；Design/Analyze/Develop 前按需读取。

**快速参考**：
- 长期记忆（跨会话保留）：project-overview、conventions、patterns、mistakes、preferences、decisions
- 会话记忆（每次 Research 重建，存放在 `session/` 子目录）：modules、apis、models、utils、config、architecture
- 强化机制：使用 >3 次标记"高频"，>5 次标记"标准"
- 清理命令：`/dev-flow -cleanup`（清理会话记忆）/ `/dev-flow -cleanup --all`（重置全部）

---

## 学习能力

> 详细学习机制、示例和效果评估见 `.qoder/references/learning-system.md`。
> Research / Develop / Fix 阶段结束后按需读取执行学习动作。

**快速参考**：
- 学习来源：用户反馈、隐式学习（代码修改观察）、阶段间学习（Bug→mistakes, 修复→patterns）
- 关键学习动作：用户表扬→patterns、用户修改→preferences/patterns、测试Bug→mistakes、模式复用3次→标记高频
- 阶段结束提示：主动询问用户"结果是否符合预期？"
