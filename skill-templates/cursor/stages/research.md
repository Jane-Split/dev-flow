---
stage: Research
type: stage-instruction
---

## 阶段一：Research（项目调研）— 多子代理分批架构

### 🔔 入口 Banner（本阶段开始时输出）

```
▶ Research（项目调研）
════════════════════════════════════
目标：扫描项目结构，建立项目记忆
输出：.dev-flow/memory/（13 个文件）
架构：pre-scanner + 文件级子代理 × 11（4 批次）
预计：2-4 分钟
批次：4 批并行
════════════════════════════════════
```

### 触发条件
- 全流程模式自动触发
- 用户输入 `/dev-flow -research` 或 `/dev-flow --refresh`

### 🔴🔴 主 Agent 零编辑约束（本阶段入口铁律）

> **⚠️ 最高优先级**：主 Agent 在本阶段的唯一角色是**调度器**。
> **主 Agent 绝对禁止直接使用 Edit/Write 工具编辑本阶段的任何产出文件。**
> **所有文件编辑必须由专用 subagent 执行——pre-scanner 或 11 个文件级子代理。**
> **完整零编辑铁律见 `.cursor/references/protocol.md`。**

---

### 🔴 架构概述：pre-scanner + 文件级子代理

本阶段采用**双阶段多子代理架构**，从根本上解决微服务项目的上下文溢出和扫描不完整问题：

```
主 Agent（纯调度器，零编辑）
  │
  ├── Phase 0: pre-scanner subagent × 1
  │     └── 全局 Quick Scan + 模板文件初始化（mistakes.md/patterns.md）→ file-index.yaml
  │
  └── Phase 1: 文件级子代理 × 11（4 批次并行 + 串行）
        ├── Batch 1 (基础层, 3): project-overview, service-registry, architecture
        ├── Batch 2 (数据层, 3): common-modules, models, config
        ├── Batch 3 (行为层, 3): apis, utils, conventions
        └── Batch 4 (横切层, 2): dependency-graph, decisions
```

**核心原理**：
- **pre-scanner 做一次目录遍历 + 初始化模板文件**，11 个子代理不再重复扫描
- **每个文件子代理获得 file-index.yaml**，精确知道要读哪些源文件
- **每个子代理拥有独立上下文**（~25-40KB），Smart Sampling 可从容执行甚至全量读取
- **无需聚合器**——每个子代理直接写入目标 memory 文件，互不依赖
- **模板文件（mistakes.md/patterns.md）由 pre-scanner 创建初始模板，后续在 Fix/Develop 阶段持续积累**

---

### 🔴 Step 0: 智能判断是否需要扫描（执行前必须先检查）

> **目的**：避免重复全量扫描。如果项目记忆已经是最新的，直接跳过或增量更新。

**检查流程**（按顺序执行）：

**1. 检查记忆目录是否存在**
- [ ] `.dev-flow/memory/` 目录存在？
  - **否** → 执行完整 Research（从 Step 1 开始）
  - **是** → 继续检查

**2. 检查关键文件是否存在且非空**

| 项目类型 | 必须存在的文件 |
|----------|---------------|
| 所有项目 | `project-overview.md`、`conventions.md` |
| Java 微服务 | `common-modules.md`、`dependency-graph.md`、`models.md` |
| Java 单服务 | `models.md`、`apis.md` |
| 前端/Node.js | `components.md`、`apis.md` |

- [ ] 所有关键文件都存在且内容 > 100 字符？
  - **否**（有文件缺失或为空）→ 执行完整 Research
  - **是** → 继续检查

**3. 检查记忆新鲜度**

读取任意一个 memory 文件的首行，检查是否包含时间戳标记 `<!-- last-updated: YYYY-MM-DD HH:mm -->`：

- [ ] 时间戳在 **24 小时内**？
  - **是** → **询问用户**：
    ```
    检测到有效的项目记忆（{时间}，{N}小时前），是否跳过 Research 直接开始 Analyze？
    - 跳过 Research（推荐，如果项目没有重大变更）
    - 增量更新（仅扫描变更的部分）
    - 重新全量扫描
    ```
  - **否** → 继续检查

