---
stage: Research
type: stage-instruction
---

## 阶段一：Research（项目调研）

### 🔔 入口 Banner（本阶段开始时输出）

```
▶ Research（项目调研）
════════════════════════════════════
目标：扫描项目结构，建立项目记忆
输出：.dev-flow/memory/（12 个文件）
模式：L1 / L2 / L3
预计：3-5 分钟
════════════════════════════════════
```

### 触发条件
- 全流程模式自动触发
- 用户输入 `/dev-flow -research` 或 `/dev-flow --refresh`

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
  - **是** → **静默执行增量更新**（不询问用户，直接进入 Step 4 增量更新）
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
  - **是** → 执行**增量更新**（Step 4）
  - **否** → 记忆有效，跳过 Research

**判断结果汇总**：

| 条件 | 操作 |
|------|------|
| 记忆不存在 | 执行完整 Research（Step 1-6） |
| 文件缺失/为空 | 执行完整 Research（Step 1-6） |
| 记忆 < 24h + 配置无变更 | **询问用户**是否跳过 |
| 记忆 < 7d + 配置有变更 | 静默增量更新 |
| 记忆 > 7d | **询问用户**是否重新扫描 |
| 用户选择跳过 | 直接进入 Analyze 阶段 |
| 用户选择增量更新 | 执行 Step 4 增量更新 |

---

#### Step 4: 增量更新（仅在需要时执行）

> **触发条件**：记忆存在但配置文件有变更，或用户选择增量更新。

1. 读取现有 memory 文件
2. 使用 Glob 扫描当前项目，对比 memory 中记录的文件列表
3. 识别**新增**、**修改**、**删除**的文件
4. 只扫描变更的部分：
   - 新增文件 → 读取并提取信息
   - 修改文件 → 重新读取并更新
   - 删除文件 → 从 memory 中移除
5. 合并更新到现有 memory 文件（保留未变更的内容）
6. 更新所有 memory 文件的时间戳标记

**时间戳格式**（写入每个 memory 文件首行）：
```markdown
<!-- last-updated: 2026-05-26 14:30 -->
```

---

### 🔴 必须按顺序执行的检查清单（完整扫描时执行）

> **规则**：以下每个步骤都必须完成，不能跳过。每完成一步打一个 ✅。如果某步无数据，必须写入"暂无数据"。

---

#### ✅ Step 1：检测项目类型和架构

- [ ] 读取项目根目录文件列表
- [ ] 检测项目类型（Java / 前端 / Node.js / Python / Go / Rust）
- [ ] 如果是 Java 项目，进一步检测是否为微服务：
  - 根目录有父 `pom.xml`（`<packaging>pom</packaging>`）且含 `<modules>` → **微服务（多服务模式）**
  - 当前目录有 `src/main/java` → **单服务模式**
- [ ] 如果是微服务：读取父 `pom.xml` 的 `<modules>`，列出所有子服务
- [ ] 对每个子服务读取其 `pom.xml`，识别角色（公共模块/网关/认证/业务）

---

#### ✅ Step 2：深层扫描依赖项目（🔴 最关键步骤，绝对不能跳过）

> **为什么关键**：后续开发需要依赖项目的 Entity/DTO/Enum/Util 才能生成正确代码。跳过此步 = 生成错误代码。

**操作方法**：

1. 读取当前服务的 `pom.xml`，找出所有 `<dependency>`
2. 区分两类依赖：
   - **项目内依赖**：`groupId` 与父 pom 的 `groupId` 一致 → 需要深层扫描
   - **第三方依赖**：`groupId` 为外部组织 → 记录到 config.md
3. **对每个项目内依赖，执行以下扫描**：

