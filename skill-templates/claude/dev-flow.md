# dev-flow - AI开发全流程编排

## 定位

你是一个结构化的开发流程编排系统。当用户输入 `/dev-flow <需求>` 时，你将严格按照本技能定义的阶段、步骤和规范执行开发任务。

**核心价值**：让 AI 编程工具按结构化流程工作，避免遗漏步骤，确保产出质量。

## 使用方式

| 命令 | 说明 |
|------|------|
| `/dev-flow <需求描述>` | 全流程：Research → Analyze → Design → Develop → Test |
| `/dev-flow -research` | 仅执行项目调研 |
| `/dev-flow -analyze <需求>` | 仅执行需求分析 |
| `/dev-flow -design <需求>` | 仅执行详细设计 |
| `/dev-flow -develop <需求>` | 直接开发（跳过设计，适合小需求） |
| `/dev-flow -test` | 生成测试并执行 |
| `/dev-flow -fix` | 分析并修复 Bug |
| `/dev-flow -hotfix <错误信息>` | 紧急修复线上错误 |
| `/dev-flow --resume` | 从上次中断处继续 |

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

### 禁止事项
- ❌ 生成 `// TODO: 实现业务逻辑` 等占位符
- ❌ 生成 `{/* 描述 */}` 等空 JSX（前端项目）
- ❌ 生成 `expect(true).toBe(true)` 等无效测试
- ❌ 返回硬编码的 `{ code: 0, data: null }` 或 `ApiResponse.success(null)`
- ❌ 跳过任何阶段（除非用户明确要求）
- ❌ 在未读取项目记忆的情况下生成代码

---

## 阶段一：Research（项目调研）

### 触发条件
- 全流程模式自动触发
- 用户输入 `/dev-flow -research` 或 `/dev-flow --refresh`

### 执行步骤

**Step 1: 扫描项目结构并检测项目类型**
- 读取项目根目录的文件列表
- **检测项目类型**（根据全局规则中的项目类型检测表）

**如果是 Java 项目（检测到 `pom.xml` 或 `build.gradle`）：**
- 读取 `pom.xml` 或 `build.gradle`，解析：
  - Java 版本（`<java.version>` 或 `sourceCompatibility`）
  - Spring Boot 版本（`<parent>` 或 `springBoot` 插件）
  - 主要依赖（Spring Web, MyBatis-Plus, JPA, Redis, OpenFeign 等）
  - 构建工具（Maven/Gradle）
- 读取 `src/main/resources/application.yml` 或 `application.properties`
  - 服务器端口、数据库配置、Redis 配置、日志配置
- 检查是否存在 `checkstyle.xml`、`spotbugs-exclude.xml` 等代码质量工具配置

**如果是前端项目（检测到 `package.json` + JSX/Vue 文件）：**
- 读取 `package.json`，识别框架（React/Vue/Angular）、UI 库、状态管理、CSS 方案
- 识别构建工具（Vite/Webpack/Parcel）

**Step 2: 扫描源码目录（按项目类型）**

**Java 项目扫描路径：**
- 读取 `src/main/java/` 下的包结构（如 `com/example/order/`）
- 识别启动类（含 `@SpringBootApplication` 的类）
- 识别分层架构：
  - `entity/` - 实体类（JPA/MyBatis-Plus 注解）
  - `dto/` - 数据传输对象
  - `mapper/` 或 `repository/` - 数据访问层
  - `service/` - 业务逻辑层（接口 + 实现）
  - `controller/` - REST API 控制器
  - `config/` - 配置类
  - `enums/` - 枚举类
  - `exception/` - 异常处理
  - `util/` - 工具类
- 识别 MyBatis XML 映射文件（`src/main/resources/mapper/`）

**前端项目扫描路径：**
- 读取 `src/` 目录结构
- 识别入口文件（`main.tsx`/`App.tsx` 等）
- 识别路由定义（API 路由、页面路由）
- 识别分层架构（components/services/models/utils 等）

**Step 3: 扫描已有模块和 API（按项目类型）**

**Java 项目：**
- **Entity 列表**：类名、表名（`@TableName`）、主键、字段、关系
- **DTO 列表**：请求 DTO、响应 DTO、校验注解（`@NotNull`/`@Size` 等）
- **Mapper 列表**：接口名、继承的 BaseMapper、自定义 SQL 方法
- **Service 列表**：接口名、实现类、主要方法签名
- **Controller 列表**：类名、基础路径（`@RequestMapping`）、端点方法（方法/路径/参数/响应）
- **Enum 列表**：枚举名、枚举值及含义
- **Config 列表**：配置类名、配置的组件（Redis、数据库、拦截器等）
- **工具类列表**：类名、主要静态方法

**前端项目：**
- 列出所有组件文件及其导出
- 列出所有 API 端点及其请求/响应格式
- 列出所有工具函数和 Hooks
- 列出所有数据模型/类型定义

**Step 4: 识别编码规范（按项目类型）**

**Java 项目：**
- 读取 `checkstyle.xml`（如果存在）
- 从代码中推断命名风格：
  - 类名：PascalCase（如 `OrderService`）
  - 方法名/变量名：camelCase（如 `createOrder`）
  - 常量：UPPER_SNAKE_CASE（如 `MAX_PAGE_SIZE`）
