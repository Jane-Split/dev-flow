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
- 详见 `agents/task-protocol.md`

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
- ❌ **用 `log.info()`/`log.warn()`/`log.debug()` 替代实际业务调用**（如 SAP 推送、消息发送、邮件通知等）
- ❌ **方法体仅包含日志记录而无实质性业务操作**
- ❌ 跳过任何阶段（除非用户明确要求）
- ❌ 在未读取项目记忆的情况下生成代码

---

## 阶段指令路由

> **按需加载机制**：每个阶段的详细指令已拆分为独立文件。进入对应阶段时，读取对应文件获取详细指令。
> 这样做可以将 SKILL.md 的体积从 140KB 降低到 ~25KB，为代码生成释放 80%+ 的上下文空间。

| 阶段 | 指令文件 | 加载时机 |
|------|---------|---------|
| Research（项目调研） | `stages/research.md` | 进入阶段一 |
| Analyze（需求分析） | `stages/analyze.md` | 进入阶段二 |
| Design（详细设计） | `stages/design.md` | 进入阶段三 |
| Task Split（任务拆分） | `stages/task-split.md` | 进入阶段四 |
| **Develop（开发执行）** | **`stages/develop.md`** | **进入阶段五** |
| Unit Test（单元测试） | `stages/unit-test.md` | 进入阶段六 |
| Fix（Bug 修复） | `stages/fix.md` | 进入阶段七 |
| Hotfix（独立模式） | `stages/hotfix.md` | 使用 Hotfix 模式 |
| Smoke Test（冒烟测试） | `stages/smoke-test.md` | 进入阶段八 |
| Integration Test（集成测试） | `stages/integration-test.md` | 进入阶段九 |
| Delivery（交付报告） | `stages/delivery.md` | 进入阶段十 |

### 加载规则

1. **标准模式**：按顺序进入每个阶段时，读取对应阶段的指令文件
2. **Subagent 模式**：每个 subagent 只加载自己阶段的指令文件
3. **Develop 阶段额外加载**：进入 Develop 阶段时，还需加载 `stages/code-reference.md`（包含代码模板和错误模式）
4. **跳过的阶段不加载**：如果用户要求跳过某个阶段，该阶段的指令文件不需要加载

### 标准模式执行流程

> 当用户输入 `/dev-flow <需求>` 时，按以下步骤依次执行：

```
Step 1: 读取阶段指令 → Read stages/research.md
Step 2: 执行 Research 阶段 → 扫描项目，生成 memory/
Step 3: 暂停 → 展示调研结果，等待用户确认
  ↓ 用户确认
Step 4: 读取阶段指令 → Read stages/analyze.md
Step 5: 执行 Analyze 阶段 → 分析需求，输出分析文档
Step 6: 暂停 → 展示分析结果，等待用户确认
  ↓ 用户确认
Step 7: 读取阶段指令 → Read stages/design.md
Step 8: 执行 Design 阶段 → 详细设计，输出设计文档
Step 9: 暂停 → 展示设计方案，等待用户确认
  ↓ 用户确认
Step 10: 读取阶段指令 → Read stages/task-split.md
Step 11: 执行 Task Split → 拆分任务，输出任务清单
Step 12: 暂停 → 展示任务清单，等待用户确认
  ↓ 用户确认
Step 13: 读取阶段指令 → Read stages/develop.md
        读取代码参考 → Read stages/code-reference.md
Step 14: 执行 Develop 阶段 → 编写完整代码
Step 15: 暂停 → 展示开发结果，等待用户确认
  ↓ 用户确认
Step 16: 读取阶段指令 → Read stages/unit-test.md
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

### 记忆目录结构

**Java 微服务（多服务模式）：**
```
.dev-flow/memory/                          # 根目录共享记忆（全局）
├── project-overview.md                    # 微服务架构总览（所有服务、技术栈、端口）
├── conventions.md                         # 项目级编码规范（从公共模块推断）
├── service-registry.md                    # 服务注册表（服务名、端口、角色、子模块列表）
├── dependency-graph.md                    # 服务间依赖图谱（谁依赖谁、Feign 调用关系）
├── common-modules.md                      # 公共模块清单（通用 Entity/DTO/Util/Enum）
├── patterns.md                            # 常见代码模式
├── mistakes.md                            # 常见错误及修复
├── preferences.md                         # 用户偏好
└── decisions.md                           # 架构决策记录

service-a/.dev-flow/memory/                # 服务 A 专属记忆
├── modules.md                             # 服务 A 的模块清单（Entity/Mapper/Service/Controller/DTO/Enum）
├── apis.md                                # 服务 A 的 API 列表
├── models.md                              # 服务 A 的数据模型
├── config.md                              # 服务 A 的配置信息
└── architecture.md                        # 服务 A 的架构决策