- [ ] 时间戳在 **7 天内**？
  - **是** → **静默执行增量更新**（不询问用户，直接进入增量更新流程）
  - **否** → **询问用户**：
    ```
    项目记忆已过期（{时间}，{N}天前），建议重新扫描。是否重新执行 Research？
    - 重新全量扫描（推荐）
    - 仍然使用旧记忆（可能缺少最新变更）
    ```

**4. 检查项目配置变更（增量更新判断）**

对比项目配置文件的修改时间与 memory 文件的修改时间：
- Java 项目：对比 `pom.xml` 的修改时间
- 前端项目：对比 `package.json` 的修改时间

- [ ] 配置文件修改时间 **晚于** memory 文件修改时间？
  - **是** → 执行**增量更新**（重新走 pre-scanner → 仅更新变更模块的 memory 文件）
  - **否** → 记忆有效，跳过 Research

**判断结果汇总**：

| 条件 | 操作 |
|------|------|
| 记忆不存在 | 执行完整 Research（Step 1-7） |
| 文件缺失/为空 | 执行完整 Research（Step 1-7） |
| 记忆 < 24h + 配置无变更 | **询问用户**是否跳过 |
| 记忆 < 7d + 配置有变更 | 静默增量更新 |
| 记忆 > 7d | **询问用户**是否重新扫描 |
| 用户选择跳过 | 直接进入 Analyze 阶段 |
| 用户选择增量更新 | 仅执行 pre-scanner → 比较 file-index diff → 更新变更的 memory 文件 |

---

### 📦 Phase 0: pre-scanner subagent（全局 Quick Scan）

> **🎯 目标**：执行一次全局 Quick Scan，输出结构化的 `file-index.yaml`，供后续 11 个文件子代理直接使用。
> **🔴 关键**：pre-scanner **不读取任何源文件内容**，只 Glob 路径和统计文件类型，上下文消耗极低（~15KB）。

**pre-scanner 执行步骤**：

#### Step P1: 检测项目类型和架构

- [ ] 读取项目根目录文件列表
- [ ] 检测项目类型（Java / 前端 / Node.js / Python / Go / Rust）
- [ ] 如果是 Java 项目，进一步检测是否为微服务：
  - 根目录有父 `pom.xml`（`<packaging>pom</packaging>`）且含 `<modules>` → **微服务**
  - 当前目录有 `src/main/java` → **单服务模式**
- [ ] 如果是微服务：读取父 `pom.xml` 的 `<modules>`，列出所有子服务
- [ ] 对每个子服务读取其 `pom.xml`（仅 `<groupId>`/`<artifactId>`/依赖列表），识别角色和依赖

#### Step P2: 全局 Quick Scan（文件路径索引）

**对每个服务/模块，扫描以下模式**：

| 扫描类别 | Glob 模式 | 记录内容 |
|----------|-----------|----------|
| Entity | `**/entity/*.java`、`**/*Entity*.java` | 路径、类名（从文件名推断） |
| DTO | `**/dto/*.java`、`**/model/dto/*.java` | 路径、类名 |
| Enum | `**/enums/*.java`、`**/*Enum.java` | 路径、类名 |
| Controller | `**/controller/*.java`、`**/*Controller.java` | 路径、类名 |
| Service | `**/service/*.java`、`**/*Service.java`、`**/*ServiceImpl.java` | 路径、类名 |
| Mapper | `**/mapper/*.java`、`**/*Mapper.java` | 路径、类名 |
| Util | `**/util/*.java`、`**/utils/*.java` | 路径、类名 |
| Config | `**/config/*.java`、`**/*Config.java` | 路径、类名 |
| Feign Client | `**/*Client.java`、`**/*Api.java`（含 `@FeignClient` 的） | 路径、类名 |
| 配置文件 | `**/application*.yml`、`**/bootstrap*.yml`、`**/pom.xml` | 路径 |
| 中间件/框架 | pom.xml 中的依赖：PowerJob/XXL-Job/RabbitMQ/Kafka/Redis/ES/MinIO | 依赖名 |