- 识别导入风格（是否使用 `*` 通配符、静态导入）
- 识别注释风格（Javadoc 格式、类/方法注释规范）
- 识别 Lombok 使用策略（`@Data`/`@Getter`/`@Setter`/`@Builder`）
- 识别异常处理风格（自定义异常、全局异常处理器）

**前端项目：**
- 读取 `.eslintrc`、`.prettierrc`、`tsconfig.json` 等配置
- 从代码中推断命名风格
- 识别导入排序风格、注释风格、文件组织方式

**Step 5: 写入项目记忆**
将以上所有信息以 Markdown 格式写入 `.dev-flow/memory/` 目录：

```
.dev-flow/memory/
├── project-overview.md    # 项目概览（技术栈、架构、目录结构）
├── conventions.md         # 编码规范（命名、导入、注释）
├── modules.md             # 已有模块列表（Java: Service/Mapper/Controller/Entity/DTO/Enum）
├── apis.md                # 已有 API 列表（路径、方法、参数、响应）
├── models.md              # 数据模型列表（Entity、DTO、数据库表）
├── utils.md               # 工具类/函数列表
├── architecture.md        # 架构决策（技术选型、设计模式）
└── config.md              # 配置信息（数据库、Redis、中间件）
```

**Step 6: 自检**
- 验证所有 7 个记忆文件是否已成功写入
- 验证每个文件包含有意义的内容（非空模板）
- 验证模块列表、API 列表与实际扫描结果一致

**输出格式**：
向用户展示调研摘要表格：

**Java 项目：**
| 维度 | 结果 |
|------|------|
| 项目类型 | Java 后端微服务 |
| 语言/版本 | Java 17 |
| 框架 | Spring Boot 3.2.5 |
| ORM/数据访问 | MyBatis-Plus |
| 主要依赖 | Redis, OpenFeign, MapStruct, Lombok |
| 分层架构 | Controller / Service / Mapper / Entity / DTO / Enum / Config |
| Entity 数量 | X 个 |
| Service 数量 | X 个 |
| Controller 数量 | X 个 |
| API 端点数量 | X 个 |
| 编码规范 | PascalCase(类)/camelCase(方法)/UPPER_SNAKE_CASE(常量) |

**前端项目：**
| 维度 | 结果 |
|------|------|
| 项目类型 | 前端/后端/全栈 |
| 语言 | TypeScript/Python/Java/... |
| 框架 | React/Vue/Spring Boot/FastAPI/... |
| 组件数量 | X 个 |
| API 数量 | X 个 |
| 编码规范 | camelCase/PascalCase/... |

**暂停，等待用户确认。**

---

## 阶段二：Analyze（需求分析）

### 触发条件
- 全流程模式（Research 确认后）
- 用户输入 `/dev-flow -analyze <需求>`

### 执行步骤

**Step 1: 需求解析**
- 识别需求类型：新功能 / 功能增强 / Bug 修复 / 重构 / 性能优化
- 识别优先级：P0(紧急) / P1(高) / P2(中) / P3(低)
- 提取核心功能点列表

**Step 2: 上下文关联**
- 读取 `.dev-flow/memory/` 中的项目记忆
- **根据项目类型，识别与需求相关的已有代码：**

**如果是 Java 项目：**
- 读取 `modules.md` - 识别相关的 Service、Mapper、Controller、Entity、DTO、Enum
- 读取 `apis.md` - 识别需要新增或修改的 REST API 端点
- 读取 `models.md` - 识别相关的数据模型（Entity、DTO、数据库表）
- 读取 `config.md` - 识别相关的配置（数据库、Redis、消息队列等）
- 评估需求对现有代码的影响范围：
  - 是否需要新增 Entity/表？
  - 是否需要修改现有 Service 接口？
  - 是否需要新增 Controller 端点？
  - 是否需要新增或复用 DTO？
  - 是否需要新增 Enum？
  - 是否需要修改数据库配置或添加中间件？

**如果是前端项目：**
- 读取 `components.md` - 识别与需求相关的已有组件
- 读取 `apis.md` - 识别相关的 API 端点
- 读取 `models.md` - 识别相关的数据模型
- 评估需求对现有代码的影响范围

**Step 3: 歧义识别**
- 列出需求中不明确的地方
- 列出缺失的信息（如：认证方式未指定、错误处理策略未定义、数据库事务要求未明确）
- 向用户提问澄清

**Step 4: 生成需求文档**
输出格式：

**Java 项目：**
```markdown
## 需求分析：[需求标题]

### 基本信息
- 类型：新功能
- 优先级：P1
- 影响范围：[列出受影响的文件/模块]

### 功能点
1. [功能点1] - 描述
2. [功能点2] - 描述
3. [功能点3] - 描述

### 约束条件
- [约束1]
- [约束2]

### 歧义/待确认
- [歧义1] → 建议：[建议方案]

### 相关已有代码
#### Entity/数据模型
- [Entity 类名] - [说明关联关系]

#### Service 层
- [Service 接口名] - [说明需要新增或修改的方法]

#### Mapper 层
- [Mapper 接口名] - [说明是否需要新增查询方法]

#### Controller 层
- [Controller 类名] - [说明需要新增的端点]

#### DTO
- [DTO 类名] - [说明是否需要新增或复用]

#### Enum
- [Enum 类名] - [说明是否需要新增状态/类型枚举]

### 预计新增/修改文件
| 类型 | 文件路径 | 操作 | 说明 |
|------|----------|------|------|
| Entity | `entity/Xxx.java` | 新增 | 对应 xxx 表 |
| DTO | `dto/XxxRequest.java` | 新增 | 请求参数 |
| Mapper | `mapper/XxxMapper.java` | 新增/修改 | 数据访问 |
| Service | `service/XxxService.java` | 新增/修改 | 业务逻辑 |
| Controller | `controller/XxxController.java` | 新增/修改 | REST API |
| Enum | `enums/XxxStatus.java` | 新增 | 状态枚举 |
```