service-b/.dev-flow/memory/                # 服务 B 专属记忆
├── modules.md                             # 服务 B 的模块清单
├── apis.md                                # 服务 B 的 API 列表
├── models.md                              # 服务 B 的数据模型
├── config.md                              # 服务 B 的配置信息
└── architecture.md                        # 服务 B 的架构决策
```

**service-registry.md 说明**：记录所有服务的元信息，包括服务名、目录路径、端口、角色（网关/认证/业务/公共）、子模块列表（自动发现，不硬编码模块名）。

**dependency-graph.md 说明**：记录服务间的依赖关系和 Feign 调用关系，包括调用方服务、被调用方服务、Feign Client 接口名、方法签名。

**common-modules.md 说明**：记录所有公共模块中可复用的类，包括通用 Entity、DTO、Enum、Util、Exception 等，供各服务开发时优先复用。公共模块通过内容分析识别（被其他服务依赖、无启动类、无配置文件），不依赖命名模式。

**Java 单服务项目：**
```
.dev-flow/memory/
├── project-overview.md    # 项目概览
├── conventions.md         # 编码规范
├── modules.md             # 已有模块（Java: Entity/Mapper/Service/Controller/DTO/Enum）
├── apis.md                # 已有 API
├── models.md              # 数据模型（Entity、DTO、数据库表）
├── utils.md               # 工具类
├── config.md              # 配置信息
├── architecture.md        # 架构决策
├── patterns.md            # 常见代码模式
├── mistakes.md            # 常见错误及修复
├── preferences.md         # 用户偏好
└── decisions.md           # 历史架构决策
```

**前端项目：**
```
.dev-flow/memory/
├── project-overview.md    # 项目概览
├── conventions.md         # 编码规范
├── components.md          # 已有组件
├── apis.md                # 已有 API
├── models.md              # 数据模型
├── utils.md               # 工具函数
└── architecture.md        # 架构决策
```

### 记忆使用规则

**读取时机**：
- Develop 前：必须读取 conventions、modules/components、apis、utils、patterns、mistakes
- Design 前：必须读取 project-overview、architecture、decisions
- Analyze 前：必须读取 modules/components、apis、models
- **多服务模式额外读取时机**：
  - Analyze 前：必须读取 service-registry.md、dependency-graph.md、common-modules.md
  - Design 前：必须读取 service-registry.md、dependency-graph.md、common-modules.md
  - Develop 前：必须读取 service-registry.md、dependency-graph.md、common-modules.md
  - 开发某服务时：读取该服务的 `.dev-flow/memory/modules.md`（如有）

**更新时机**：
- Research 完成后：创建/更新所有记忆文件
- Develop 完成后：更新 modules/components、apis、models、patterns
- Fix 完成后：更新 mistakes（记录新错误模式）
- 用户反馈后：更新 preferences（记录偏好）
- **多服务模式额外更新时机**：
  - 新增/删除服务后：更新 service-registry.md、dependency-graph.md
  - 新增/修改 Feign Client 后：更新 dependency-graph.md
  - 公共模块变更后：更新 common-modules.md

### 记忆文件格式

所有记忆文件使用 Markdown 格式，方便 AI 直接读取和理解：

**Java 项目 project-overview.md 示例**：
```markdown
# 项目概览

## 技术栈
- 语言：Java 17
- 框架：Spring Boot 3.2.5
- ORM：MyBatis-Plus 3.5.5
- 数据库：MySQL 8.0
- 缓存：Redis 7.0
- 消息队列：RabbitMQ / Kafka
- 远程调用：OpenFeign
- 对象映射：MapStruct
- 工具库：Lombok、Hutool
- 测试：JUnit 5 + Mockito
- 构建：Maven 3.9

## 目录结构
\`\`\`
src/main/java/com/example/project/
├── config/          # 配置类
├── controller/      # REST API 控制器
├── service/         # 业务逻辑层
│   └── impl/        # 服务实现
├── mapper/          # 数据访问层
├── entity/          # 实体类
├── dto/             # 数据传输对象
├── enums/           # 枚举类
├── exception/       # 异常处理
└── util/            # 工具类

src/main/resources/
├── mapper/          # MyBatis XML 映射文件
├── application.yml  # 应用配置
└── application-dev.yml  # 开发环境配置
\`\`\`

## 入口文件
- 启动类：src/main/java/com/example/project/Application.java
- 配置：src/main/resources/application.yml
```