| 扫描类别 | Glob 模式 | 读取内容 |
|----------|-----------|----------|
| Entity | `**/entity/*.java`、`**/*Entity*.java` | 类名、表名(`@TableName`)、字段列表 |
| DTO | `**/dto/*.java` | 类名、字段列表 |
| Enum | `**/enums/*.java`、`**/*Enum.java` | 枚举名、所有枚举值 |
| Util | `**/util/*.java`、`**/utils/*.java` | 类名、方法签名 |
| Feign Client | `**/*Client.java`、`**/*Api.java` | 接口名、目标服务、方法签名 |
| Config | `**/config/*.java` | 配置类名、配置项 |

4. **分层扫描策略（防止上下文溢出）**：

   **第一层：Quick Scan（快速扫描）**
   - 只 Glob 文件路径，**不读取内容**
   - 记录：文件路径、文件名、修改时间
   - 输出：文件列表（占用上下文极小）
   - 目的：了解项目规模，为采样策略提供数据

   **第二层：Smart Sampling（智能采样）**
   - 根据文件类型和重要性，选择性深度读取
   - 采样规则：

   | 类别 | 最大读取数 | 采样策略 | 说明 |
   |------|-----------|----------|------|
   | Entity | 20 | 优先读取最近修改的 | 核心业务实体优先 |
   | DTO | 15 | 优先读取最近修改的 | 常用数据传输对象优先 |
   | Enum | 全部 | 全部读取（通常不多） | 枚举值必须完整 |
   | Util | 10 | 优先读取使用频率高的 | 常用工具类优先 |
   | Feign Client | 全部 | 全部读取（通常不多） | 跨服务接口必须完整 |
   | Config | 5 | 优先读取最近修改的 | 核心配置优先 |

   - 采样方法：
     ```
     1. 按修改时间排序（最近修改的优先）
     2. 按文件名关键字筛选（含 "Core"、"Base"、"Common" 的优先）
     3. 按引用关系筛选（被其他类引用的优先）
     4. 取前 N 个进行深度读取
     ```

   **第三层：On-Demand Loading（按需加载）**
   - 在 Develop 阶段发现需要未扫描的类时，触发增量扫描
   - 只读取需要的那个类，不重新扫描全部
   - 扫描结果缓存到 `.dev-flow/memory/on-demand-cache.yaml`

   **传统方式 vs 分层扫描对比**：
   ```
   传统方式（有风险）：
   - common-bean 有 100 个 Entity
   - 全部读取：100 × 5KB = 500KB
   - 结果：上下文溢出，后面 40 个 Entity 信息丢失

   分层扫描（安全）：
   - Quick Scan：100 个文件路径（5KB）
   - Smart Sampling：读取 20 个核心 Entity（100KB）
   - On-Demand：开发时需要其他 Entity 再读取
   - 结果：上下文占用 105KB，核心信息完整
   ```

5. **扫描执行流程**：
   ```
   Step 2.1: Quick Scan
     └── Glob 所有文件路径
     └── 统计各类别文件数量
     └── 判断是否超过阈值

   Step 2.2: Smart Sampling（如果文件数 > 阈值）
     └── 按采样规则选择文件
     └── 逐个 Read 前 80 行
     └── 提取类名、字段、注解

   Step 2.3: 记录扫描结果
     └── 已读取的文件：完整信息
     └── 未读取的文件：路径 + "未采样（按需加载）"
   ```

**示例**：
```
当前服务 qms-quality-management
  └── 依赖 qms-common-bean → Glob ../qms-common-bean/**/*.java → 提取 Entity/DTO/Enum/Util
  └── 依赖 qms-business-basedata-api → Glob ../qms-business-basedata/**/api/**/*.java → 提取 Feign Client/DTO
  └── 依赖 qms-workflow-api → Glob ../qms-workflow/**/api/**/*.java → 提取 Feign Client/DTO
```

---

#### ✅ Step 3：扫描当前服务源码

- [ ] 读取 `application.yml` / `bootstrap.yml`（端口、服务名、数据库、Redis、Nacos、中间件）
- [ ] 扫描当前服务各子模块的 Java 文件，按注解识别分层：
  - `@Entity` / `@TableName` → Entity
  - `@Service` → Service
  - `@RestController` / `@Controller` → Controller
  - `@Mapper` / `@Repository` → Mapper
  - `@Configuration` → Config
  - `@FeignClient` → Feign Client
  - 继承 `Enum` → Enum