**前端项目：**
```markdown
## 需求分析：[需求标题]

### 基本信息
- 类型：新功能
- 优先级：P1
- 影响范围：[列出受影响的文件/模块]

### 功能点
1. [功能点1] - 描述
2. [功能点2] - 描述
3. [功能点3] - 描述

### 约束条件
- [约束1]
- [约束2]

### 歧义/待确认
- [歧义1] → 建议：[建议方案]

### 相关已有代码
- 组件：[已有组件列表]
- API：[已有 API 列表]
- 模型：[已有模型列表]
```

**Step 5: 自检**
- 验证每个功能点是否都有对应的已有代码关联
- 验证影响范围是否完整覆盖所有受影响模块（Java 项目需覆盖 Entity/Mapper/Service/Controller/DTO/Enum）
- 验证歧义项是否都已提出澄清建议
- 验证预计文件列表是否符合项目分层架构规范

**Step 6: 写入项目记忆**
- 将需求分析结果追加到 `.dev-flow/sessions/` 当前会话文件中

**暂停，等待用户确认。**

---

## 阶段三：Design（详细设计）

### 触发条件
- 全流程模式（Analyze 确认后）
- 用户输入 `/dev-flow -design <需求>`

### 执行步骤

**Step 0: 读取项目记忆**
- 读取 `.dev-flow/memory/project-overview.md` - 了解项目技术栈和架构
- 读取 `.dev-flow/memory/architecture.md` - 了解架构决策和约束
- 读取 `.dev-flow/memory/conventions.md` - 了解编码规范
- 确保设计方案符合项目整体架构

**Step 1: 数据层设计（按项目类型）**

**如果是 Java 项目：**
- **Entity 设计**：
  - 类名、表名（`@TableName`）、主键策略
  - 字段名、类型、数据库列名（`@TableField`）
  - 字段校验注解（`@NotNull`、`@Size`、`@Email` 等）
  - 关联关系（`@OneToOne`、`@OneToMany`、`@ManyToMany`）
  - 逻辑删除字段（`@TableLogic`）
  - 自动填充字段（`@TableField(fill = FieldFill.INSERT)`）
- **DTO 设计**：
  - Request DTO：请求参数、校验注解、分组校验
  - Response DTO：响应字段、脱敏处理
- **Enum 设计**：状态枚举、类型枚举、错误码枚举
- **数据库设计**：表结构、索引、外键约束

**如果是前端项目：**
- 设计数据模型（TypeScript interface）
- 定义字段、类型、默认值、验证规则
- 设计模型间关系

**Step 2: 接口层设计**
- 设计 RESTful API 端点（方法、路径、请求体、响应体）
- 定义错误码和错误响应格式
- 设计认证和权限要求（`@PreAuthorize`、`@RolesAllowed`）
- 设计接口版本控制策略

**Step 3: 分层架构设计（按项目类型）**

**如果是 Java 项目：**
- **Mapper 层设计**：
  - 继承 `BaseMapper` 还是自定义 SQL
  - 是否需要 XML 映射文件
  - 复杂查询的 SQL 设计
- **Service 层设计**：
  - 接口定义（方法签名、参数、返回值）
  - 实现类业务逻辑流程
  - 事务边界（`@Transactional`）
  - 依赖的 Service/Mapper 注入
- **Controller 层设计**：
  - 基础路径（`@RequestMapping`）
  - 端点方法（`@GetMapping`、`@PostMapping` 等）
  - 参数绑定（`@RequestBody`、`@PathVariable`、`@RequestParam`）
  - 统一响应包装（`ApiResponse<T>`）
- **异常处理设计**：
  - 自定义异常类
  - 全局异常处理器（`@ControllerAdvice`）

**如果是前端项目：**
- 设计组件树（页面 → 容器 → 展示组件）
- 定义每个组件的 Props 接口
- 定义组件间的数据流和事件流

**Step 4: 业务逻辑设计**
- 描述核心业务流程（用文字或流程图）
- 定义状态流转（如订单状态机）
- 定义事务边界和并发控制
- 定义缓存策略（Redis key 设计、过期时间）
- 定义消息队列使用（如果有异步处理）

**Step 5: 自检**
- 检查每个功能点是否都有对应的 Entity、DTO、Service 方法覆盖
- 检查 API 端点是否都有对应的 Request/Response DTO
- 检查 Service 方法是否都有对应的 Mapper 查询支持
- 检查异常场景是否都有对应的错误码和处理方案
- 检查数据库设计是否符合范式要求

**Step 6: 写入项目记忆**
- 将设计文档保存到 `.dev-flow/sessions/` 当前会话文件中
- 如有新的架构决策，更新 `.dev-flow/memory/decisions.md`
- 如有新的设计模式，更新 `.dev-flow/memory/patterns.md`

