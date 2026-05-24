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

### 禁止事项
- ❌ 生成 `// TODO: 实现业务逻辑` 等占位符
- ❌ 生成 `{/* 描述 */}` 等空 JSX
- ❌ 生成 `expect(true).toBe(true)` 等无效测试
- ❌ 返回硬编码的 `{ code: 0, data: null }`
- ❌ 跳过任何阶段（除非用户明确要求）
- ❌ 在未读取项目记忆的情况下生成代码

---

## 阶段一：Research（项目调研）

### 触发条件
- 全流程模式自动触发
- 用户输入 `/dev-flow -research` 或 `/dev-flow --refresh`

### 执行步骤

**Step 1: 扫描项目结构**
- 读取项目根目录的文件列表
- 识别项目类型（前端/后端/全栈/移动端/库/CLI工具）
- 读取 `package.json`、`pom.xml`、`pyproject.toml`、`go.mod`、`Cargo.toml` 等配置文件
- 识别语言、框架、UI 库、状态管理、CSS 方案、测试框架、构建工具

**Step 2: 扫描源码目录**
- 读取 `src/` 目录结构（或项目约定的源码目录）
- 识别入口文件（main.ts/index.ts/App.tsx/app.py/main.go 等）
- 提取路由定义（API 路由、页面路由）
- 识别分层架构（controllers/services/models/utils 等）

**Step 3: 扫描已有组件和 API**
- 列出所有组件文件及其导出
- 列出所有 API 端点及其请求/响应格式
- 列出所有工具函数和 Hooks
- 列出所有数据模型/类型定义

**Step 4: 识别编码规范**
- 读取 `.eslintrc`、`.prettierrc`、`tsconfig.json` 等配置
- 从代码中推断命名风格（camelCase/PascalCase/snake_case）
- 识别导入排序风格、注释风格、文件组织方式

**Step 5: 写入项目记忆**
将以上所有信息以 Markdown 格式写入 `.dev-flow/memory/` 目录：

```
.dev-flow/memory/
├── project-overview.md    # 项目概览（技术栈、架构、目录结构）
├── conventions.md         # 编码规范（命名、导入、注释）
├── components.md          # 已有组件列表（名称、路径、Props、用途）
├── apis.md                # 已有 API 列表（路径、方法、参数、响应）
├── models.md              # 数据模型列表（名称、字段、关系）
├── utils.md               # 工具函数列表（名称、签名、用途）
└── architecture.md        # 架构决策（如存在）
```

**输出格式**：
向用户展示调研摘要表格：

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
- 识别与需求相关的已有组件、API、数据模型
- 评估需求对现有代码的影响范围

**Step 3: 歧义识别**
- 列出需求中不明确的地方
- 列出缺失的信息（如：认证方式未指定、错误处理策略未定义）
- 向用户提问澄清

**Step 4: 生成需求文档**
输出格式：

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

**暂停，等待用户确认。**

---

## 阶段三：Design（详细设计）

### 触发条件
- 全流程模式（Analyze 确认后）
- 用户输入 `/dev-flow -design <需求>`

### 执行步骤

**Step 1: 数据层设计**
- 设计数据模型（TypeScript interface / Python dataclass / Java record）
- 定义字段、类型、默认值、验证规则
- 设计模型间关系（一对一、一对多、多对多）

**Step 2: 接口层设计**
- 设计 RESTful API 端点（方法、路径、请求体、响应体）
- 定义错误码和错误响应格式
- 设计认证和权限要求

**Step 3: 组件层设计**
- 设计组件树（页面 → 容器 → 展示组件）
- 定义每个组件的 Props 接口
- 定义组件间的数据流和事件流

**Step 4: 业务逻辑设计**
- 描述核心业务流程（用文字或流程图）
- 定义状态管理方案
- 定义副作用处理（API 调用、事件监听）

**Step 5: 自检**
- 检查每个功能点是否都有对应的数据模型、API 或组件覆盖
- 检查 API 端点是否都有对应的数据模型
- 检查页面组件是否都有对应的 API

**输出格式**：

