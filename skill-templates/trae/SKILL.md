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

**Step 0: 读取项目记忆**
- 读取 `.dev-flow/memory/project-overview.md` - 了解项目技术栈和架构
- 读取 `.dev-flow/memory/architecture.md` - 了解架构决策和约束
- 确保设计方案符合项目整体架构

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

**禁止事项**:
- ❌ `// TODO: 实现业务逻辑`
- ❌ `{/* 描述 */}`
- ❌ `data: null` 硬编码返回
- ❌ 任何形式的空壳/占位代码

**暂停，等待用户确认后再进入 Test 阶段。**

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

**测试覆盖度要求**：
- 每个功能点必须至少有一个对应的测试用例
- 组件测试必须覆盖渲染、交互、边界情况（空数据、加载状态、错误状态）
- API 测试必须覆盖成功流程、参数验证失败、权限不足、服务器错误
- 禁止只测试渲染而不测试交互（浅层测试）
- 测试数据必须使用有意义的模拟数据，禁止使用随机字符串

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

**阶段流转**：
- 如果所有测试通过：流程结束，向用户展示总结
- 如果仍有失败用例：回到 Fix 阶段继续修复（最多循环 3 次，超过则提示用户人工介入）

**暂停，等待用户确认。**

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
