# dev-flow 用户操作手册

## 目录

- [1. 概述](#1-概述)
- [2. 安装](#2-安装)
- [3. 快速上手](#3-快速上手)
- [4. 命令参考](#4-命令参考)
- [5. 各阶段详解](#5-各阶段详解)
  - [5.1 Research（项目调研）](#51-research项目调研)
  - [5.2 Analyze（需求分析）](#52-analyze需求分析)
  - [5.3 Design（详细设计）](#53-design详细设计)
  - [5.4 Develop（开发执行）](#54-develop开发执行)
  - [5.5 Test（测试验证）](#55-test测试验证)
  - [5.6 Fix（Bug 修复）](#56-fixbug-修复)
- [6. Hotfix 模式](#6-hotfix-模式)
- [7. 断点续传](#7-断点续传)
- [8. 记忆系统](#8-记忆系统)
  - [8.1 基础记忆](#81-基础记忆)
  - [8.2 长期记忆](#82-长期记忆)
  - [8.3 记忆使用和更新规则](#83-记忆使用和更新规则)
- [9. 学习能力](#9-学习能力)
- [10. 常见问题](#10-常见问题)

---

## 1. 概述

dev-flow 是一个 AI 开发全流程编排 Skill，适用于 Cursor、Trae、Qoder、Claude Code 等 AI 编程工具。

它通过结构化的 6 阶段流程（Research → Analyze → Design → Develop → Test → Fix），让 AI 编程工具按步骤执行开发任务，避免跳过重要步骤、生成不一致代码、遗漏边界情况等问题。

**核心特点**：
- 每个阶段完成后暂停等待你确认，确保产出质量
- 自动记忆项目结构和编码规范，后续开发自动遵守
- 具备学习能力，使用越多越了解你的偏好

## 2. 安装

### 前置条件

- Node.js >= 18.0.0
- 已安装 Cursor / Trae / Qoder / Claude Code 中的任意一个

### 安装步骤

```bash
# 1. 进入你的项目目录
cd your-project

# 2. 安装 dev-flow
npm install Jane-Split/dev-flow --save-dev

# 3. 执行安装
npx dev-flow install
```

### 安装产物

安装完成后，你的项目中会新增以下文件：

```
your-project/
├── .trae/skills/dev-flow/SKILL.md        # Trae 的 Skill 文件
├── .cursor/commands/dev-flow.md          # Cursor 的命令文件
├── .qoder/commands/dev-flow.md           # Qoder 的命令文件
├── .claude/commands/dev-flow.md          # Claude Code 的命令文件
└── .dev-flow/
    ├── memory/                           # 记忆目录（11 个 Markdown 模板）
    │   ├── project-overview.md
    │   ├── conventions.md
    │   ├── components.md
    │   ├── apis.md
    │   ├── models.md
    │   ├── utils.md
    │   ├── architecture.md
    │   ├── patterns.md
    │   ├── mistakes.md
    │   ├── preferences.md
    │   └── decisions.md
    └── sessions/                         # 会话记录目录
        └── .gitkeep
```

### 只安装特定工具

如果你只使用某个 AI 编程工具，可以只安装对应的 skill 文件：

```bash
npx dev-flow trae     # 仅安装 Trae
npx dev-flow cursor   # 仅安装 Cursor
npx dev-flow qoder    # 仅安装 Qoder
npx dev-flow claude   # 仅安装 Claude Code
```

### 重新安装

如果记忆文件已存在，安装脚本会跳过不覆盖。如需重新生成记忆文件，先删除 `.dev-flow/memory/` 目录：

```bash
rm -rf .dev-flow/memory
npx dev-flow install
```

## 3. 快速上手

**场景**：在一个 React + TypeScript 项目中实现用户登录功能。

### Step 1：安装

```bash
cd my-react-app
npm install Jane-Split/dev-flow --save-dev
npx dev-flow install
```

### Step 2：在 AI 编程工具中使用

打开 Cursor / Trae / Qoder / Claude Code，在对话框中输入：

```
/dev-flow 实现用户登录功能，包含邮箱密码登录、表单验证和记住密码
```

### Step 3：跟随阶段确认

AI 将按以下流程执行，每个阶段完成后暂停等你确认：

1. **Research** → AI 扫描你的项目，展示技术栈、已有组件等信息 → 你确认
2. **Analyze** → AI 分析需求，列出功能点和影响范围 → 你确认
3. **Design** → AI 设计数据模型、API、组件 → 你确认
4. **Develop** → AI 生成完整可运行的代码 → 你确认
5. **Test** → AI 生成并执行测试 → 你确认
6. **Fix** → 如有失败用例，AI 自动修复（最多 3 轮）

## 4. 命令参考

### 全流程模式

| 命令 | 说明 |
|------|------|
| `/dev-flow <需求描述>` | 执行完整流程：Research → Analyze → Design → Develop → Test → Fix |

### 单阶段模式

| 命令 | 说明 | 使用场景 |
|------|------|----------|
| `/dev-flow -research` | 仅执行项目调研 | 项目首次使用 dev-flow，或项目结构有较大变化 |
| `/dev-flow -analyze <需求>` | 仅执行需求分析 | 需要先了解需求的影响范围 |
| `/dev-flow -design <需求>` | 仅执行详细设计 | 需要先看设计方案再开发 |
| `/dev-flow -develop <需求>` | 直接开发（跳过设计） | 小需求，不需要详细设计 |
| `/dev-flow -test` | 生成测试并执行 | 已有代码，需要补充测试 |
| `/dev-flow -fix` | 分析并修复 Bug | 测试失败，需要修复 |
| `/dev-flow -hotfix <错误信息>` | 紧急修复线上错误 | 生产环境报错，需要快速修复 |

### 断点续传

| 命令 | 说明 |
|------|------|
| `/dev-flow --resume` | 从上次中断处继续 |

## 5. 各阶段详解

### 5.1 Research（项目调研）

**做什么**：AI 扫描你的项目，了解项目结构、技术栈、编码规范、已有组件和 API。

**执行步骤**：
1. 扫描项目根目录，识别项目类型和配置文件
2. 扫描源码目录，识别入口文件、路由定义、分层架构
3. 列出所有已有组件、API、工具函数、数据模型
4. 读取 ESLint/Prettier/TypeScript 配置，推断编码规范
5. 将所有信息写入 `.dev-flow/memory/` 目录

**你会看到**：一张调研摘要表格，包含项目类型、语言、框架、组件数量、API 数量、编码规范等。

**你需要做的**：检查调研结果是否准确，补充或纠正 AI 遗漏的信息。

**提示**：
- 首次使用 dev-flow 时，建议先单独执行 `/dev-flow -research` 建立项目记忆
- 项目结构有较大变化时，可以重新执行 Research 更新记忆

### 5.2 Analyze（需求分析）

**做什么**：AI 解析你的需求，关联已有代码，识别歧义和影响范围。

**执行步骤**：
1. 识别需求类型（新功能/增强/Bug 修复/重构/性能优化）和优先级
2. 提取核心功能点列表
3. 读取项目记忆，关联已有组件、API、数据模型
4. 列出不明确的地方，向你提问澄清
5. 生成需求分析文档

**你会看到**：需求分析文档，包含功能点、约束条件、歧义/待确认项、相关已有代码。

**你需要做的**：确认功能点是否完整，回答 AI 提出的歧义问题。

### 5.3 Design（详细设计）

**做什么**：AI 基于需求分析和项目记忆，设计数据模型、API 接口、组件树和业务流程。

**执行步骤**：
1. 读取项目记忆（project-overview、architecture、decisions）
2. 设计数据模型（TypeScript interface / Python dataclass 等）
3. 设计 API 端点（方法、路径、请求体、响应体、错误码）
4. 设计组件树（页面 → 容器 → 展示组件）
5. 描述核心业务流程
6. 自检：确保每个功能点都有对应的设计覆盖

**你会看到**：设计文档，包含数据模型定义、API 设计表、组件设计表、业务流程描述。

**你需要做的**：检查设计方案是否合理，确认或提出修改意见。

### 5.4 Develop（开发执行）

**做什么**：AI 按照设计方案，按依赖顺序生成完整可运行的代码。

**执行步骤**：
1. 读取项目记忆（conventions、components、apis、utils、patterns）
2. 按依赖顺序开发：数据模型 → 工具函数 → API/服务层 → 状态管理 → 展示组件 → 容器组件 → 路由
3. 每个文件生成后进行自检（类型错误、边界情况、风格一致性、安全漏洞）
4. 简要说明每个文件的实现思路

**你会看到**：完整的代码文件，每个文件附带实现思路说明。

**你需要做的**：检查代码质量，确认后进入 Test 阶段。

**重要**：
- dev-flow 要求 AI 生成**完整可运行**的代码，不会生成 `// TODO` 占位符
- AI 会自动遵守项目已有的编码风格
- AI 会自动复用已有的组件和工具函数

### 5.5 Test（测试验证）

**做什么**：AI 为开发的代码生成测试用例并执行。

**执行步骤**：
1. 为每个模块生成测试用例（组件测试、API 测试、工具函数测试）
2. 确保覆盖正常流程、异常流程、边界情况
3. 运行测试命令（npm test / pytest / mvn test）
4. 生成测试报告

**你会看到**：测试报告表格，包含各模块的测试数、通过数、失败数、覆盖率。

**你需要做的**：查看测试结果。如果有失败用例，确认后进入 Fix 阶段。

**测试覆盖要求**：
- 每个功能点至少有一个测试用例
- 组件测试覆盖渲染、交互、边界情况（空数据、加载状态、错误状态）
- API 测试覆盖成功流程、参数验证失败、权限不足、服务器错误
- 禁止只测试渲染而不测试交互

### 5.6 Fix（Bug 修复）

**做什么**：AI 分析测试失败原因，修复代码并回归测试。

**执行步骤**：
1. 读取失败测试的输出，定位出错代码
2. 分析根因（逻辑错误/类型错误/遗漏边界情况）
3. 修复代码，确保不引入新问题
4. 重新运行所有测试

**你会看到**：修复说明和回归测试结果。

**你需要做的**：确认修复是否正确。

**注意**：Fix 阶段最多循环 3 次。如果 3 次后仍有失败用例，AI 会提示你人工介入。

## 6. Hotfix 模式

Hotfix 是独立模式，不需要经过完整流程，随时可用。

**使用场景**：生产环境报错，需要快速定位和修复。

**命令**：
```
/dev-flow -hotfix <错误信息>
```

**示例**：
```
/dev-flow -hotfix TypeError: Cannot read properties of undefined (reading 'map') at UserList.tsx:42
```

**执行流程**：
1. AI 解析错误类型和位置
2. 读取相关代码文件
3. 分析错误上下文
4. 提供根因分析和修复代码
5. 提供验证步骤

**特点**：Hotfix 直接输出结果，不需要等待确认。

## 7. 断点续传

当全流程执行到一半中断（如关闭了 AI 编程工具、会话超时等），可以使用断点续传从上次中断处继续。

**命令**：
```
/dev-flow --resume
```

**工作原理**：
- 每个阶段完成后，AI 会将进度写入 `.dev-flow/sessions/` 目录
- 续传时，AI 读取最近的未完成会话，从下一个未完成的阶段继续

**会话文件格式**（`.dev-flow/sessions/{sessionId}.md`）：
```markdown
# 会话：用户登录功能
- 状态：进行中
- 当前阶段：Design
- 已完成：Research → Analyze
- 开始时间：2026-05-24 10:00

## Research 摘要
[调研结果摘要]

## Analyze 摘要
[需求分析摘要]
```

## 8. 记忆系统

dev-flow 的记忆系统让 AI 能够记住项目信息和用户偏好，实现跨会话的知识积累。

### 8.1 基础记忆

基础记忆在 Research 阶段自动创建和更新，共 7 个文件：

| 文件 | 内容 | 更新时机 |
|------|------|----------|
| `project-overview.md` | 项目概览：技术栈、架构、目录结构、入口文件 | Research |
| `conventions.md` | 编码规范：命名风格、导入排序、注释风格、文件组织 | Research / Fix |
| `components.md` | 已有组件：名称、路径、Props、用途 | Research / Develop |
| `apis.md` | 已有 API：路径、方法、参数、响应格式 | Research / Develop |
| `models.md` | 数据模型：名称、字段、关系 | Research / Develop |
| `utils.md` | 工具函数：名称、签名、用途 | Research |
| `architecture.md` | 架构决策：分层方式、设计模式 | Research |

### 8.2 长期记忆

长期记忆通过 AI 的学习能力自动积累，共 4 个文件：

| 文件 | 内容 | 积累方式 |
|------|------|----------|
| `patterns.md` | 常见代码模式：可复用的代码片段、使用场景、使用次数 | Develop 中记录新模式，复用时更新次数 |
| `mistakes.md` | 常见错误及修复：Bug 模式、修复方案、出现次数、预防措施 | Test/Fix 中记录新错误模式 |
| `preferences.md` | 用户偏好：代码风格、架构偏好、质量要求 | 用户反馈时记录 |
| `decisions.md` | 架构决策记录（ADR）：日期、决策、原因、影响 | 重大决策时记录 |

#### patterns.md 示例

```markdown
# 常见代码模式

## API 错误处理模式
```typescript
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
```

#### mistakes.md 示例

```markdown
# 常见错误及修复

## 类型错误：Promise 未 await
**错误模式**：`const data = fetchUser();`（忘记 await）
**修复方案**：`const data = await fetchUser();`
**出现次数**：3
**最后出现**：2026-05-24
**预防措施**：ESLint 规则 @typescript-eslint/no-floating-promises
```

#### preferences.md 示例

```markdown
# 用户偏好

## 代码风格
- 引号：单引号（'）
- 分号：必须
- 缩进：2 空格

## 架构偏好
- 状态管理：React Context + useReducer（不喜欢 Redux）
- 样式方案：Tailwind CSS（不喜欢 CSS Modules）
```

#### decisions.md 示例

```markdown
# 架构决策记录

## ADR-001：选择 React Hook Form 而非 Formik
**日期**：2026-05-24
**决策**：使用 React Hook Form 处理表单
**原因**：性能更好、TypeScript 集成更顺畅、包体积更小
**影响**：所有表单组件
```

### 8.3 记忆使用和更新规则

#### 读取规则

| 时机 | 必须读取的文件 |
|------|---------------|
| Develop 前 | conventions、components、apis、utils、patterns |
| Design 前 | project-overview、architecture、decisions |
| Analyze 前 | components、apis、models |
| Fix 前 | mistakes |
| 所有阶段前 | preferences |

#### 更新规则

| 时机 | 更新的文件 |
|------|-----------|
| Research 完成后 | 所有 7 个基础记忆文件 |
| Develop 完成后 | components、apis、models、patterns |
| Fix 完成后 | mistakes、patterns、conventions |
| 用户明确反馈后 | preferences |
| 重大架构决策后 | decisions |

#### 记忆强化机制

- 每个模式/错误/偏好记录**使用次数**
- 使用次数 > 3 次 → 标记为 **"高频"**，AI 优先推荐
- 使用次数 > 5 次 → 标记为 **"标准"**，AI 必须遵守

## 9. 学习能力

dev-flow 会从你的使用过程中持续学习，让 AI 越来越了解你的项目和偏好。

### 学习来源

| 来源 | AI 学到什么 | 更新的文件 |
|------|------------|-----------|
| 你表扬某段代码 | 记录代码模式，标记为"推荐" | patterns.md |
| 你修改了 AI 生成的代码 | 你的编码习惯和偏好 | preferences.md / patterns.md |
| 测试发现 Bug | 错误模式和修复方案 | mistakes.md |
| 你明确指定偏好 | 你的偏好设置 | preferences.md |
| 重大架构决策 | 决策和原因 | decisions.md |
| 某模式被复用 3 次以上 | 高频模式标记 | patterns.md |

### 学习示例

**示例 1：从代码修改中学习**

AI 生成的代码：
```typescript
const handleSubmit = async (data) => {
  await api.createUser(data);
  router.push('/users');
};
```

你修改为：
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

AI 自动学习：
- 你偏好添加 toast 提示 → 更新 `preferences.md`
- API 调用需要 try-catch + toast → 更新 `patterns.md`

**示例 2：从错误中学习**

Test 阶段发现：组件未处理 loading 状态导致测试失败。
Fix 阶段修复：添加 loading 状态处理。

AI 自动学习：
- "忘记处理 loading 状态"是常见错误 → 更新 `mistakes.md`
- "标准 loading 处理模式" → 更新 `patterns.md`

### 学习效果评估

dev-flow 通过以下指标衡量学习效果：

| 指标 | 目标 | 评估方式 |
|------|------|----------|
| 代码接受率 | > 80% | 你修改 AI 生成代码的比例降低 |
| Bug 重复率 | < 10% | 同一错误不出现超过 2 次 |
| 模式复用率 | > 60% | 新代码复用已有模式的比例 |
| 用户满意度 | > 4.5/5 | 主观评价 |

### 如何帮助 AI 学得更好

1. **显式反馈**：直接告诉 AI 你的偏好，如"以后都用单引号"、"表单都用 React Hook Form"
2. **保持一致的修改风格**：AI 会观察你的修改模式，一致的修改更容易被学习
3. **及时确认好的输出**：当 AI 生成了满意的代码，确认"这段代码很好"
4. **定期检查记忆文件**：查看 `.dev-flow/memory/` 目录，确认 AI 的学习是否准确

## 10. 常见问题

### Q: 安装后找不到 /dev-flow 命令？

确保你在 AI 编程工具中打开了安装了 dev-flow 的项目目录。Skill 文件是项目级别的，不是全局的。

### Q: AI 没有按阶段执行，直接生成了代码？

检查 Skill 文件是否正确安装：
- Trae：`.trae/skills/dev-flow/SKILL.md`
- Cursor：`.cursor/commands/dev-flow.md`
- Qoder：`.qoder/commands/dev-flow.md`
- Claude Code：`.claude/commands/dev-flow.md`

### Q: 记忆文件可以手动编辑吗？

可以。所有记忆文件都是标准 Markdown 格式，你可以直接编辑。AI 在读取时会使用你编辑后的内容。

### Q: 如何重置记忆？

删除 `.dev-flow/memory/` 目录，然后重新执行 `npx dev-flow install`。或者只删除需要重置的特定文件。

### Q: 支持哪些编程语言和框架？

dev-flow 是语言和框架无关的。AI 会根据你的项目自动识别技术栈并适配。支持 TypeScript、JavaScript、Python、Java、Go、Rust 等主流语言。

### Q: 可以在已有项目中使用吗？

可以。dev-flow 的 Research 阶段会自动扫描已有项目结构，不会影响已有代码。建议首次使用时先执行 `/dev-flow -research` 建立项目记忆。

### Q: Fix 阶段 3 次循环后仍有失败怎么办？

AI 会提示你人工介入。你可以：
1. 手动修复代码
2. 检查测试用例是否合理（可能是测试本身有问题）
3. 使用 `/dev-flow -hotfix <错误信息>` 针对特定错误修复

### Q: 多人协作时记忆会冲突吗？

dev-flow 的记忆文件是本地文件，建议将 `.dev-flow/memory/` 加入 `.gitignore`（安装脚本不会自动添加）。如果团队共享记忆，可以将基础记忆文件提交到 Git。