```markdown
## 设计文档：[需求标题]

### 数据模型
\`\`\`typescript
interface User { ... }
\`\`\`

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
- 读取 `.dev-flow/memory/components.md` - 复用已有组件
- 读取 `.dev-flow/memory/apis.md` - 复用已有 API 模式
- 读取 `.dev-flow/memory/utils.md` - 复用已有工具函数

**Step 2: 按依赖顺序开发**
根据 Design 阶段的输出，按以下顺序开发：
1. 数据模型/类型定义
2. 工具函数
3. API 端点/服务层
4. 状态管理（Hooks/Store）
5. 展示组件
6. 容器组件/页面组件
7. 路由配置

**Step 3: 代码生成规范**
- 每个文件必须完整可运行
- 必须包含类型定义和错误处理
- 必须遵守项目已有的编码风格
- 每个文件生成后，简要说明实现思路

**Step 4: 自检**
每个文件生成后，AI 自行检查：
- 是否有 TypeScript 编译错误
- 是否有未处理的边界情况
- 是否与已有代码风格一致
- 是否有安全漏洞（XSS、注入等）

### 代码质量要求

**必须做到**：
- ✅ 完整的类型定义（interface/type）
- ✅ 完整的错误处理（try-catch / Error Boundary）
- ✅ 完整的 JSDoc 注释（公共方法）
- ✅ 完整的 Props 验证和默认值
- ✅ 完整的 API 请求验证和错误响应
- ✅ 遵循项目已有的命名规范和文件组织方式

**禁止事项**：
- ❌ `// TODO: 实现业务逻辑`
- ❌ `{/* 描述 */}`
- ❌ `data: null` 硬编码返回
- ❌ 任何形式的空壳/占位代码

---

## 阶段五：Test（测试验证）

### 触发条件
- 全流程模式（Develop 确认后）
- 用户输入 `/dev-flow -test`

### 执行步骤

**Step 1: 生成测试用例**
根据 Develop 阶段生成的代码，为每个模块生成测试：
- 组件测试：渲染测试、交互测试、边界情况测试
- API 测试：正常流程、参数验证、错误处理、权限检查
- 工具函数测试：正常输入、边界值、异常输入

**Step 2: 执行测试**
- 运行 `npm test` / `pytest` / `mvn test`（根据项目类型）
- 收集测试结果

**Step 3: 生成测试报告**
| 模块 | 测试数 | 通过 | 失败 | 覆盖率 |
|------|--------|------|------|--------|
| 组件 | X | X | X | X% |
| API | X | X | X | X% |

**暂停，等待用户确认。如果有失败用例，进入 Fix 阶段。**

---

## 阶段六：Fix（Bug 修复）

### 触发条件
- Test 阶段发现失败用例
- 用户输入 `/dev-flow -fix`

### 执行步骤

**Step 1: 分析失败原因**
- 读取失败测试的输出
- 定位出错的代码行
- 分析根因（逻辑错误/类型错误/遗漏边界情况）

**Step 2: 修复代码**
- 修改出错的代码
- 确保修复不引入新问题

**Step 3: 回归测试**
- 重新运行所有测试
- 确认修复成功且无回归

---

## Hotfix 模式（独立）

### 触发条件
- 用户输入 `/dev-flow -hotfix <错误信息>`

### 执行步骤

**Step 1: 解析错误**
- 识别错误类型（TypeError/ReferenceError/SyntaxError/ModuleNotFound/...）
- 提取错误位置（文件名:行号）

**Step 2: 定位相关代码**
- 读取错误文件
- 分析错误上下文

**Step 3: 生成修复方案**
- 说明根因分析
- 提供修复代码
- 提供验证步骤

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
- Develop 前：必须读取 conventions、components、apis、utils
- Design 前：必须读取 project-overview、architecture
- Analyze 前：必须读取 components、apis、models

**更新时机**：
- Research 完成后：创建/更新所有记忆文件
- Develop 完成后：更新 components、apis、models
- Fix 完成后：更新 conventions（如有新规范）

### 记忆文件格式

所有记忆文件使用 Markdown 格式，方便 AI 直接读取和理解：

**project-overview.md 示例**：
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

**components.md 示例**：
```markdown
# 已有组件

## Button
- 路径：src/components/Button.tsx
- 类型：展示组件
- Props：{ variant: 'primary' | 'secondary'; size: 'sm' | 'md' | 'lg'; disabled?: boolean; children: ReactNode }
- 用途：通用按钮组件
```