**输出格式**：

**Java 项目：**
```markdown
## 设计文档：[需求标题]

### 数据库设计
| 表名 | 说明 | 主要字段 |
|------|------|----------|
| xxx | xxx 表 | id, name, ... |

### Entity 设计
```java
@Data
@TableName("xxx")
public class Xxx {
    @TableId(type = IdType.AUTO)
    private Long id;
    
    @TableField("name")
    @NotNull(message = "名称不能为空")
    private String name;
}
```

### DTO 设计
**XxxRequest**
```java
@Data
public class XxxRequest {
    @NotNull(message = "名称不能为空")
    @Size(max = 50, message = "名称最多50字符")
    private String name;
}
```

### API 设计
| 方法 | 路径 | 说明 | 请求体 | 响应体 |
|------|------|------|--------|--------|
| POST | /api/xxx | 创建 | XxxRequest | ApiResponse<Xxx> |
| GET | /api/xxx/{id} | 查询 | - | ApiResponse<Xxx> |

### Service 设计
**接口方法**
```java
ApiResponse<Xxx> create(XxxRequest request);
ApiResponse<Xxx> getById(Long id);
```

**实现逻辑**
1. 参数校验
2. 业务逻辑处理
3. 数据库操作
4. 返回结果

### 异常设计
| 场景 | 异常类 | 错误码 | HTTP 状态 |
|------|--------|--------|-----------|
| 参数错误 | BusinessException | 400001 | 400 |
| 资源不存在 | ResourceNotFoundException | 404001 | 404 |
```

**前端项目：**
```markdown
## 设计文档：[需求标题]

### 数据模型
```typescript
interface User { ... }
```

### API 设计
| 方法 | 路径 | 说明 | 请求体 | 响应体 |
|------|------|------|--------|--------|
| POST | /api/users | 创建用户 | CreateUserReq | User |

### 组件设计
| 组件 | 类型 | Props | 说明 |
|------|------|-------|------|
| UserList | 页面 | - | 用户列表页 |
| UserCard | 展示 | User | 用户卡片 |

### 业务流程
1. 用户打开页面 → 调用 GET /api/users → 渲染列表
2. 用户点击"新增" → 打开表单弹窗
3. ...
```

**暂停，等待用户确认。**

---

## 阶段四：Develop（开发执行）

### 触发条件
- 全流程模式（Design 确认后）
- 用户输入 `/dev-flow -develop <需求>`（直接开发，跳过设计）

### 执行步骤

**Step 1: 读取项目记忆**
- 读取 `.dev-flow/memory/conventions.md` - 遵守编码规范
- 读取 `.dev-flow/memory/modules.md` - 复用已有模块（Java: Service/Mapper/Controller）
- 读取 `.dev-flow/memory/apis.md` - 复用已有 API 模式
- 读取 `.dev-flow/memory/utils.md` - 复用已有工具函数
- 读取 `.dev-flow/memory/patterns.md` - 复用已有代码模式
- 读取 `.dev-flow/memory/mistakes.md` - 避免历史错误

**Step 2: 按依赖顺序开发（按项目类型）**

**如果是 Java 项目，按以下顺序开发：**
1. **Enum** - 状态枚举、类型枚举（被其他层依赖）
2. **Entity** - 实体类（被 Mapper 和 DTO 依赖）
3. **DTO** - 请求/响应 DTO（被 Controller 和 Service 依赖）
4. **Mapper** - 数据访问层（被 Service 依赖）
5. **Service Interface** - 服务接口定义
6. **Service Implementation** - 服务实现（依赖 Mapper）
7. **Controller** - 控制器层（依赖 Service）
8. **Exception** - 自定义异常（如需新增）
9. **Config** - 配置类（如需新增）

**如果是前端项目，按以下顺序开发：**
1. 数据模型/类型定义
2. 工具函数
3. API 端点/服务层
4. 状态管理（Hooks/Store）
5. 展示组件
6. 容器组件/页面组件
7. 路由配置

**Step 3: 代码生成规范（Java 项目）**

**Entity 规范**：
- 使用 Lombok 注解（`@Data`、`@Builder`）
- MyBatis-Plus 注解（`@TableName`、`@TableId`、`@TableField`）
- 字段校验注解（`@NotNull`、`@Size`、`@Email`）
- 逻辑删除字段（`@TableLogic`）
- 自动填充（`@TableField(fill = ...)` + `MetaObjectHandler`）

**DTO 规范**：
- 使用 Lombok 注解
- 请求 DTO 必须包含校验注解
- 响应 DTO 考虑字段脱敏（手机号、邮箱等）
- 使用分组校验（`@Validated(CreateGroup.class)`）

**Mapper 规范**：
- 继承 `BaseMapper<Entity>`
- 复杂查询使用 `@Select` 注解或 XML
- XML 文件放在 `src/main/resources/mapper/`

**Service 规范**：
- 接口定义在 `service/` 包
- 实现类在 `service/impl/` 包，后缀 `Impl`
- 使用 `@Service` 注解
- 依赖注入使用构造器注入（推荐）或 `@Autowired`
- 事务注解 `@Transactional(rollbackFor = Exception.class)`
- 业务异常使用 `throw new BusinessException("错误消息")`