- [ ] 扫描 `pom.xml` 中的中间件依赖（PowerJob、XXL-Job、RabbitMQ、Kafka、Redis、ES、MinIO 等）

---

#### ✅ Step 4：识别编码规范

- [ ] 从公共模块和现有代码中推断：
  - 命名风格（类名 PascalCase / 方法 camelCase / 常量 UPPER_SNAKE_CASE）
  - Lombok 使用（@Data, @Slf4j, @RequiredArgsConstructor）
  - ORM 框架（MyBatis-Plus / JPA）
  - 统一响应类（ResultDTO / ApiResponse / R）
  - 分页封装类（PageDTO / PageResult）
  - DTO 转换方式（MapStruct / BeanUtils / 手动）
  - 异常处理（BusinessException + @RestControllerAdvice）

---

#### ✅ Step 5：写入 memory 文件（🔴 每个文件必须有内容）

> **铁律**：每个文件必须写入具体内容。没有数据也要写"暂无数据"。空文件 = 执行失败。
> **时间戳**：每个文件首行必须写入时间戳标记 `<!-- last-updated: YYYY-MM-DD HH:mm -->`，用于 Step 0 智能判断。

**🔴 Step 5.0：清理会话记忆**（v2.0.0 新增）

在写入新的记忆文件之前，先执行会话记忆清理：
1. 删除 `.dev-flow/memory/session/` 目录下所有文件（会话记忆可安全重建）
2. **不删除** `.dev-flow/memory/` 根目录下的长期记忆文件（patterns、mistakes、preferences、decisions 等跨会话保留）
3. 重新创建 `.dev-flow/memory/session/` 目录

> **会话记忆 vs 长期记忆**：
> - **会话记忆**（session/ 目录）：modules、apis、models、utils、config、architecture — 每次重建，反映项目最新快照
> - **长期记忆**（根目录）：patterns、mistakes、preferences、decisions、conventions、project-overview — 跨会话累积

**创建目录**：`.dev-flow/memory/`（长期）+ `.dev-flow/memory/session/`（会话）

**逐文件写入以下内容**：

| # | 文件名 | 存放位置 | 必须包含的内容 | 不能为空 |
|---|--------|---------|---------------|---------|
| 1 | `project-overview.md` | 根目录 | 技术栈、服务列表表格、目录结构 | ✅ |
| 2 | `service-registry.md` | 根目录 | 服务列表表格（服务名/目录/端口/角色/子模块/启动类）+ 跨服务调用关系表格 | ✅ |
| 3 | `dependency-graph.md` | 根目录 | Maven 依赖关系表格 + Feign 调用关系表格 + 依赖链路图（如 `quality → common-bean`） | ✅ |
| 4 | `common-modules.md` | 根目录 | **从 Step 2 深层扫描的结果**：每个依赖项目的 Entity/DTO/Enum/Util/Feign Client 表格，含完整类路径 | ✅ |
| 5 | `architecture.md` | session/ | 架构模式（微服务/单体）、服务角色（网关/业务服务/基础服务）、分层架构（Controller/Service/Mapper）、技术选型理由 | ✅ |
| 6 | `conventions.md` | 根目录 | 命名规范、注解使用、统一响应、异常处理、DTO 转换方式 | ✅ |
| 7 | `config.md` | session/ | 数据库/Redis/Nacos/中间件配置（从 application.yml 提取） | ✅ |
| 8 | `models.md` | session/ | 当前服务的 Entity 表格 + 依赖项目的 Entity 表格（从 Step 2 获取）+ DTO 表格 | ✅ |
| 9 | `apis.md` | session/ | 当前服务的 Controller API 表格 + 依赖服务的 Feign Client API 表格 | ✅ |
| 10 | `utils.md` | session/ | 当前服务工具类 + 依赖项目工具类（从 Step 2 获取） | ✅ |
| 11 | `decisions.md` | 根目录 | 架构决策表格（无则写"暂无已识别的架构决策，后续开发中持续记录"） | ✅ |
| 12 | `mistakes.md` | 根目录 | 常见错误（初始写"暂无记录，在 Fix 阶段和开发过程中持续积累"） | ✅ |
| 13 | `patterns.md` | 根目录 | 代码模式表格（无则写"暂无已识别的代码模式，后续开发中持续记录"） | ✅ |