**🔴 pre-scanner 行为约束**：
- **只 Glob，不 Read**——文件路径列表，不读取内容
- **核心类仍要 Glob**：含 `Base`、`Abstract`、`Core`、`Common` 关键字的类必须 Glob 到
- **公共模块全量 Glob**：common-bean、common-core 等模块的 Entity/Enum/DTO 全量 Glob
- **时间戳**：每个文件 Glob 时记录文件修改时间

#### Step P3: 输出 file-index.yaml

写入 `.dev-flow/memory/_index/file-index.yaml`，格式如下：

```yaml
# file-index.yaml — 由 pre-scanner 输出，供所有文件级子代理使用
project_root: "."
project_type: "java-microservice"

services:
  - name: "qms-quality-management"
    role: "business"
    directory: "qms-quality-management"
    pom: "qms-quality-management/pom.xml"
    entities:
      - path: "qms-quality-management/src/main/java/com/mom/quality/entity/QualityTask.java"
        class_name: "QualityTask"
      - path: "qms-quality-management/src/main/java/com/mom/quality/entity/QualityItem.java"
        class_name: "QualityItem"
    dtos:
      - path: "qms-quality-management/src/main/java/com/mom/quality/dto/QualityTaskDTO.java"
        class_name: "QualityTaskDTO"
    enums:
      - path: "qms-quality-management/src/main/java/com/mom/quality/enums/TaskStatus.java"
        class_name: "TaskStatus"
    controllers:
      - path: "qms-quality-management/src/main/java/com/mom/quality/controller/QualityTaskController.java"
        class_name: "QualityTaskController"
    services:
      - path: "qms-quality-management/src/main/java/com/mom/quality/service/QualityTaskService.java"
        class_name: "QualityTaskService"
      - path: "qms-quality-management/src/main/java/com/mom/quality/service/impl/QualityTaskServiceImpl.java"
        class_name: "QualityTaskServiceImpl"
    mappers:
      - path: "qms-quality-management/src/main/java/com/mom/quality/mapper/QualityTaskMapper.java"
        class_name: "QualityTaskMapper"
    utils: []
    configs:
      - path: "qms-quality-management/src/main/resources/application.yml"
    feign_clients: []
    dependencies:  # 从 pom.xml 解析的项目内依赖
      - artifact: "qms-common-bean"

  - name: "qms-auth"
    role: "auth"
    directory: "qms-auth"
    # ... 同上结构

common_modules:
  - name: "common-bean"
    directory: "qms-common-bean"
    pom: "qms-common-bean/pom.xml"
    entities:
      - path: "qms-common-bean/src/main/java/com/mom/common/bean/entity/BaseEntity.java"
        class_name: "BaseEntity"
        is_core: true  # 标记为核心类
      - path: "qms-common-bean/src/main/java/com/mom/common/bean/entity/TenantEntity.java"
        class_name: "TenantEntity"
        is_core: true
    dtos:
      - path: "qms-common-bean/src/main/java/com/mom/common/bean/dto/ResultDTO.java"
        class_name: "ResultDTO"
        is_core: true
    enums:
      - path: "qms-common-bean/src/main/java/com/mom/common/bean/enums/StatusEnum.java"
        class_name: "StatusEnum"
    utils: []
    configs: []

stats:
  total_java_files: 487
  total_config_files: 12
  total_pom_files: 5
  service_count: 3
  common_module_count: 2

generated_by: "pre-scanner subagent"
timestamp: "2026-06-05T23:30:00"
```

> **⚠️ 目录自动创建**：pre-scanner 写入前必须检查并创建 `.dev-flow/memory/_index/` 目录。

#### Step P3.5: 初始化模板文件

> pre-scanner 在完成 file-index.yaml 后，顺便创建 mistakes.md 和 patterns.md 的初始模板。

```
pre-scanner 同时创建两个模板文件：

文件: .dev-flow/memory/mistakes.md
内容:
  # 错误模式记录
  <!-- last-updated: {timestamp} -->
  > 本文件由 pre-scanner 初始化，在 Fix 阶段和开发过程中持续积累错误模式。

  ## 已识别的错误模式
  暂无记录，在 Fix 阶段和开发过程中持续积累。

文件: .dev-flow/memory/patterns.md
内容:
  # 代码模式记录
  <!-- last-updated: {timestamp} -->
  > 本文件由 pre-scanner 初始化，在开发过程中持续积累代码模式。

  ## 已识别的代码模式
  暂无已识别的代码模式，后续开发中持续记录。
```