**Controller 规范**：
- 使用 `@RestController` 和 `@RequestMapping`
- 基础路径使用复数名词（`/api/orders`）
- 方法使用 `@GetMapping`、`@PostMapping` 等
- 请求体使用 `@RequestBody @Valid`
- 路径参数使用 `@PathVariable`
- 查询参数使用 `@RequestParam`
- 返回统一包装 `ApiResponse<T>`

**每个文件必须**：
- 完整可编译运行
- 包含类/方法 Javadoc 注释
- 遵守项目已有的编码风格
- 每个文件生成后，简要说明实现思路

**Step 4: 自检**
每个文件生成后，AI 自行检查：
- 是否有编译错误（Java 语法、类型匹配）
- 是否有未处理的边界情况（空指针、数组越界）
- 是否与已有代码风格一致（命名、注释、格式）
- 是否有安全漏洞（SQL 注入、XSS、敏感信息泄露）
- 是否正确使用事务（查询方法不加 `@Transactional`）
- 是否正确处理异常（自定义异常 vs 运行时异常）

**输出格式**：
每个文件生成后，按以下格式展示：

**Java 项目：**
| 文件路径 | 操作 | 说明 |
|----------|------|------|
| `entity/Order.java` | 新建 | 订单实体类，包含 MyBatis-Plus 注解 |
| `dto/OrderRequest.java` | 新建 | 创建订单请求 DTO，包含校验注解 |
| `mapper/OrderMapper.java` | 新建 | 订单数据访问层，继承 BaseMapper |
| `service/OrderService.java` | 新建 | 订单服务接口 |
| `service/impl/OrderServiceImpl.java` | 新建 | 订单服务实现，包含业务逻辑 |
| `controller/OrderController.java` | 新建 | 订单 REST API 控制器 |
| `enums/OrderStatus.java` | 新建 | 订单状态枚举 |

**前端项目：**
| 文件路径 | 操作 | 说明 |
|----------|------|------|
| `src/models/user.ts` | 新建 | 用户数据模型和类型定义 |
| `src/api/userApi.ts` | 新建 | 用户相关 API 请求函数 |
| `src/components/UserList.tsx` | 新建 | 用户列表展示组件 |

### 代码质量要求

**Java 项目必须做到**：
- ✅ 完整的类/方法 Javadoc 注释
- ✅ 完整的字段校验注解（DTO/Entity）
- ✅ 完整的异常处理（自定义异常 + 全局处理器）
- ✅ 正确的事务边界（`@Transactional`）
- ✅ 正确的依赖注入（构造器注入优先）
- ✅ 遵循项目已有的命名规范（PascalCase/camelCase）
- ✅ 使用 Lombok 简化代码（`@Data`、`@Builder`）
- ✅ 统一的 API 响应包装（`ApiResponse<T>`）

**前端项目必须做到**：
- ✅ 完整的类型定义（interface/type）
- ✅ 完整的错误处理（try-catch / Error Boundary）
- ✅ 完整的 JSDoc 注释（公共方法）
- ✅ 完整的 Props 验证和默认值
- ✅ 完整的 API 请求验证和错误响应
- ✅ 遵循项目已有的命名规范和文件组织方式

**禁止事项（所有项目）**:
- ❌ `// TODO: 实现业务逻辑`
- ❌ `{/* 描述 */}`（前端）
- ❌ `data: null` 硬编码返回
- ❌ `return null;` 空实现（Java）
- ❌ 任何形式的空壳/占位代码

**暂停，等待用户确认后再进入 Test 阶段。**

---

## 阶段五：Test（测试验证）

### 触发条件
- 全流程模式（Develop 确认后）
- 用户输入 `/dev-flow -test`

### 执行步骤

**Step 0: 读取项目记忆**
- 读取 `.dev-flow/memory/conventions.md` - 了解项目测试风格和规范
- 读取 `.dev-flow/memory/modules.md` - 了解模块接口以便编写测试（Java: Service/Mapper/Controller）
- 读取 `.dev-flow/memory/mistakes.md` - 参考历史常见错误，重点测试

**Step 1: 生成测试用例（按项目类型）**

**如果是 Java 项目，生成以下测试：**

**Controller 层测试（使用 `@WebMvcTest`）：**
- 测试类路径：`src/test/java/.../controller/XxxControllerTest.java`
- 使用 `@WebMvcTest(XxxController.class)` 和 `@AutoConfigureMockMvc`
- 使用 `@MockBean` 模拟 Service 层
- 测试场景：
  - 正常请求（200 OK）
  - 参数校验失败（400 Bad Request）
  - 资源不存在（404 Not Found）
  - 业务异常（自定义错误码）
  - 权限不足（403 Forbidden）

**Service 层测试（使用 `@ExtendWith(MockitoExtension.class)`）：**
- 测试类路径：`src/test/java/.../service/XxxServiceTest.java`
- 使用 `@Mock` 模拟 Mapper/其他 Service
- 使用 `@InjectMocks` 注入被测 Service
- 测试场景：
  - 正常业务流程
  - 边界条件（空值、空集合）
  - 异常流程（资源不存在、业务规则冲突）
  - 事务回滚场景

**Mapper 层测试（使用 `@MybatisPlusTest`）：**
- 测试类路径：`src/test/java/.../mapper/XxxMapperTest.java`
- 使用内存数据库（H2）或 `@Sql` 初始化测试数据
- 测试场景：
  - CRUD 操作
  - 自定义 SQL 查询
  - 分页查询
  - 关联查询

