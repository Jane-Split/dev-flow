// src/agents/architecture-templates.ts
// 架构决策模板数据 - 基于规则和预设方案生成推荐
// ─── 规模评估关键词 ─────────────────────────────────────────
const LARGE_KEYWORDS = [
    '高并发', '微服务', '分布式', '大规模', '多团队', '集群',
    '高可用', '负载均衡', '弹性', '高吞吐', '百万级', '千万级',
    '多租户', 'SaaS平台', '企业级平台', '消息队列', '服务网格',
    'high concurrency', 'microservice', 'distributed', 'large scale',
    'multi-team', 'cluster', 'high availability', 'load balancer',
    'elastic', 'high throughput', 'multi-tenant',
];
const MEDIUM_KEYWORDS = [
    '团队', 'CRUD', '管理后台', '后台系统', 'ERP', 'CMS',
    '电商', '商城', '社交', '论坛', '博客平台', 'API服务',
    '中台', 'B端', 'SaaS', '多用户', '权限管理', '工作流',
    '项目管理', '协作', '审批', '消息推送',
    'team', 'dashboard', 'admin', 'ERP', 'CMS', 'e-commerce',
    'social', 'forum', 'blog platform', 'API service', 'multi-user',
    'workflow', 'permission',
];
const SMALL_KEYWORDS = [
    '个人', '工具', '静态站点', '个人博客', 'CLI', '脚本',
    '小程序', '单页', '落地页', '作品集', 'demo', '原型',
    '简单', '轻量', '单文件', '个人项目', 'side project',
    'personal', 'tool', 'static site', 'blog', 'CLI', 'script',
    'mini program', 'landing page', 'portfolio', 'demo', 'prototype',
    'simple', 'lightweight',
];
// ─── 技术选型预设 ───────────────────────────────────────────
const FRAMEWORK_OPTIONS = {
    small: [
        {
            name: 'Next.js',
            pros: ['SSR/SSG 内置支持', '文件路由简洁', 'Vercel 一键部署', '生态丰富'],
            cons: ['框架较重', '学习曲线中等', '服务端逻辑受限'],
            score: 90,
            recommended: true,
        },
        {
            name: 'Vite + React',
            pros: ['开发体验极佳', '构建速度快', '配置灵活', '轻量'],
            cons: ['需要自行配置 SSR', '路由需额外引入'],
            score: 85,
            recommended: false,
        },
        {
            name: 'Astro',
            pros: ['零 JS 默认输出', '多框架支持', '内容站点最优', '构建速度快'],
            cons: ['交互性较弱', '生态相对较小'],
            score: 82,
            recommended: false,
        },
    ],
    medium: [
        {
            name: 'Next.js (App Router)',
            pros: ['全栈能力', 'Server Actions', '内置中间件', 'API Routes'],
            cons: ['部署依赖 Node 运行时', '调试复杂度较高'],
            score: 92,
            recommended: true,
        },
        {
            name: 'Nuxt 3',
            pros: ['Vue 生态', '自动导入', 'Nitro 引擎', '混合渲染'],
            cons: ['社区小于 React', '部分库兼容性'],
            score: 85,
            recommended: false,
        },
        {
            name: 'React + Express',
            pros: ['前后端完全解耦', '灵活度高', '团队可并行开发', '技术栈成熟'],
            cons: ['需要维护两套项目', '部署复杂度增加'],
            score: 80,
            recommended: false,
        },
    ],
    large: [
        {
            name: '微服务架构 (Node.js + gRPC)',
            pros: ['独立部署扩展', '技术栈灵活', '故障隔离', '团队自治'],
            cons: ['运维复杂度高', '网络延迟', '调试困难', '数据一致性挑战'],
            score: 88,
            recommended: true,
        },
        {
            name: 'NestJS (模块化单体)',
            pros: ['企业级架构', '依赖注入', '模块化设计', 'TypeScript 原生'],
            cons: ['学习曲线陡峭', '框架较重', '灵活性受限'],
            score: 85,
            recommended: false,
        },
        {
            name: 'Java Spring Boot',
            pros: ['企业级成熟方案', '生态完善', '性能优秀', '人才储备充足'],
            cons: ['开发效率较低', '资源消耗大', '启动慢'],
            score: 78,
            recommended: false,
        },
    ],
};
const DATABASE_OPTIONS = {
    small: [
        {
            name: 'SQLite',
            pros: ['零配置', '文件存储', '轻量快速', '适合原型'],
            cons: ['不支持高并发写入', '无内置复制', '不适合生产大数据'],
            score: 90,
            recommended: true,
        },
        {
            name: 'PostgreSQL',
            pros: ['功能强大', 'JSON 支持', '扩展性好', '免费开源'],
            cons: ['需要独立部署', '配置较复杂'],
            score: 85,
            recommended: false,
        },
    ],
    medium: [
        {
            name: 'PostgreSQL',
            pros: ['功能丰富', 'JSONB 支持', '全文搜索', '扩展性强', '社区活跃'],
            cons: ['需要运维经验', '垂直扩展为主'],
            score: 92,
            recommended: true,
        },
        {
            name: 'MySQL',
            pros: ['成熟稳定', '读写分离方便', '运维资料丰富', '性能优秀'],
            cons: ['JSON 支持弱于 PG', '部分高级特性缺失'],
            score: 85,
            recommended: false,
        },
        {
            name: 'MongoDB',
            pros: ['Schema 灵活', '水平扩展方便', '开发速度快', '文档模型直观'],
            cons: ['事务支持有限', 'JOIN 性能差', '内存占用高'],
            score: 78,
            recommended: false,
        },
    ],
    large: [
        {
            name: 'PostgreSQL + Citus (分布式)',
            pros: ['分布式 SQL', '实时查询', '强一致性', '兼容 PostgreSQL 生态'],
            cons: ['运维复杂', '分布式事务有限制', '成本较高'],
            score: 90,
            recommended: true,
        },
        {
            name: 'MongoDB (分片集群)',
            pros: ['水平扩展', '高吞吐', '灵活 Schema', '自动分片'],
            cons: ['一致性较弱', '复杂查询性能差', '运维成本高'],
            score: 82,
            recommended: false,
        },
        {
            name: 'TiDB',
            pros: ['MySQL 兼容', '分布式事务', 'HTAP', '水平扩展'],
            cons: ['资源消耗大', '运维门槛高', '社区相对较小'],
            score: 78,
            recommended: false,
        },
    ],
};
const CACHE_OPTIONS = {
    small: [
        {
            name: '无缓存 (内存变量)',
            pros: ['零成本', '实现简单', '无额外依赖'],
            cons: ['重启丢失', '不支持分布式', '容量有限'],
            score: 80,
            recommended: true,
        },
        {
            name: 'Redis (本地)',
            pros: ['数据结构丰富', '持久化支持', '性能优秀'],
            cons: ['需要安装维护', '对小项目过重'],
            score: 70,
            recommended: false,
        },
    ],
    medium: [
        {
            name: 'Redis',
            pros: ['高性能', '数据结构丰富', '持久化', '发布订阅', 'Lua 脚本'],
            cons: ['内存成本', '需要运维', '单线程限制'],
            score: 92,
            recommended: true,
        },
        {
            name: 'Memcached',
            pros: ['极高性能', '多线程', '简单易用', '内存效率高'],
            cons: ['数据结构单一', '无持久化', '功能有限'],
            score: 75,
            recommended: false,
        },
    ],
    large: [
        {
            name: 'Redis Cluster',
            pros: ['高可用', '自动分片', '水平扩展', '数据持久化'],
            cons: ['运维复杂', '内存成本高', '网络开销'],
            score: 92,
            recommended: true,
        },
        {
            name: 'Redis + CDN',
            pros: ['边缘缓存', '降低源站压力', '全球加速', '静态资源优化'],
            cons: ['缓存更新延迟', '配置复杂', '成本增加'],
            score: 85,
            recommended: false,
        },
    ],
};
const AUTH_OPTIONS = {
    small: [
        {
            name: 'NextAuth.js / Auth.js',
            pros: ['开箱即用', '多提供商支持', 'Session 管理', '与 Next.js 集成'],
            cons: ['框架绑定', '自定义受限'],
            score: 88,
            recommended: true,
        },
        {
            name: 'JWT (自实现)',
            pros: ['无状态', '简单轻量', '跨域友好', '完全可控'],
            cons: ['无法主动失效', 'Token 体积大', '安全性依赖实现'],
            score: 78,
            recommended: false,
        },
    ],
    medium: [
        {
            name: 'Auth.js + RBAC',
            pros: ['灵活权限控制', '多会话管理', 'OAuth 集成', '中间件支持'],
            cons: ['需要自行实现 RBAC 逻辑', '配置较复杂'],
            score: 90,
            recommended: true,
        },
        {
            name: 'Supabase Auth',
            pros: ['完整认证方案', '实时能力', '数据库集成', '免费额度充足'],
            cons: ['供应商锁定', '自定义受限', '依赖外部服务'],
            score: 82,
            recommended: false,
        },
        {
            name: 'Keycloak',
            pros: ['企业级 IAM', 'SSO 支持', 'LDAP/AD 集成', '权限管理完善'],
            cons: ['部署复杂', '资源消耗大', '学习曲线陡'],
            score: 75,
            recommended: false,
        },
    ],
    large: [
        {
            name: 'OAuth 2.0 + OIDC + RBAC',
            pros: ['标准化协议', '细粒度权限', '多租户支持', '可扩展'],
            cons: ['实现复杂', '需要专业安全团队', '维护成本高'],
            score: 90,
            recommended: true,
        },
        {
            name: 'Keycloak',
            pros: ['开箱即用的 IAM', 'SSO/SLO', '多协议支持', '管理控制台'],
            cons: ['单点故障风险', '性能瓶颈', '定制化困难'],
            score: 85,
            recommended: false,
        },
    ],
};
const QUEUE_OPTIONS = {
    small: [],
    medium: [
        {
            name: 'BullMQ (Redis)',
            pros: ['基于 Redis', 'TypeScript 友好', '延迟任务', '优先级队列'],
            cons: ['依赖 Redis', '消息不持久化到磁盘'],
            score: 88,
            recommended: true,
        },
        {
            name: 'RabbitMQ',
            pros: ['企业级消息队列', '路由灵活', '消息确认', '管理界面'],
            cons: ['Erlang 依赖', '资源消耗大', '运维复杂'],
            score: 80,
            recommended: false,
        },
    ],
    large: [
        {
            name: 'Apache Kafka',
            pros: ['高吞吐', '持久化', '流处理', '水平扩展', ' Exactly-once'],
            cons: ['运维复杂', '学习曲线陡', '资源消耗大'],
            score: 92,
            recommended: true,
        },
        {
            name: 'RabbitMQ',
            pros: ['消息可靠性高', '路由灵活', '管理方便', '协议标准'],
            cons: ['吞吐量低于 Kafka', '集群扩展复杂'],
            score: 82,
            recommended: false,
        },
        {
            name: 'Redis Streams',
            pros: ['轻量级', '与 Redis 集成', '消费者组', '低延迟'],
            cons: ['消息丢失风险', '功能有限', '不适合海量数据'],
            score: 75,
            recommended: false,
        },
    ],
};
const MONITORING_OPTIONS = {
    small: [
        {
            name: 'Console + 简单日志',
            pros: ['零成本', '开发阶段足够', '无额外依赖'],
            cons: ['无持久化', '无告警', '不适合生产'],
            score: 80,
            recommended: true,
        },
    ],
    medium: [
        {
            name: 'Winston + Sentry',
            pros: ['结构化日志', '错误追踪', '性能监控', '告警通知'],
            cons: ['Sentry 付费', '配置工作量'],
            score: 90,
            recommended: true,
        },
        {
            name: 'Pino + Grafana',
            pros: ['极高性能日志', '可视化仪表盘', '自定义告警', '开源免费'],
            cons: ['需要自建 Grafana', '运维成本'],
            score: 85,
            recommended: false,
        },
    ],
    large: [
        {
            name: 'ELK Stack + Prometheus + Grafana',
            pros: ['全链路追踪', '日志聚合', '指标监控', '告警体系完善'],
            cons: ['资源消耗大', '运维复杂', '学习成本高'],
            score: 92,
            recommended: true,
        },
        {
            name: 'Datadog',
            pros: ['一站式监控', 'APM 集成', '日志管理', '易用性高'],
            cons: ['价格昂贵', '供应商锁定', '数据隐私'],
            score: 85,
            recommended: false,
        },
    ],
};
const DEPLOYMENT_OPTIONS = {
    small: [
        {
            name: 'Vercel',
            pros: ['零配置部署', '自动 HTTPS', '预览环境', '免费额度充足'],
            cons: ['供应商锁定', 'Serverless 限制', '冷启动延迟'],
            score: 92,
            recommended: true,
        },
        {
            name: 'Netlify',
            pros: ['静态站点优化', '表单处理', '函数支持', '部署简单'],
            cons: ['构建时间限制', '功能不如 Vercel 丰富'],
            score: 85,
            recommended: false,
        },
        {
            name: 'GitHub Pages',
            pros: ['完全免费', '与 GitHub 集成', '适合纯静态'],
            cons: ['仅支持静态', '无服务端', '自定义域名需配置'],
            score: 78,
            recommended: false,
        },
    ],
    medium: [
        {
            name: 'Docker Compose',
            pros: ['环境一致', '易于迁移', '多服务编排', '开发生产统一'],
            cons: ['需要 Docker 知识', '资源开销', '编排能力有限'],
            score: 90,
            recommended: true,
        },
        {
            name: 'Railway / Render',
            pros: ['PaaS 简化部署', '自动扩展', '数据库托管', '开发体验好'],
            cons: ['成本较高', '供应商锁定', '控制力有限'],
            score: 82,
            recommended: false,
        },
    ],
    large: [
        {
            name: 'Kubernetes',
            pros: ['自动扩缩容', '服务发现', '滚动更新', '多云支持', '自愈能力'],
            cons: ['运维极其复杂', '学习曲线陡峭', '资源开销大'],
            score: 92,
            recommended: true,
        },
        {
            name: 'Docker Swarm',
            pros: ['简单易用', 'Docker 原生', '学习成本低', '适合中小规模'],
            cons: ['功能不如 K8s', '社区较小', '扩展性有限'],
            score: 78,
            recommended: false,
        },
    ],
};
// ─── 架构模式预设 ───────────────────────────────────────────
const ARCHITECTURE_PATTERNS = {
    small: {
        name: '单体应用',
        description: '所有功能集中在一个应用中，前后端可选同框架（如 Next.js），适合快速开发和迭代。部署简单，维护成本低。',
        suitableFor: [
            '个人项目和 Side Project',
            '工具类应用',
            '静态站点和内容站点',
            'MVP 和原型验证',
            '小型 API 服务',
        ],
        tradeoffs: [
            '开发速度快，但功能耦合度高',
            '部署简单，但扩展性受限',
            '适合快速验证想法，但重构成本随规模增长',
            '技术栈统一，但灵活性较低',
        ],
    },
    medium: {
        name: '前后端分离',
        description: '前端和后端独立开发部署，通过 RESTful API 或 GraphQL 通信。前端负责 UI 和交互，后端负责业务逻辑和数据。适合团队协作。',
        suitableFor: [
            '团队协作项目',
            'CRUD 类管理后台',
            '电商和社交平台',
            '需要多端适配（Web + Mobile）',
            '需要独立迭代前后端',
        ],
        tradeoffs: [
            '前后端可并行开发，但接口契约管理成本增加',
            '技术栈灵活，但需要维护两套项目',
            '可独立扩展，但网络延迟增加',
            '职责清晰，但联调成本较高',
        ],
    },
    large: {
        name: '微服务架构',
        description: '将系统拆分为多个独立服务，每个服务负责单一业务能力，通过 API 网关和消息队列通信。适合大规模团队和高并发场景。',
        suitableFor: [
            '高并发系统',
            '多团队协作',
            '需要独立部署和扩展的业务',
            '复杂的业务领域',
            '需要技术栈多样化的场景',
        ],
        tradeoffs: [
            '独立部署扩展，但运维复杂度大幅增加',
            '故障隔离，但分布式事务处理困难',
            '团队自治，但服务间通信成本高',
            '技术栈灵活，但一致性挑战大',
        ],
    },
};
// ─── 目录结构预设 ───────────────────────────────────────────
const DIRECTORY_STRUCTURES = {
    small: [
        'src/',
        '  app/                    # 页面路由 (App Router)',
        '  components/             # 组件',
        '    ui/                   # 通用 UI 组件',
        '    features/             # 功能组件',
        '  lib/                    # 工具函数和配置',
        '  hooks/                  # 自定义 Hooks',
        '  styles/                 # 全局样式',
        '  types/                  # TypeScript 类型定义',
        'public/                   # 静态资源',
        'tests/                    # 测试文件',
        'package.json',
        'tsconfig.json',
        'next.config.js',
    ],
    medium: [
        'packages/',
        '  web/                    # 前端应用',
        '    src/',
        '      app/                # 页面路由',
        '      components/         # 组件',
        '        ui/               # 通用 UI',
        '        features/         # 业务组件',
        '      hooks/              # 自定义 Hooks',
        '      services/           # API 调用层',
        '      stores/             # 状态管理',
        '      styles/             # 样式',
        '      types/              # 类型定义',
        '      utils/              # 工具函数',
        '  server/                 # 后端服务',
        '    src/',
        '      routes/             # 路由定义',
        '      controllers/        # 控制器',
        '      services/           # 业务逻辑',
        '      models/             # 数据模型',
        '      middleware/         # 中间件',
        '      utils/              # 工具函数',
        '      config/             # 配置',
        '  shared/                 # 共享代码',
        '    types/                # 共享类型',
        '    utils/                # 共享工具',
        '    constants/            # 共享常量',
        'docker-compose.yml',
        'package.json (workspace)',
    ],
    large: [
        'services/',
        '  api-gateway/            # API 网关',
        '    src/',
        '      routes/             # 路由',
        '      middleware/         # 中间件',
        '      plugins/            # 插件',
        '  auth-service/           # 认证服务',
        '    src/',
        '      routes/',
        '      services/',
        '      models/',
        '      proto/              # gRPC 定义',
        '  user-service/           # 用户服务',
        '    src/',
        '      routes/',
        '      services/',
        '      models/',
        '      proto/',
        '  order-service/          # 订单服务',
        '    src/',
        '      routes/',
        '      services/',
        '      models/',
        '      proto/',
        '  notification-service/   # 通知服务',
        '    src/',
        '      routes/',
        '      services/',
        '      workers/            # 消息消费者',
        'libs/',
        '  common/                 # 公共库',
        '    src/',
        '      logger/             # 日志',
        '      errors/             # 错误处理',
        '      utils/              # 工具',
        '      types/              # 类型',
        '  event-bus/              # 事件总线',
        '  database/               # 数据库客户端',
        'infra/',
        '  docker/                 # Docker 配置',
        '  k8s/                    # Kubernetes 配置',
        '    base/                 # 基础配置',
        '    overlays/             # 环境覆盖',
        '  monitoring/             # 监控配置',
        'scripts/                  # 运维脚本',
        'docker-compose.yml',
        'Makefile',
    ],
};
// ─── 模块边界预设 ───────────────────────────────────────────
const MODULE_BOUNDARIES = {
    small: [
        'components/ui - 通用 UI 组件，不依赖业务逻辑，可复用',
        'components/features - 业务组件，可引用 ui 组件和 hooks',
        'lib - 纯函数工具库，不依赖任何业务模块',
        'hooks - 自定义 React Hooks，可引用 lib',
        'app - 页面路由层，组合组件和数据获取逻辑',
    ],
    medium: [
        'packages/web - 前端应用，仅通过 HTTP API 与后端通信',
        'packages/server - 后端服务，通过 API 暴露业务能力',
        'packages/shared - 共享类型和工具，不包含业务逻辑',
        '前端分层: components -> hooks -> services -> stores',
        '后端分层: routes -> controllers -> services -> models',
        '禁止前端直接访问数据库，禁止后端引用前端代码',
    ],
    large: [
        '每个微服务独立仓库或独立目录，拥有独立的数据库',
        '服务间通过 gRPC 同步通信，通过消息队列异步通信',
        'API 网关统一入口，负责路由、认证、限流',
        'libs/common 提供公共工具，但禁止包含业务逻辑',
        'libs/event-bus 定义事件契约，服务通过事件解耦',
        '每个服务可自由选择技术栈，但需遵循通信协议',
    ],
};
// ─── 数据流描述预设 ─────────────────────────────────────────
const DATA_FLOW_DESCRIPTIONS = {
    small: '用户请求 -> Next.js 路由 -> 页面组件 -> 调用 lib 工具函数 -> 数据库操作 -> 返回数据 -> 组件渲染。对于 Server Component，数据获取在服务端完成；对于 Client Component，通过 API Route 获取数据。',
    medium: '用户请求 -> 前端路由 -> 页面组件 -> 调用 services 层 -> HTTP 请求 -> 后端路由 -> Controller -> Service (业务逻辑) -> Model (数据访问) -> 数据库 -> 原路返回。状态管理 (stores) 负责前端状态缓存和同步。',
    large: '用户请求 -> CDN/负载均衡 -> API 网关 -> 认证鉴权 -> 路由转发 -> 目标微服务 -> 业务处理 -> 数据库/缓存 -> 返回结果。异步操作通过消息队列解耦：服务 A 发送事件 -> 消息队列 -> 服务 B 消费处理。服务间同步调用通过 gRPC。',
};
// ─── API 契约描述预设 ───────────────────────────────────────
const API_CONTRACT_DESCRIPTIONS = {
    small: '使用 Next.js Route Handlers 或 Server Actions。RESTful 风格，JSON 请求/响应。错误使用 HTTP 状态码 + 统一错误格式 { success: false, error: string }。',
    medium: '前后端通过 RESTful API 通信，使用 OpenAPI/Swagger 定义接口契约。请求/响应格式统一，包含分页、排序、过滤标准参数。认证使用 Bearer Token，错误使用标准错误码。',
    large: '外部使用 RESTful API (通过 API 网关)，内部服务间使用 gRPC/Protobuf。事件驱动使用消息队列，事件格式使用 JSON Schema 定义。API 版本化通过 URL 路径 (v1/v2)，向后兼容策略。',
};
// ─── 部署方案预设 ───────────────────────────────────────────
const DEPLOYMENT_PLANS = {
    small: {
        strategy: 'vercel',
        description: '使用 Vercel 进行部署，支持自动构建和预览环境。配置 vercel.json 进行路由和重写规则设置。环境变量通过 Vercel Dashboard 管理。',
        requirements: ['Vercel 账号', 'GitHub/GitLab 仓库连接', 'Node.js 18+'],
    },
    medium: {
        strategy: 'docker',
        description: '使用 Docker Compose 编排前后端服务和数据库。开发环境与生产环境使用同一套 Docker 配置，确保一致性。可配合 Nginx 反向代理。',
        requirements: ['Docker 和 Docker Compose', '服务器 (云服务器或本地)', '域名和 SSL 证书', 'Nginx (可选)'],
    },
    large: {
        strategy: 'k8s',
        description: '使用 Kubernetes 进行容器编排，配合 Helm Chart 管理部署配置。使用 Ingress Controller 处理外部流量，HPA 实现自动扩缩容。通过 CI/CD 流水线自动部署。',
        requirements: [
            'Kubernetes 集群 (云托管或自建)',
            '容器镜像仓库 ( Harbor / ECR )',
            'CI/CD 流水线 ( GitHub Actions / GitLab CI )',
            'Ingress Controller',
            '监控平台 ( Prometheus + Grafana )',
            '日志平台 ( ELK / Loki )',
        ],
    },
};
// ─── 权衡分析预设 ───────────────────────────────────────────
const TRADEOFFS = {
    small: [
        {
            concern: '开发速度 vs 架构灵活性',
            decision: '优先开发速度，选择单体架构和全栈框架',
            impact: '初期开发效率高，但如果项目增长需要重构',
        },
        {
            concern: '成本 vs 功能',
            decision: '使用免费 PaaS 平台 (Vercel)，降低运维成本',
            impact: '零运维成本，但受限于平台能力和免费额度',
        },
        {
            concern: '简单性 vs 可扩展性',
            decision: '优先简单性，使用 SQLite 或轻量级数据库',
            impact: '开发和部署简单，但数据量增长后需要迁移',
        },
    ],
    medium: [
        {
            concern: '前后端耦合 vs 解耦',
            decision: '采用前后端分离架构，通过 API 通信',
            impact: '增加接口管理成本，但团队可并行开发，前后端独立部署',
        },
        {
            concern: 'SQL vs NoSQL',
            decision: '选择关系型数据库 (PostgreSQL) 作为主存储',
            impact: '数据一致性强，但非结构化数据处理需要额外方案',
        },
        {
            concern: '自建 vs 托管服务',
            decision: '核心服务自建 (Docker)，辅助服务可使用托管方案',
            impact: '控制力强，但运维成本增加',
        },
        {
            concern: '缓存策略',
            decision: '引入 Redis 作为缓存层和会话存储',
            impact: '提升性能和用户体验，但增加系统复杂度',
        },
    ],
    large: [
        {
            concern: '一致性 vs 可用性',
            decision: '采用最终一致性，通过事件驱动保证数据同步',
            impact: '系统可用性高，但用户可能短暂看到不一致数据',
        },
        {
            concern: '单体 vs 微服务',
            decision: '采用微服务架构，按业务领域拆分服务',
            impact: '独立部署扩展，但运维和调试复杂度大幅增加',
        },
        {
            concern: '同步 vs 异步通信',
            decision: '查询类使用同步 (gRPC)，命令类使用异步 (消息队列)',
            impact: '兼顾实时性和可靠性，但增加了系统复杂度',
        },
        {
            concern: '自建 vs 云服务',
            decision: '核心业务自建，基础设施使用云服务',
            impact: '平衡控制力和成本，但需要多云管理能力',
        },
        {
            concern: '监控粒度',
            decision: '建设完整的可观测性体系 (日志 + 指标 + 链路追踪)',
            impact: '问题定位效率高，但基础设施投入大',
        },
    ],
};
// ─── 导出函数 ───────────────────────────────────────────────
/**
 * 从需求描述中评估项目规模
 */