> **🔴 注意**：pre-scanner 创建的模板文件也必须包含 `@generated-by` 溯源注释。

#### Step P4: pre-scanner 完成确认

pre-scanner 输出汇总：

```
📊 Quick Scan 完成
   - 项目类型: Java 微服务
   - 服务数量: 3
   - 公共模块: 2
   - Java 文件: 487
   - 配置文件: 12
   - file-index.yaml 已写入 (XX KB)
```

**主 Agent 角色**：等待 pre-scanner 完成 → 读取 file-index.yaml → 确认文件有效 → 进入 Phase 1 分批调度。

---

### 📦 Phase 1: 文件级子代理分批执行

> **🎯 目标**：11 个文件子代理分 4 批执行，每个子代理负责写入一个 memory 文件。
> 模板文件（mistakes.md/patterns.md）由 pre-scanner 在 Phase 0 创建，不单独占用子代理。
> **核心原则**：每个子代理获得 `file-index.yaml` → 从中找到目标文件路径 → 读取源文件内容 → 提取信息 → 直接写入目标 memory 文件。
> **独立性**：同一批次内的子代理**互不依赖**，可并行执行；不同批次间**无数据依赖**（所有信息来自 file-index.yaml + 源文件）。

#### 🔴 所有文件子代理通用指令

每个文件子代理必须遵循以下规则：

1. **输入**：读取 `file-index.yaml`，定位本文件所需的源码路径
2. **读取策略**：根据 `file-index.yaml` 中的路径精确读取源文件，**不做自己的 Glob**
3. **完整性**：`is_core: true` 标记的类**必须全量读取**；普通类的读取数量不应超过 `file-index.yaml` 中该类别的 80%
4. **输出**：直接写入目标 memory 文件，首行必须包含时间戳标记
5. **评级**：文件末尾追加 completeness_level（A/B/C/D）
6. **空值处理**：如果该类目无数据（如无 Feign Client），写入"暂无"而非留空
7. **禁止行为**：不得修改其他 memory 文件，不得修改 file-index.yaml

---

#### Batch 1：基础层（3 子代理，并行）

> **批次说明**：这三个文件构成项目基础认知，是所有后续阶段的"地图"。信息来源于 file-index.yaml 的顶层结构和 pom.xml。

##### 1a: project-overview-subagent
```
目标文件: .dev-flow/memory/project-overview.md
输入: file-index.yaml 的服务列表 + stats 统计 + 各服务角色
需读源码: 无（file-index 已含足够信息）
产出内容:
  - 技术栈（从 pom.xml 分析）
  - 服务列表表格（服务名/目录/角色/子模块）
  - 目录结构概览
  - stats 统计摘要
completeness: 基于 file-index 全局统计 → 通常为 A
```

##### 1b: service-registry-subagent
```
目标文件: .dev-flow/memory/service-registry.md
输入: file-index.yaml 的 services 列表 + 各服务 pom
需读源码: 每个服务的 pom.xml + application.yml（仅端口/服务名）
产出内容:
  - 服务列表表格（服务名/目录/端口/角色/子模块/启动类）
  - 跨服务调用关系表格（从 Feign Client 路径推断）
completeness: 所有服务已注册 → 通常为 A
```

##### 1c: architecture-subagent
```
目标文件: .dev-flow/memory/session/architecture.md
输入: file-index.yaml 的 services + common_modules
需读源码: 每个服务的 pom.xml（父 POM） + application.yml
产出内容:
  - 架构模式（微服务/单体）
  - 服务角色说明
  - 分层架构（Controller/Service/Mapper 等）
  - 技术选型理由
completeness: 架构信息完整 → 通常为 A
```

---

#### Batch 2：数据层（3 子代理，并行）

> **批次说明**：这三个文件聚焦"数据定义"——Entity/DTO/Config。需要从源码中提取字段、注解、配置项。