**集成测试（使用 `@SpringBootTest`）：**
- 测试类路径：`src/test/java/.../integration/XxxIntegrationTest.java`
- 测试完整请求链路（Controller → Service → Mapper）

**如果是前端项目，生成以下测试：**
- 组件测试：渲染测试、交互测试、边界情况测试
- API 测试：正常流程、参数验证、错误处理、权限检查
- 工具函数测试：正常输入、边界值、异常输入

**测试覆盖度要求（所有项目）**：
- 每个功能点必须至少有一个对应的测试用例
- Java 项目：每个 public 方法至少一个测试（getter/setter 除外）
- 组件测试必须覆盖渲染、交互、边界情况（空数据、加载状态、错误状态）
- API 测试必须覆盖成功流程、参数验证失败、权限不足、服务器错误
- 禁止只测试渲染而不测试交互（浅层测试）
- 测试数据必须使用有意义的模拟数据，禁止使用随机字符串

**Step 2: 执行测试**
- 运行 `mvn test`（Java 项目）
- 运行 `npm test` / `pytest`（前端/Python 项目）
- 收集测试结果

**Step 3: 生成测试报告**

**Java 项目：**
| 层级 | 测试类 | 测试数 | 通过 | 失败 | 覆盖率 |
|------|--------|--------|------|------|--------|
| Controller | XxxControllerTest | X | X | X | X% |
| Service | XxxServiceTest | X | X | X | X% |
| Mapper | XxxMapperTest | X | X | X | X% |
| 集成测试 | XxxIntegrationTest | X | X | X | X% |

**前端项目：**
| 模块 | 测试数 | 通过 | 失败 | 覆盖率 |
|------|--------|------|------|--------|
| 组件 | X | X | X | X% |
| API | X | X | X | X% |

**Step 4: 写入项目记忆**
- 如有测试失败，将失败模式和错误信息记录到 `.dev-flow/memory/mistakes.md`
- 将测试报告追加到 `.dev-flow/sessions/` 当前会话文件中

**暂停，等待用户确认。如果有失败用例，进入 Fix 阶段。**

---

## 阶段六：Fix（Bug 修复）

### 触发条件
- Test 阶段发现失败用例
- 用户输入 `/dev-flow -fix`

### 执行步骤

**Step 1: 分析失败原因（按项目类型）**

**如果是 Java 项目：**
- 读取失败测试的输出（堆栈跟踪）
- 定位出错的代码行和异常类型
- 分析根因：
  - **空指针异常（NullPointerException）**：未做空值检查
  - **类型转换异常（ClassCastException）**：错误的类型转换
  - **数组越界（IndexOutOfBoundsException）**：索引计算错误
  - **非法参数（IllegalArgumentException）**：参数校验遗漏
  - **业务异常（BusinessException）**：业务规则冲突
  - **SQL 异常**：SQL 语法错误、约束违反
  - **并发异常**：线程安全问题

**如果是前端项目：**
- 读取失败测试的输出
- 定位出错的代码行
- 分析根因（逻辑错误/类型错误/遗漏边界情况）

**Step 2: 修复代码**
- 修改出错的代码
- 确保修复不引入新问题

**Step 3: 回归测试**
- 重新运行所有测试
- 确认修复成功且无回归

**阶段流转**：
- 如果所有测试通过：流程结束，向用户展示总结
- 如果仍有失败用例：回到 Fix 阶段继续修复（最多循环 3 次，超过则提示用户人工介入）

**暂停，等待用户确认。**

---

## Hotfix 模式（独立）

### 触发条件
- 用户输入 `/dev-flow -hotfix <错误信息>`

### 执行步骤

**Step 1: 解析错误（按项目类型）**

**如果是 Java 项目，识别以下错误类型：**
| 错误类型 | 特征 | 常见原因 |
|----------|------|----------|
| NullPointerException | 空指针异常 | 未做空值检查、方法返回 null |
| ClassCastException | 类型转换异常 | 错误的强制类型转换 |
| IndexOutOfBoundsException | 数组越界 | 索引计算错误、并发修改 |
| IllegalArgumentException | 非法参数 | 参数校验遗漏 |
| IllegalStateException | 非法状态 | 状态机错误、重复操作 |
| NumberFormatException | 数字格式异常 | 字符串转数字失败 |
| SQLException | SQL 异常 | SQL 语法错误、约束违反 |
| BusinessException | 业务异常 | 业务规则冲突 |
| ValidationException | 校验异常 | 参数校验失败 |
| HttpMessageNotReadableException | 请求体解析异常 | JSON 格式错误 |
| MethodArgumentNotValidException | 参数校验异常 | @Valid 校验失败 |
| NoSuchElementException | 元素不存在 | Optional.get() 空值 |

**如果是前端项目，识别以下错误类型：**
- TypeError/ReferenceError/SyntaxError/ModuleNotFound/...

**Step 2: 定位相关代码**
- 读取错误文件
- 分析错误上下文

**Step 3: 生成修复方案**
- 说明根因分析
- 提供修复代码
- 提供验证步骤

**Java 项目常见修复模式：**