**Java 项目 modules.md 示例**：
```markdown
# 已有模块

## Entity

### Order
- 路径：entity/Order.java
- 表名：t_order
- 主键：id（自增）
- 字段：orderNo, userId, amount, status, createTime, updateTime
- 关联：User（多对一）

## Mapper

### OrderMapper
- 路径：mapper/OrderMapper.java
- 继承：BaseMapper<Order>
- 自定义方法：selectByOrderNo, selectByUserId

## Service

### OrderService
- 接口路径：service/OrderService.java
- 实现路径：service/impl/OrderServiceImpl.java
- 方法：
  - ApiResponse<Order> createOrder(CreateOrderRequest request)
  - ApiResponse<Order> getById(Long id)
  - ApiResponse<PageResult<Order>> list(PageQueryRequest request)

## Controller

### OrderController
- 路径：controller/OrderController.java
- 基础路径：/api/orders
- 端点：
  - POST / - 创建订单
  - GET /{id} - 查询订单
  - GET / - 订单列表

## DTO

### CreateOrderRequest
- 路径：dto/CreateOrderRequest.java
- 字段：userId, items, address
- 校验：@NotNull, @Size

## Enum

### OrderStatus
- 路径：enums/OrderStatus.java
- 值：PENDING(0, "待支付"), PAID(1, "已支付"), SHIPPED(2, "已发货"), COMPLETED(3, "已完成"), CANCELLED(4, "已取消")
```

**前端项目 project-overview.md 示例**：
```markdown
# 项目概览

## 技术栈
- 语言：TypeScript
- 框架：React 18 + Express 4
- 数据库：PostgreSQL + Prisma ORM
- 测试：Vitest + Playwright
- 构建：Vite

## 目录结构
\`\`\`
src/
├── components/    # React 组件
├── api/           # Express 路由
├── services/      # 业务逻辑
├── models/        # Prisma 模型
├── utils/         # 工具函数
└── hooks/         # React Hooks
\`\`\`

## 入口文件
- 前端：src/main.tsx
- 后端：src/server.ts
```

**前端项目 components.md 示例**：
```markdown
# 已有组件

## Button
- 路径：src/components/Button.tsx
- 类型：展示组件
- Props：{ variant: 'primary' | 'secondary'; size: 'sm' | 'md' | 'lg'; disabled?: boolean; children: ReactNode }
- 用途：通用按钮组件
```

---

---

## 学习能力

dev-flow 具备从用户反馈中学习的能力，通过持续积累项目知识，实现"越用越好用"。

### 学习来源

**1. 用户显式反馈**
- 用户说"这段代码很好，以后都按这个风格"→ 更新 preferences.md
- 用户说"这个错误又出现了"→ 更新 mistakes.md
- 用户修改了 AI 生成的代码 → 分析差异，更新 patterns.md

**2. 隐式学习**
- 观察用户如何修改 AI 生成的代码
- 统计哪些代码模式被复用最多
- 记录哪些错误反复出现

**3. 阶段间学习**
- Test 阶段发现的 Bug → 更新 mistakes.md
- Fix 阶段的修复方案 → 更新 patterns.md
- Develop 阶段的新模式 → 更新 patterns.md

### 学习动作

当发生以下情况时，AI 应主动学习和更新记忆：

| 场景 | 学习动作 | 更新文件 |
|------|----------|----------|
| 用户表扬某段代码 | 记录代码模式，标记为"推荐" | patterns.md |
| 用户修改 AI 生成的代码 | 分析修改原因，更新偏好或模式 | preferences.md / patterns.md |
| 测试发现 Bug | 记录错误模式和修复方案 | mistakes.md |
| 用户明确指定偏好 | 记录偏好设置 | preferences.md |
| 重大架构决策 | 记录决策和原因 | decisions.md |
| 某模式被复用 3 次以上 | 标记为"高频模式" | patterns.md |

### 学习示例

**示例 1：从用户修改中学习**

AI 生成的代码：
```typescript
const handleSubmit = async (data) => {
  await api.createUser(data);
  router.push('/users');
};
```

用户修改为：
```typescript
const handleSubmit = async (data) => {
  try {
    await api.createUser(data);
    toast.success('用户创建成功');
    router.push('/users');
  } catch (error) {
    toast.error(error.message);
  }
};
```

AI 学习：用户偏好添加 toast 提示 → 更新 preferences.md
AI 学习：API 调用需要 try-catch + toast → 更新 patterns.md

**示例 2：从错误中学习**

Test 阶段发现：组件未处理 loading 状态导致测试失败
Fix 阶段修复：添加 loading 状态处理

AI 学习：记录"忘记处理 loading 状态"为常见错误 → 更新 mistakes.md
AI 学习：记录"标准 loading 处理模式" → 更新 patterns.md

### 学习效果评估

通过以下指标评估学习效果：

| 指标 | 目标 | 评估方式 |
|------|------|----------|
| 代码接受率 | > 80% | 用户修改 AI 生成代码的比例降低 |
| Bug 重复率 | < 10% | 同一错误不出现超过 2 次 |
| 模式复用率 | > 60% | 新代码复用已有模式的比例 |
| 用户满意度 | > 4.5/5 | 用户主观评价 |

### 学习提示

在每个阶段结束时，AI 应主动询问用户：

- **Research 后**："调研结果是否符合项目实际情况？有需要补充的吗？"
- **Develop 后**："代码风格是否符合您的预期？有哪些需要调整的地方？"
- **Fix 后**："修复方案是否解决了问题？这个错误以前出现过吗？"

通过持续收集反馈，dev-flow 会越来越了解项目和用户的偏好，生成越来越符合预期的代码。