##### 2a: common-modules-subagent
```
目标文件: .dev-flow/memory/common-modules.md
输入: file-index.yaml 的 common_modules 部分
需读源码:
  - 所有 common_modules 的 Entity（is_core: true → 全量读取）
  - 所有 common_modules 的 DTO
  - 所有 common_modules 的 Enum（全量读取）
  - 所有 common_modules 的 Feign Client API（如有）
产出内容:
  - 每个公共模块的 Entity/DTO/Enum/Util/Feign 表格
  - 含完整类路径、字段、方法签名
completeness: 公共模块强制全量 → A
```

##### 2b: models-subagent
```
目标文件: .dev-flow/memory/session/models.md
输入: file-index.yaml 的所有 services.entities + services.dtos
需读源码:
  - 所有服务的 Entity 类（core 标记全量，普通类采样 ≤80%）
  - 所有服务的 DTO 类（采样策略同上）
  - common-modules Entity/DTO（已在 2a 产出，此处可选引用）
产出内容:
  - 每个服务的 Entity 表格（类名/路径/表名/字段/注解）
  - 每个服务的 DTO 表格（类名/路径/字段）
completeness: 服务级采样 → A（文件少时）或 B
```

##### 2c: config-subagent
```
目标文件: .dev-flow/memory/session/config.md
输入: file-index.yaml 的 services.configs + 中间件依赖
需读源码:
  - 所有 application*.yml / bootstrap*.yml
  - 所有 *Config.java（@Configuration 类）
产出内容:
  - 数据库配置（URL/用户名/连接池）
  - Redis/Nacos 配置
  - 中间件配置（MQ/ES/MinIO/调度框架）
  - 配置类表格
completeness: 配置文件全量读取 → A
```

---

#### Batch 3：行为层（3 子代理，并行）

> **批次说明**：这三个文件聚焦"行为定义"——API接口、工具类、编码规范。需要从 Controller/Service/Util 源码提取。

##### 3a: apis-subagent
```
目标文件: .dev-flow/memory/session/apis.md
输入: file-index.yaml 的 services.controllers + services.feign_clients
需读源码:
  - 所有服务的 Controller 类（提取 @RequestMapping 路径和方法签名）
  - 所有服务的 Feign Client 接口
产出内容:
  - 每个服务的 Controller API 表格（方法/路径/参数/返回）
  - 跨服务 Feign Client API 表格
completeness: 全部读取 → A
```

##### 3b: utils-subagent
```
目标文件: .dev-flow/memory/session/utils.md
输入: file-index.yaml 的 services.utils + common_modules 的 utils
需读源码:
  - 所有 utils 类（提取类名、方法签名）
  - 核心 Util（含 Base/Core/Common 关键字）→ 全量读取详细方法
产出内容:
  - 工具类表格（类名/路径/方法列表）
  - 标注来源（当前服务 vs 公共模块）
completeness: Util 全量 → A
```

##### 3c: conventions-subagent
```
目标文件: .dev-flow/memory/conventions.md
输入: file-index.yaml 所有类的注解特征（从路径推断）+ 公共模块核心类
需读源码:
  - common_modules 的核心类（BaseEntity/ResultDTO 等）→ 推断命名风格/注解/Lombok
  - 3-5 个代表性 Controller/Service/Entity 类 → 验证模式
  - pom.xml 中的 ORM 依赖（MyBatis-Plus vs JPA）
产出内容:
  - 命名规范（类名/方法/常量/包名）
  - 注解使用（Lombok/Spring 注解习惯）
  - ORM 框架 + 统一响应类 + 分页封装
  - DTO 转换方式（MapStruct/BeanUtils）
  - 异常处理模式
completeness: 基于采样推断 → B（因非全量）
```

---

#### Batch 4：横切层（2 子代理，并行）

> **批次说明**：这两个文件需要综合多个服务的信息来构建跨服务关系和记录架构决策。

##### 4a: dependency-graph-subagent
```
目标文件: .dev-flow/memory/dependency-graph.md
输入: file-index.yaml 的所有 services + services.dependencies
需读源码:
  - 每个服务的 feign_clients 列表 → 提取 @FeignClient 目标服务
  - 每个服务的 pom.xml 依赖列表
产出内容:
  - Maven 依赖关系表格
  - Feign 调用关系表格（调用方/被调方/接口）
  - 依赖链路图（文本 ASCII 图）
completeness: 全部依赖记录 → A
```