export function getScaleFromRequirement(requirement) {
    const lower = requirement.toLowerCase();
    // 按优先级检查关键词
    const largeMatches = LARGE_KEYWORDS.filter(kw => lower.includes(kw.toLowerCase()));
    const mediumMatches = MEDIUM_KEYWORDS.filter(kw => lower.includes(kw.toLowerCase()));
    const smallMatches = SMALL_KEYWORDS.filter(kw => lower.includes(kw.toLowerCase()));
    // 根据匹配数量和优先级判断
    if (largeMatches.length > 0) {
        return 'large';
    }
    if (mediumMatches.length >= 2) {
        return 'medium';
    }
    if (mediumMatches.length > 0 && smallMatches.length === 0) {
        return 'medium';
    }
    if (smallMatches.length > 0) {
        return 'small';
    }
    // 默认为 medium
    return 'medium';
}
/**
 * 根据规模获取技术选型推荐
 */
export function getTechRecommendations(scale) {
    const decisions = [];
    // 框架选型
    const fwOptions = FRAMEWORK_OPTIONS[scale];
    decisions.push({
        category: 'framework',
        options: fwOptions,
        selected: fwOptions.find(o => o.recommended)?.name ?? fwOptions[0].name,
        rationale: `根据${scale === 'small' ? '小型' : scale === 'medium' ? '中型' : '大型'}项目规模推荐，优先考虑开发效率和可维护性`,
    });
    // 数据库选型
    const dbOptions = DATABASE_OPTIONS[scale];
    decisions.push({
        category: 'database',
        options: dbOptions,
        selected: dbOptions.find(o => o.recommended)?.name ?? dbOptions[0].name,
        rationale: `根据${scale === 'small' ? '小型' : scale === 'medium' ? '中型' : '大型'}项目数据需求推荐，平衡功能性和运维成本`,
    });
    // 缓存选型
    const cacheOptions = CACHE_OPTIONS[scale];
    if (cacheOptions.length > 0) {
        decisions.push({
            category: 'cache',
            options: cacheOptions,
            selected: cacheOptions.find(o => o.recommended)?.name ?? cacheOptions[0].name,
            rationale: `根据${scale === 'small' ? '小型' : scale === 'medium' ? '中型' : '大型'}项目性能需求推荐`,
        });
    }
    // 认证选型
    const authOptions = AUTH_OPTIONS[scale];
    decisions.push({
        category: 'auth',
        options: authOptions,
        selected: authOptions.find(o => o.recommended)?.name ?? authOptions[0].name,
        rationale: `根据${scale === 'small' ? '小型' : scale === 'medium' ? '中型' : '大型'}项目安全需求推荐`,
    });
    // 消息队列选型 (仅 medium 和 large)
    const queueOptions = QUEUE_OPTIONS[scale];
    if (queueOptions.length > 0) {
        decisions.push({
            category: 'queue',
            options: queueOptions,
            selected: queueOptions.find(o => o.recommended)?.name ?? queueOptions[0].name,
            rationale: `根据${scale === 'medium' ? '中型' : '大型'}项目异步处理需求推荐`,
        });
    }
    // 监控选型
    const monitorOptions = MONITORING_OPTIONS[scale];
    decisions.push({
        category: 'monitoring',
        options: monitorOptions,
        selected: monitorOptions.find(o => o.recommended)?.name ?? monitorOptions[0].name,
        rationale: `根据${scale === 'small' ? '小型' : scale === 'medium' ? '中型' : '大型'}项目运维需求推荐`,
    });
    // 部署选型
    const deployOptions = DEPLOYMENT_OPTIONS[scale];
    decisions.push({
        category: 'deployment',
        options: deployOptions,
        selected: deployOptions.find(o => o.recommended)?.name ?? deployOptions[0].name,
        rationale: `根据${scale === 'small' ? '小型' : scale === 'medium' ? '中型' : '大型'}项目部署需求推荐`,
    });
    return decisions;
}
/**
 * 根据规模获取架构模式
 */
export function getArchitecturePattern(scale) {
    return ARCHITECTURE_PATTERNS[scale];
}
/**
 * 根据规模和框架获取分层策略
 */
export function getLayerStrategy(scale, _framework) {
    return {
        directoryStructure: DIRECTORY_STRUCTURES[scale],
        moduleBoundaries: MODULE_BOUNDARIES[scale],
        dataFlow: DATA_FLOW_DESCRIPTIONS[scale],
        apiContract: API_CONTRACT_DESCRIPTIONS[scale],
    };
}
/**
 * 根据规模获取部署方案
 */
export function getDeploymentPlan(scale) {
    return DEPLOYMENT_PLANS[scale];
}
/**
 * 根据规模获取权衡分析
 */
export function getTradeoffs(scale) {
    return TRADEOFFS[scale];
}
//# sourceMappingURL=architecture-templates.js.map