# dev-flow 记忆系统

> 本文档从 Router 中外置，详细描述记忆系统的目录结构、使用规则和文件格式。
> 读取时机：Research 完成后、Design/Analyze/Develop 阶段前。

## 记忆目录结构

**全栈项目（Java 微服务 + React 前端）：**
```
.dev-flow/memory/                          # 根目录：全局共享记忆（6个文件）
├── project-overview.md                    # 项目总览（前后端技术栈合并）
├── conventions.md                         # 项目级通用规范（跨前后端）
├── patterns.md                            # 代码模式（前后端都可能积累）
├── mistakes.md                            # 错误记录（Fix阶段统一积累）
├── preferences.md                         # 用户偏好（全局）
└── decisions.md                           # 架构决策（跨前后端）
│
├── backend/                               # 后端专用记忆（9个文件）
│   ├── service-registry.md                # 服务注册表（微服务名/端口/角色）
│   ├── dependency-graph.md                # 后端依赖图谱（Maven + Feign调用）
│   ├── common-modules.md                  # 公共模块清单（Entity/DTO/Enum/Util）
│   ├── architecture.md                    # 后端架构（微服务/单体/分层）
│   ├── models.md                          # 数据模型（Entity表格/DTO表格）
│   ├── apis.md                            # API列表（Controller/Feign Client）
│   ├── utils.md                           # 工具类（类名/路径/方法）
│   ├── config.md                          # 配置信息（DB/Redis/Nacos/中间件）
│   └── conventions.md                     # 后端编码规范详细版
│
├── frontend/                              # 前端专用记忆（9个文件）
│   ├── overview.md                        # 前端概览（技术栈/入口/脚本）
│   ├── structure.md                       # 目录结构（文件统计/目录树）
│   ├── architecture.md                    # 前端架构（SPA/SSR/状态管理/路由）
│   ├── components.md                      # 组件清单（名称/路径/类型/Props）
│   ├── routes-and-state.md                # 路由和状态（路由表/Store/页面）
│   ├── config.md                          # 前端配置（构建/环境变量/TS/ESLint）
│   ├── apis.md                            # API封装（模块/请求函数/拦截器）
│   ├── utils.md                           # 工具函数（名称/功能/参数）
│   └── conventions.md                     # 前端编码规范详细版
│
├── _index/                                # 索引目录（pre-scanner 生成，供子代理读取）
│   ├── project-domains.yaml               # 前后端域检测结果（域存在性/项目类型/根路径）
│   ├── backend-file-index.yaml            # 后端文件路径索引（Entity/Controller/Service等路径）
│   └── frontend-file-index.yaml           # 前端文件路径索引（组件/页面/Store等路径）
│
└── session/                               # 会话级记忆（增量更新/diff工作区，可清空）

service-a/.dev-flow/memory/                # 服务 A 专属记忆（可选）
├── modules.md                             # 服务 A 的模块清单
├── apis.md                                # 服务 A 的 API 列表
├── models.md                              # 服务 A 的数据模型
├── config.md                              # 服务 A 的配置信息
└── architecture.md                        # 服务 A 的架构决策
```

**service-registry.md 说明**：记录所有服务的元信息，包括服务名、目录路径、端口、角色（网关/认证/业务/公共）、子模块列表（自动发现，不硬编码模块名）。

**dependency-graph.md 说明**：记录服务间的依赖关系和 Feign 调用关系，包括调用方服务、被调用方服务、Feign Client 接口名、方法签名。

**common-modules.md 说明**：记录所有公共模块中可复用的类，包括通用 Entity、DTO、Enum、Util、Exception 等，供各服务开发时优先复用。公共模块通过内容分析识别（被其他服务依赖、无启动类、无配置文件），不依赖命名模式。

**Java 单服务项目（纯后端）：**
```
.dev-flow/memory/                          # 根目录：全局共享记忆（6个文件）
├── project-overview.md                    # 项目概览
├── conventions.md                         # 项目级通用规范
├── patterns.md                            # 代码模式
├── mistakes.md                            # 错误记录
├── preferences.md                         # 用户偏好
└── decisions.md                           # 架构决策
│
└── backend/                               # 后端专用记忆（9个文件）
    ├── service-registry.md                # 服务注册表（如有多个模块）
    ├── dependency-graph.md                # 依赖图谱
    ├── common-modules.md                  # 公共模块
    ├── architecture.md                    # 后端架构
    ├── models.md                          # 数据模型
    ├── apis.md                            # API列表
    ├── utils.md                           # 工具类
    ├── config.md                          # 配置信息
    └── conventions.md                     # 后端编码规范详细版
```