##### 4b: decisions-subagent
```
目标文件: .dev-flow/memory/decisions.md
输入: file-index.yaml + 已产出的 architecture.md（可从 memory 读取）
需读源码: 无（基于架构和配置推断）
产出内容:
  - 架构决策表格（已有决策/理由/日期）
  - 如无已识别的决策 → "暂无已识别的架构决策，后续开发中持续记录"
completeness: 初始化 → 默认为 B（待后续积累）
```

---

#### 🔴 Phase 1 主 Agent 调度规则

> **主 Agent 按以下批次顺序调度**，每批次内并行启动所有子代理。

```
Batch 1 (基础层): 并行启动 3 个子代理 → 等待全部完成
  ├── project-overview-subagent
  ├── service-registry-subagent
  └── architecture-subagent

Batch 2 (数据层): 并行启动 3 个子代理 → 等待全部完成
  ├── common-modules-subagent
  ├── models-subagent
  └── config-subagent

Batch 3 (行为层): 并行启动 3 个子代理 → 等待全部完成
  ├── apis-subagent
  ├── utils-subagent
  └── conventions-subagent

Batch 4 (横切层): 并行启动 2 个子代理 → 等待全部完成
  ├── dependency-graph-subagent
  └── decisions-subagent
```

**平台适配**：

| 平台 | 最大并行 | 批次策略 | 说明 |
|------|---------|---------|------|
| Claude | 16 | 全额并行（12 个一次性） | 16 并发上限足够 |
| Trae | 无限制 | 全额并行 | 无限制 |
| Cursor | 多 Task | 全额并行 | 多 Task 调用 |
| Qoder | 4 | 标准 4 批次 | 4 方向限制 |
| Codex | 6 | 2 批次合并（6+6） | 6 线程限制 |

> **Claude/Trae/Cursor**：可跳过批次限制，直接 12 个子代理一次性全并行（pre-scanner 完成后）。

**调度流程**：
```
主 Agent:
  1. 读取 file-index.yaml，验证完整性
  2. 根据平台选择批次策略
  3. 逐批启动子代理：
     - 当前批次的所有子代理同时启动
     - 等待当前批次全部完成（或失败触发硬阻断规则）
     - 进入下一批次
  4. 全部批次完成后 → 进入 Step 7 自检
```

---

### 🔴 增量更新（仅在 Step 0 判断需要时执行）

当记忆存在但配置有变更时，执行增量更新而非全量重扫：

1. **执行 pre-scanner**（Phase 0）：生成新的 file-index.yaml
2. **Diff file-index**：对比新旧 file-index，识别变更的服务/模块
3. **选择性重跑**：仅重新调度变更模块对应的文件子代理
   - 某服务的 Entity 新增 → 重跑 models-subagent
   - 新增 Feign Client → 重跑 dependency-graph-subagent + apis-subagent
   - 新增 Controller → 重跑 apis-subagent
4. **合并更新**：保留未变更的 memory 文件，更新变更的文件
5. 更新所有已修改文件的时间戳标记

---

#### ✅ Step 7：自检（全部文件子代理完成后执行）

> **主 Agent 执行**：汇总检查所有 13 个文件的状态。

- [ ] 所有 13 个 memory 文件都已创建？（含 2 个由 pre-scanner 创建的模板文件）
- [ ] 每个文件大小 > 50 字节？（非空检查）
- [ ] `common-modules.md` 包含依赖项目的类？（不能只有标题没有数据）
- [ ] `dependency-graph.md` 包含 Maven 依赖 + Feign 调用？
- [ ] `models.md` 包含当前服务和依赖服务的 Entity？
- [ ] `utils.md` 包含依赖项目的工具类？
- [ ] `apis.md` 包含 Feign Client API？
- [ ] `config.md` 包含数据库/Redis/中间件配置？
- [ ] `decisions.md` 和 `mistakes.md` 和 `patterns.md` 至少有"暂无"文字？
- [ ] 🔴 **每个 memory 文件的 completeness_level 均为 A 或 B？（公共模块必须为 A）**
- [ ] 🔴 **无 completeness_level = D 的文件？（D = 不完整，必须重新调度对应子代理）**