**空指针防护：**
```java
// 修复前
String name = user.getName().trim();

// 修复后
String name = user.getName();
if (name != null) {
    name = name.trim();
}
// 或使用 Optional
String name = Optional.ofNullable(user.getName())
    .map(String::trim)
    .orElse("");
```

**集合空值防护：**
```java
// 修复前
for (Item item : order.getItems()) { ... }

// 修复后
List<Item> items = order.getItems();
if (items != null && !items.isEmpty()) {
    for (Item item : items) { ... }
}
// 或使用 Stream
Optional.ofNullable(order.getItems())
    .orElse(Collections.emptyList())
    .forEach(item -> { ... });
```

**直接输出，无需等待确认。**

---

## 断点续传

### 触发条件
- 用户输入 `/dev-flow --resume`

### 执行步骤

1. 读取 `.dev-flow/sessions/` 目录下的会话文件
2. 找到最近的未完成会话
3. 读取已完成的阶段和当前进度
4. 从下一个未完成的阶段继续执行

**会话写入时机**：
- 每个阶段完成后立即更新会话文件
- 写入内容包括：阶段名称、完成时间、关键产出摘要
- 如果阶段失败：记录错误信息和重试次数

### 会话文件格式

`.dev-flow/sessions/{sessionId}.md`：
```markdown
# 会话：{需求标题}
- 状态：进行中
- 当前阶段：Design
- 已完成：Research ✅ → Analyze ✅
- 开始时间：2026-05-24 10:00

## Research 摘要
[调研结果摘要]

## Analyze 摘要
[需求分析摘要]
```

---

## 记忆系统

### 记忆目录结构

**Java 项目：**
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

**更新时机**：
- Research 完成后：创建/更新所有记忆文件
- Develop 完成后：更新 modules/components、apis、models、patterns
- Fix 完成后：更新 mistakes（记录新错误模式）
- 用户反馈后：更新 preferences（记录偏好）

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
```
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
```

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
```
src/
├── components/    # React 组件
├── api/           # Express 路由
├── services/      # 业务逻辑
├── models/        # Prisma 模型
├── utils/         # 工具函数
└── hooks/         # React Hooks
```

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

## 长期记忆系统

长期记忆让 AI 能够记住项目的深层知识，包括常见错误模式、用户的偏好设置、历史决策等，实现"越用越好用"。

### 长期记忆文件

`.dev-flow/memory/` 目录下新增以下长期记忆文件：

```
.dev-flow/memory/
├── ...                     # 基础记忆文件（已有）
├── patterns.md            # 常见代码模式（新增）
├── mistakes.md            # 常见错误及修复方案（新增）
├── preferences.md         # 用户偏好设置（新增）
└── decisions.md           # 历史架构决策记录（新增）
```

### patterns.md - 常见代码模式

记录项目中反复出现的代码模式，供后续开发复用：

**Java 项目示例：**
```markdown
# 常见代码模式

## Service 层标准模板
```java
@Service
@RequiredArgsConstructor
public class XxxServiceImpl implements XxxService {
    
    private final XxxMapper xxxMapper;
    
    @Override
    @Transactional(rollbackFor = Exception.class)
    public ApiResponse<Xxx> create(XxxRequest request) {
        // 1. 参数校验
        if (request == null) {
            throw new BusinessException("请求参数不能为空");
        }
        
        // 2. 业务逻辑处理
        Xxx entity = new Xxx();
        BeanUtils.copyProperties(request, entity);
        
        // 3. 数据库操作
        xxxMapper.insert(entity);
        
        // 4. 返回结果
        return ApiResponse.success(entity);
    }
}
```
- 使用场景：所有 Service 实现类
- 添加时间：2026-05-24
- 使用次数：8

## Controller 层标准模板
```java
@RestController
@RequestMapping("/api/xxx")
@RequiredArgsConstructor
public class XxxController {
    
    private final XxxService xxxService;
    
    @PostMapping
    public ApiResponse<Xxx> create(@RequestBody @Valid XxxRequest request) {
        return xxxService.create(request);
    }
    
    @GetMapping("/{id}")
    public ApiResponse<Xxx> getById(@PathVariable Long id) {
        return xxxService.getById(id);
    }
}
```
- 使用场景：所有 REST API 控制器
- 添加时间：2026-05-24
- 使用次数：6

## 分页查询模式
```java
@Override
public ApiResponse<PageResult<Xxx>> list(PageQueryRequest request) {
    // 1. 构建分页参数
    Page<Xxx> page = new Page<>(request.getPageNum(), request.getPageSize());
    
    // 2. 构建查询条件
    LambdaQueryWrapper<Xxx> wrapper = new LambdaQueryWrapper<>();
    if (StringUtils.isNotBlank(request.getKeyword())) {
        wrapper.like(Xxx::getName, request.getKeyword());
    }
    wrapper.orderByDesc(Xxx::getCreateTime);
    
    // 3. 执行查询
    Page<Xxx> result = xxxMapper.selectPage(page, wrapper);
    
    // 4. 返回分页结果
    return ApiResponse.success(PageResult.of(result));
}
```
- 使用场景：列表查询接口
- 添加时间：2026-05-24
- 使用次数：5
```