**前端项目（纯前端）：**
```
.dev-flow/memory/                          # 根目录：全局共享记忆（6个文件）
├── project-overview.md                    # 项目概览
├── conventions.md                         # 项目级通用规范
├── patterns.md                            # 代码模式
├── mistakes.md                            # 错误记录
├── preferences.md                         # 用户偏好
└── decisions.md                           # 架构决策
│
└── frontend/                              # 前端专用记忆（9个文件）
    ├── overview.md                        # 前端概览
    ├── structure.md                       # 目录结构
    ├── architecture.md                    # 前端架构
    ├── components.md                      # 组件清单
    ├── routes-and-state.md                # 路由和状态管理
    ├── config.md                          # 前端配置
    ├── apis.md                            # 前端 API 封装
    ├── utils.md                           # 工具函数
    └── conventions.md                     # 前端编码规范详细版
```

### 会话记忆与长期记忆（v2.0.0）

> **新增**：记忆系统分为「会话记忆」和「长期记忆」，会话记忆在每次 Research 时重建，长期记忆跨会话保留。

**长期记忆**（跨会话保留，根目录 + backend/ + frontend/）：
- `project-overview.md` — 项目总览
- `conventions.md` — 项目级通用编码规范
- `patterns.md` — 代码模式
- `mistakes.md` — 常见错误
- `preferences.md` — 用户偏好
- `decisions.md` — 架构决策
- `backend/service-registry.md` — 服务注册表（微服务）
- `backend/dependency-graph.md` — 后端依赖图谱（微服务）
- `backend/common-modules.md` — 公共模块（微服务）
- `backend/conventions.md` — 后端编码规范详细版
- `frontend/conventions.md` — 前端编码规范详细版

**索引文件**（每次 Research 重建，_index/ 子目录）：
- `_index/project-domains.yaml` — 前后端域检测结果（域存在性/项目类型/根路径）
- `_index/backend-file-index.yaml` — 后端文件路径索引（供后端子代理使用）
- `_index/frontend-file-index.yaml` — 前端文件路径索引（供前端子代理使用）

**会话记忆**（每次 Research 重建，session/ 子目录）：
- `session/` — 仅作为增量更新/diff工作区，不存放长期数据

**Research 阶段行为**：
1. 清空 `.dev-flow/memory/session/` 目录（会话记忆可安全重建）
2. 清空 `.dev-flow/memory/_index/` 目录（索引文件可安全重建）
3. 保留长期记忆文件（不可自动删除）
4. pre-scanner 生成新的 `_index/` 索引文件
5. 将新的扫描结果写入 `backend/` 和/或 `frontend/` 目录

**清理命令**：
- `/dev-flow -cleanup` — 清理会话记忆，保留长期记忆
- `/dev-flow -cleanup --all` — 清理全部记忆（重置）

## 记忆使用规则

**读取时机**：
- Develop 前：必须读取 conventions、modules/components、apis、utils、patterns、mistakes
- **前端域额外读取时机**：
  - Develop 前端任务前：必须读取 frontend/conventions.md、frontend/components.md、frontend/apis.md、frontend/routes-and-state.md
- **后端域额外读取时机**：
  - Develop 后端任务前：必须读取 backend/conventions.md、backend/apis.md、backend/models.md
- Design 前：必须读取 project-overview、architecture、decisions
- Analyze 前：必须读取 modules/components、apis、models
- **多服务模式额外读取时机**：
  - Analyze 前：必须读取 backend/service-registry.md、backend/dependency-graph.md、backend/common-modules.md
  - Design 前：必须读取 backend/service-registry.md、backend/dependency-graph.md、backend/common-modules.md
  - Develop 前：必须读取 backend/service-registry.md、backend/dependency-graph.md、backend/common-modules.md
  - 开发某服务时：读取该服务的 `.dev-flow/memory/modules.md`（如有）

**更新时机**：
- Research 完成后：创建/更新所有记忆文件
- Develop 完成后：更新 modules/components、apis、models、patterns
- Fix 完成后：更新 mistakes（记录新错误模式）
- 用户反馈后：更新 preferences（记录偏好）
- **多服务模式额外更新时机**：
  - 新增/删除服务后：更新 backend/service-registry.md、backend/dependency-graph.md
  - 新增/修改 Feign Client 后：更新 backend/dependency-graph.md
  - 公共模块变更后：更新 backend/common-modules.md

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

### 记忆强化机制

- 每个模式/错误/偏好记录使用次数
- 使用次数 > 3 次 → 标记为 **"高频"**，优先推荐
- 使用次数 > 5 次 → 标记为 **"标准"**，必须遵守