**失败处理**：如果某个文件缺失或不完整 → 重新调度对应的文件子代理（最多重试 1 次）。

---

### 输出格式

完成所有步骤后，输出以下汇总表：

**Java 微服务（多服务模式）：**
| 维度 | 结果 |
|------|------|
| 项目类型 | Java 微服务（多服务模式） |
| 语言/版本 | Java XX |
| 框架 | Spring Boot X.X.X + Spring Cloud |
| 注册中心 | Nacos / Eureka / Consul |
| 网关 | Spring Cloud Gateway |
| 服务数量 | X 个 |
| 公共模块 | X 个 |
| 跨服务调用 | X 个 Feign Client |
| **扫描架构** | pre-scanner + 11 文件子代理（4 批次） |
| 中间件 | 列出所有中间件 |
| 编码规范 | 从公共模块推断 |
| memory 文件 | 13/13 已写入 ✅ |

**Java 单服务项目：**
| 维度 | 结果 |
|------|------|
| 项目类型 | Java 后端 |
| 语言/版本 | Java XX |
| 框架 | Spring Boot X.X.X |
| ORM | MyBatis-Plus / JPA |
| 分层架构 | Controller / Service / Mapper / Entity / DTO / Enum / Config |
| Entity/Service/Controller 数量 | X / X / X |
| **扫描架构** | pre-scanner + 11 文件子代理（4 批次/全额并行） |
| memory 文件 | 13/13 已写入 ✅ |

**前端项目：**
| 维度 | 结果 |
|------|------|
| 项目类型 | 前端 |
| 语言 | TypeScript / JavaScript |
| 框架 | React / Vue / Angular |
| 组件/API 数量 | X / X |
| **扫描架构** | pre-scanner + 11 文件子代理（4 批次/全额并行） |
| memory 文件 | 13/13 已写入 ✅ |

**暂停，等待用户确认。**

---

### 🔴 Step 7.5：生成阶段交付物（v3.1.0 新增，强制执行）

> **目的**：生成独立的结构化审批文档，供用户审查后确认，而非仅在对话栏输出汇总表格。
> **此步骤不可跳过**。未生成交付物前不得展示确认清单。

**交付物路径**：`.dev-flow/deliverables/01-research-report.md`

**执行步骤**：
1. 按模板生成完整审批报告（含多子代理执行摘要、每批次状态、完整性评估、风险提醒）
2. 检查所有 memory 文件的 completeness_level 并写入报告
3. 写入 `.dev-flow/deliverables/01-research-report.md`
4. 在对话中使用 `open_result_view` 工具打开交付物供用户审查
5. 等待用户确认后，再进入阶段确认清单

> **🔴 硬约束**：主 Agent 不得仅在对话中输出汇总表格来代替交付物文档。
> 用户必须基于交付物文档进行审批，确认后方可进入下一阶段。

---

### ✅ 阶段确认清单

| # | 确认项 | 状态 |
|---|--------|------|
| 0 | **执行者审计**：本阶段由 pre-scanner + 11 文件子代理执行，主 Agent 未直接编辑任何文件 | ⬜ 待确认 |
| 1 | 项目类型和架构已正确识别 | ⬜ 待确认 |
| 2 | pre-scanner 已生成 file-index.yaml | ⬜ 待确认 |
| 3 | 所有 13 个 memory 文件已创建且非空 | ⬜ 待确认 |
| 4 | 依赖项目的 Entity/DTO/Enum/Util 已完整记录 | ⬜ 待确认 |
| 5 | 编码规范（命名/注解/统一响应/异常处理）已识别 | ⬜ 待确认 |
| 6 | 跨服务依赖关系和 Feign 调用链已完整记录（多服务模式） | ⬜ 待确认 |
| 7 | 中间件配置（DB/Redis/Nacos 等）已提取 | ⬜ 待确认 |
| 8 | 所有 memory 文件 completeness_level ≥ B | ⬜ 待确认 |

**用户操作**：确认无误 → 回复 "确认" 进入 Analyze 阶段；需要重新扫描 → 指出遗漏项

> **阶段确认机制和交付物协议详见 `.cursor/references/protocol.md`。**

---