**每个文件的格式要求**（以 common-modules.md 为例）：
```markdown
# 公共模块清单

## qms-common-bean

### Entity
| 类名 | 完整路径 | 表名 | 主要字段 |
|------|----------|------|----------|
| User | com.mom.common.bean.entity.User | sys_user | id, username, realName |

### DTO
| 类名 | 完整路径 | 主要字段 |
|------|----------|----------|
| PageDTO | com.mom.common.bean.dto.PageDTO | current, size |

### Enum
| 枚举名 | 完整路径 | 值 |
|--------|----------|-----|

### Util
| 类名 | 完整路径 | 方法 |
|------|----------|------|

## qms-business-basedata（API 模块）

### Feign Client
| 接口名 | 完整路径 | 目标服务 | 方法 |
|--------|----------|----------|------|
```

> **其他文件格式参照上述表格风格，使用 Markdown 表格组织信息。**

---

#### ✅ Step 6：自检（写完文件后立即执行）

> **如果任何一项不通过，返回对应步骤重新执行。**

- [ ] `common-modules.md` 包含依赖项目的类？（不能只有标题没有数据）
- [ ] `dependency-graph.md` 包含 Maven 依赖 + Feign 调用？
- [ ] `models.md` 包含当前服务和依赖服务的 Entity？
- [ ] `utils.md` 包含依赖项目的工具类？
- [ ] `apis.md` 包含 Feign Client API？
- [ ] `config.md` 包含数据库/Redis/中间件配置？
- [ ] `decisions.md` 和 `mistakes.md` 至少有"暂无"文字？
- [ ] 所有 12 个文件都已创建？

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
| **依赖项目深层扫描** | **X 个（列出名称）** |
| 中间件 | 列出所有中间件 |
| 编码规范 | 从公共模块推断 |
| memory 文件 | 12/12 已写入 ✅ |

**Java 单服务项目：**
| 维度 | 结果 |
|------|------|
| 项目类型 | Java 后端 |
| 语言/版本 | Java XX |
| 框架 | Spring Boot X.X.X |
| ORM | MyBatis-Plus / JPA |
| 分层架构 | Controller / Service / Mapper / Entity / DTO / Enum / Config |
| Entity/Service/Controller 数量 | X / X / X |
| memory 文件 | 12/12 已写入 ✅ |

**前端项目：**
| 维度 | 结果 |
|------|------|
| 项目类型 | 前端 |
| 语言 | TypeScript / JavaScript |
| 框架 | React / Vue / Angular |
| 组件/API 数量 | X / X |
| memory 文件 | 12/12 已写入 ✅ |

**暂停，等待用户确认。**

---

### ✅ 阶段确认清单

| # | 确认项 | 状态 |
|---|--------|------|
| 1 | 项目类型和架构已正确识别 | ⬜ 待确认 |
| 2 | 依赖项目的 Entity/DTO/Enum/Util 已完整扫描 | ⬜ 待确认 |
| 3 | 所有 12 个 memory 文件已创建且非空 | ⬜ 待确认 |
| 4 | 编码规范（命名/注解/统一响应/异常处理）已识别 | ⬜ 待确认 |
| 5 | 跨服务依赖关系和 Feign 调用链已完整记录（多服务模式） | ⬜ 待确认 |
| 6 | 中间件配置（DB/Redis/Nacos 等）已提取 | ⬜ 待确认 |

**用户操作**：确认无误 → 回复 "确认" 进入 Analyze 阶段；需要重新扫描 → 指出遗漏项

---