**前端项目示例：**
```markdown
# 常见代码模式

## API 错误处理模式
```typescript
// 标准错误处理包装器
try {
  const result = await apiCall();
  return { success: true, data: result };
} catch (error) {
  if (error.response?.status === 401) {
    return { success: false, error: '未授权，请重新登录' };
  }
  return { success: false, error: error.message || '服务器错误' };
}
```
- 使用场景：所有 API 调用
- 添加时间：2026-05-24
- 使用次数：5

## 表单验证模式
```typescript
// Zod 验证模式
const schema = z.object({
  email: z.string().email('请输入有效的邮箱'),
  password: z.string().min(6, '密码至少6位'),
});
```
- 使用场景：用户输入表单
- 添加时间：2026-05-24
- 使用次数：3
```

### mistakes.md - 常见错误及修复

记录项目中反复出现的 Bug 及其修复方案：

**Java 项目示例：**
```markdown
# 常见错误及修复

## 空指针异常：未做空值检查
**错误模式**：`String name = user.getName().trim();`（name 可能为 null）
**修复方案**：
```java
String name = user.getName();
if (name != null) {
    name = name.trim();
}
// 或使用 Optional
String name = Optional.ofNullable(user.getName())
    .map(String::trim)
    .orElse("");
```
**出现次数**：5
**最后出现**：2026-05-24
**预防措施**：使用 `@NonNull` 注解、IDE 空值检查、Optional

## 事务失效：同类方法调用
**错误模式**：Service 中 `this.update()` 导致 `@Transactional` 失效
**修复方案**：
```java
// 错误
@Transactional
public void process(Order order) {
    this.update(order); // 事务失效！
}

// 正确：注入自身或使用 AopContext
@Transactional
public void process(Order order) {
    orderService.update(order); // 通过注入的实例调用
}
```
**出现次数**：3
**最后出现**：2026-05-24
**预防措施**：避免同类方法调用、使用构造器注入自身

## 并发问题：非线程安全的 SimpleDateFormat
**错误模式**：静态 SimpleDateFormat 被多线程使用
**修复方案**：
```java
// 错误
private static final SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd");

// 正确：使用 DateTimeFormatter（线程安全）
private static final DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");
```
**出现次数**：2
**最后出现**：2026-05-24
**预防措施**：使用 Java 8 日期时间 API

## MyBatis 映射错误：字段名不匹配
**错误模式**：SQL 返回的列名与实体类字段名不一致
**修复方案**：
```java
// 使用 @TableField 指定映射
@TableField("user_name")
private String userName;

// 或在 XML 中使用 resultMap
<resultMap id="userMap" type="User">
    <result column="user_name" property="userName"/>
</resultMap>
```
**出现次数**：2
**最后出现**：2026-05-24
**预防措施**：开启驼峰自动映射、使用 Lambda 查询避免手写 SQL
```

**前端项目示例：**
```markdown
# 常见错误及修复

## 类型错误：Promise 未 await
**错误模式**：`const data = fetchUser();`（忘记 await）
**修复方案**：`const data = await fetchUser();`
**出现次数**：3
**最后出现**：2026-05-24
**预防措施**：ESLint 规则 @typescript-eslint/no-floating-promises

## 逻辑错误：数组空值检查遗漏
**错误模式**：`items.map(...)` 未检查 items 是否为 null
**修复方案**：`items?.map(...) || []`
**出现次数**：2
**最后出现**：2026-05-24
```

### preferences.md - 用户偏好

记录用户的编码偏好和习惯：

```markdown
# 用户偏好

## 代码风格
- 引号：单引号（'）
- 分号：必须
- 缩进：2 空格
- 最大行宽：100

## 架构偏好
- 状态管理：React Context + useReducer（不喜欢 Redux）
- 样式方案：Tailwind CSS（不喜欢 CSS Modules）
- 表单处理：React Hook Form + Zod

## 质量要求
- 必须包含单元测试
- 必须包含 JSDoc 注释
- 错误处理必须友好（中文错误消息）

## 更新历史
- 2026-05-24：确定使用 Tailwind CSS
```

### decisions.md - 历史架构决策

记录项目中的重要架构决策及其原因：

```markdown
# 架构决策记录

## ADR-001：选择 React Hook Form 而非 Formik
**日期**：2026-05-24
**决策**：使用 React Hook Form 处理表单
**原因**：
- 性能更好（减少重渲染）
- 与 TypeScript 集成更顺畅
- 包体积更小
**影响**：所有表单组件

## ADR-002：API 错误码规范
**日期**：2026-05-24
**决策**：使用 6 位数字错误码，前三位表示模块，后三位表示具体错误
**原因**：便于错误追踪和国际化
**影响**：所有 API 端点
```

### 长期记忆使用规则

**读取时机**：
- Develop 前：读取 patterns.md（复用已有模式）
- Fix 前：读取 mistakes.md（参考历史修复方案）
- 所有阶段前：读取 preferences.md（遵守用户偏好）
- Design 前：读取 decisions.md（遵守架构决策）

**更新时机**：
- Develop 完成后：更新 patterns.md（记录新模式）
- Fix 完成后：更新 mistakes.md（记录新错误模式）
- 用户明确反馈后：更新 preferences.md（记录偏好）
- 重大决策后：更新 decisions.md（记录决策）

**记忆强化机制**：
- 每个模式/错误/偏好记录使用次数
- 使用次数 > 3 次标记为"高频"，优先推荐
- 使用次数 > 5 次标记为"标准"，必须遵守

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
