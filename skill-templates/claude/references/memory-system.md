# dev-flow 记忆系统

> **v3.7.0 项目类型适配**：
> - `service-registry.md`、`dependency-graph.md`、`common-modules.md`：仅 `java-microservice`、`java-fullstack`、`fullstack` 填充
> - `modules.md`、`apis.md`：所有类型填充（前端为组件/API调用层，后端为模块/端点）
> - `models.md`：有后端的类型填充 Entity/DTO，前端填充 TS interface/type
> - `architecture.md`：所有类型填充架构概览

> 本文档从 Router 中外置，详细描述记忆系统的目录结构、使用规则和文件格式。
> 读取时机：Research 完成后、Design/Analyze/Develop 阶段前。

## 记忆目录结构

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

### 会话记忆与长期记忆（v2.0.0）

> **新增**：记忆系统分为「会话记忆」和「长期记忆」，会话记忆在每次 Research 时重建，长期记忆跨会话保留。

**会话记忆**（每次 Research 重建，存放在 `session/` 子目录）：
- `session/modules.md` — 模块清单
- `session/apis.md` — API 列表
- `session/models.md` — 数据模型
- `session/utils.md` — 工具类
- `session/config.md` — 配置信息
- `session/architecture.md` — 架构信息

**长期记忆**（跨会话保留，存放在记忆根目录）：
- `project-overview.md` — 项目概览
- `conventions.md` — 编码规范
- `patterns.md` — 代码模式
- `mistakes.md` — 常见错误
- `preferences.md` — 用户偏好
- `decisions.md` — 架构决策
- `service-registry.md` — 服务注册表（微服务）
- `dependency-graph.md` — 依赖图谱（微服务）
- `common-modules.md` — 公共模块（微服务）

**Research 阶段行为**：
1. 清空 `.dev-flow/memory/session/` 目录（会话记忆可安全重建）
2. 保留长期记忆文件（不可自动删除）
3. 将新的扫描结果写入 `session/` 目录

**清理命令**：
- `/dev-flow -cleanup` — 清理会话记忆，保留长期记忆
- `/dev-flow -cleanup --all` — 清理全部记忆（重置）

## 记忆使用规则

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

## 记忆文件格式

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

### 记忆强化机制

- 每个模式/错误/偏好记录使用次数
- 使用次数 > 3 次 → 标记为 **"高频"**，优先推荐
- 使用次数 > 5 次 → 标记为 **"标准"**，必须遵守
