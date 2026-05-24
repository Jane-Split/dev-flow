---
name: dev-flow
description: AI开发全流程自动化Agent技能系统，支持项目调研、架构决策、需求分析、详细设计、任务拆分、多Agent并行开发、测试验证、Bug修复、紧急Hotfix的完整开发流程，具备断点续传和进度可视化能力
---

# dev-flow

## 描述

dev-flow 是一个AI驱动的开发全流程自动化系统。当用户输入 `/dev-flow <需求描述>` 时，AI 将按照本技能定义的流程逐步执行，完成从项目调研到代码交付的完整开发周期。

系统支持 **断点续传**（中断后从上次断点恢复）和 **进度可视化**（实时生成Markdown进度报告）。

## 使用场景

- 需要开发新功能或模块时
- 需要设计新项目架构时（架构决策）
- 需要理解现有项目架构并基于此开发时
- 需要自动生成测试用例并验证功能时
- 需要修复Bug并进行回归测试时
- 需要紧急修复线上错误时（Hotfix模式）
- 需要实现算法相关任务时（算法专家）
- 开发流程中断后需要恢复时（断点续传）

## 指令

当用户输入 `/dev-flow <需求描述>` 或 `/dev-flow -<阶段>` 时，按以下流程执行：

### 1. 检查项目记忆
- 读取 `.dev-flow/memory/` 目录下的项目记忆
- 如果没有记忆或用户使用 `--refresh`，先执行 Research 阶段

### 2. 执行指定阶段

#### Architecture 阶段 (`/dev-flow -architecture <需求描述>`)
1. 评估项目规模（小型/中型/大型）
2. 生成技术选型推荐（框架/数据库/缓存/消息队列/认证/监控/部署）
3. 选择架构模式（单体/分层/微服务）
4. 生成分层设计和目录结构
5. 生成部署方案和权衡分析
6. 生成架构决策文档，等待用户确认

#### Research 阶段 (`/dev-flow -research`)
1. 扫描项目目录结构
2. 检测技术栈和依赖
3. 提取编码规范
4. 扫描组件、API、工具函数
5. 将结果写入 `.dev-flow/memory/`
6. 生成调研摘要，等待用户确认

#### Analyze 阶段 (`/dev-flow -analyze`)
1. 解析用户需求，识别需求类型
2. 检索相关项目记忆
3. 识别需求歧义和缺失信息
4. 评估影响范围
5. 生成需求理解文档
6. 等待用户确认

#### Design 阶段 (`/dev-flow -design`)
1. 基于需求理解设计数据层
2. 设计接口层（端点/错误码）
3. 设计组件层（组件树/Props）
4. 设计业务逻辑和样式
5. 生成设计文档
6. 等待用户确认

#### Plan 阶段 (`/dev-flow -plan`)
1. 将设计拆分为可执行任务
2. 分析任务依赖关系
3. 构建依赖图并排序
4. 生成任务列表
5. 等待用户确认

#### Develop 阶段 (`/dev-flow -develop`)
1. 按依赖顺序读取任务
2. 为每个任务选择专家（前端/后端/数据库/算法）
3. 并行执行无依赖任务
4. 每个任务自检代码质量
5. 生成代码，等待用户确认

> **算法专家**: 当任务涉及排序、搜索、数据结构、动态规划等算法时，自动匹配 AlgorithmExpert，从20+内置算法模板生成完整的 TypeScript 实现和测试用例。

#### Test 阶段 (`/dev-flow -test`)
1. 生成单元测试用例
2. 生成API测试用例
3. 生成E2E测试用例
4. 执行测试（支持Playwright）
5. 生成测试报告

#### Fix 阶段 (`/dev-flow -fix`)
1. 分析失败的测试用例
2. 定位并修复Bug
3. 回归测试

#### Hotfix 模式 (`/dev-flow -hotfix <错误描述>`)
1. 解析错误类型（语法/类型/依赖/配置/运行时/逻辑）
2. 搜索项目中相关文件
3. 分析错误根因
4. 生成修复方案（最多5个受影响文件）
5. 生成验证步骤
6. 直接输出，无需等待确认

> Hotfix 模式独立于7阶段流程，可随时调用。

### 3. 全流程模式 (`/dev-flow <需求>`)
按顺序执行：Research → Analyze → Design → Plan → Develop → Test → Fix
每个阶段完成后等待用户确认。
执行过程中自动保存会话状态，支持断点续传。
自动生成进度报告。

### 4. 断点续传 (`/dev-flow --resume`)
1. 查找最近的未完成会话
2. 恢复已完成的阶段结果
3. 从中断的下一个阶段继续执行
4. 完成后生成进度报告

## 记忆系统使用

执行每个阶段前，必须读取 `.dev-flow/memory/` 中的相关记忆：
- 开发组件前：读取 `components/` 和 `styles/`
- 开发API前：读取 `apis/` 和 `conventions/`
- 编写代码时：遵守 `conventions/` 中的规范
- 架构决策前：读取 `architecture/`（如存在）

## 进度报告

全流程执行时，自动生成 Markdown 进度报告保存到 `.dev-flow/sessions/progress-{sessionId}.md`，包含：
- 总进度百分比和进度条
- 各阶段状态和耗时
- 任务详情和负责专家
- 产出文件清单

## 示例

**输入**: `/dev-flow 实现用户登录功能`

**执行流程**:
1. Research: 扫描项目，发现已有 Button、Input 组件，/api/auth 接口
2. Analyze: 识别需要登录表单、API调用、状态管理
3. Design: 设计 LoginForm 组件、login API、useAuth hook
4. Plan: 拆分为创建组件、添加API、集成状态管理
5. Develop: 并行开发各任务
6. Test: 生成并执行测试用例
7. Fix: 修复发现的问题

**输入**: `/dev-flow -hotfix TypeError: Cannot read property 'name' of undefined at UserComponent.tsx:42`

**执行流程**:
1. 解析错误类型: runtime（运行时错误）
2. 搜索相关文件: UserComponent.tsx
3. 分析根因: 未处理空值引用
4. 生成修复: 添加可选链操作符和空值检查
5. 生成验证步骤

**输入**: `/dev-flow --resume`

**执行流程**:
1. 发现未完成会话: session-xxx
2. 已完成: Research, Analyze, Design
3. 从 Plan 阶段继续执行...

## 代码生成规范

### 核心原则
1. **禁止生成空壳代码**：所有生成的代码必须是完整可运行的实现，不允许出现 `// TODO: 实现业务逻辑`、`{/* 描述 */}` 等占位符
2. **基于设计文档生成**：严格按照 Design 阶段的输出（数据模型、API 契约、组件定义、业务流程）生成代码
3. **复用已有代码**：生成代码前必须读取 `.dev-flow/memory/` 中的组件库、API、工具函数，优先复用
4. **遵守项目规范**：必须遵守 `.dev-flow/memory/conventions/` 中的编码规范

### 代码质量要求
- 所有函数必须有完整的参数类型和返回类型
- 所有公共方法必须有 JSDoc/docstring 注释
- 错误处理必须完整（try-catch 或错误边界）
- 组件必须有 Props 类型定义和默认值
- API 端点必须有请求验证和错误响应

### 禁止事项
- ❌ `// TODO: 实现业务逻辑`
- ❌ `// TODO: 添加字段定义`
- ❌ `{/* 描述 */}`
- ❌ `// TODO: 调用被测函数`
- ❌ `expect(true).toBe(true)` （测试必须有真实断言）
- ❌ 返回硬编码的 `{ code: 0, data: null }`

## 代码生成示例

### React 组件示例

```tsx
// ✅ 正确：完整实现
import React, { useState } from 'react';

interface LoginFormProps {
  onSubmit: (credentials: { email: string; password: string }) => Promise<void>;
  isLoading?: boolean;
  error?: string | null;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSubmit, isLoading = false, error }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const validate = (): boolean => {
    if (!email.includes('@')) {
      setValidationError('请输入有效的邮箱地址');
      return false;
    }
    if (password.length < 6) {
      setValidationError('密码至少6个字符');
      return false;
    }
    setValidationError(null);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    await onSubmit({ email, password });
  };

  return (
    <form onSubmit={handleSubmit} className="login-form">
      <div className="form-field">
        <label htmlFor="email">邮箱</label>
        <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="请输入邮箱" />
      </div>
      <div className="form-field">
        <label htmlFor="password">密码</label>
        <input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="请输入密码" />
      </div>
      {(validationError || error) && <div className="error-message">{validationError || error}</div>}
      <button type="submit" disabled={isLoading}>{isLoading ? '登录中...' : '登录'}</button>
    </form>
  );
};
```

### API 端点示例

```typescript
// ✅ 正确：完整实现
import { Router, Request, Response } from 'express';

const router = Router();

interface LoginRequest {
  email: string;
  password: string;
}

interface LoginResponse {
  token: string;
  user: { id: string; name: string; email: string };
}

/**
 * 用户登录
 * POST /api/auth/login
 */
router.post('/login', async (req: Request<{}, {}, LoginRequest>, res: Response<LoginResponse | { error: string }>) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: '邮箱和密码不能为空' });
    return;
  }

  try {
    // 查询用户
    const user = await UserModel.findByEmail(email);
    if (!user) {
      res.status(401).json({ error: '邮箱或密码错误' });
      return;
    }

    // 验证密码
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      res.status(401).json({ error: '邮箱或密码错误' });
      return;
    }

    // 生成 token
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, { expiresIn: '7d' });

    res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
  } catch (error) {
    console.error('登录失败:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});
```

### 测试用例示例

```typescript
// ✅ 正确：有真实断言
import { describe, it, expect, vi } from 'vitest';
import { LoginForm } from '../components/LoginForm';

describe('LoginForm', () => {
  it('should render email and password inputs', () => {
    const onSubmit = vi.fn();
    render(<LoginForm onSubmit={onSubmit} />);
    expect(screen.getByLabelText('邮箱')).toBeInTheDocument();
    expect(screen.getByLabelText('密码')).toBeInTheDocument();
  });

  it('should show validation error for invalid email', () => {
    const onSubmit = vi.fn();
    render(<LoginForm onSubmit={onSubmit} />);
    fireEvent.change(screen.getByLabelText('邮箱'), { target: { value: 'invalid' } });
    fireEvent.click(screen.getByText('登录'));
    expect(screen.getByText('请输入有效的邮箱地址')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('should call onSubmit with credentials when form is valid', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<LoginForm onSubmit={onSubmit} />);
    fireEvent.change(screen.getByLabelText('邮箱'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText('密码'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByText('登录'));
    expect(onSubmit).toHaveBeenCalledWith({ email: 'test@example.com', password: 'password123' });
  });

  it('should disable submit button when loading', () => {
    const onSubmit = vi.fn();
    render(<LoginForm onSubmit={onSubmit} isLoading={true} />);
    expect(screen.getByText('登录中...')).toBeDisabled();
  });
});
```

## 记忆驱动的开发流程

### 开发前必须读取记忆
在生成任何代码之前，必须按以下顺序读取项目记忆：

1. **编码规范**（`.dev-flow/memory/conventions/`）
   - 读取所有规范文件，确保生成的代码符合项目风格
   - 包括：命名规范、文件组织、导入顺序、注释风格

2. **已有组件**（`.dev-flow/memory/components/`）
   - 检查是否已有可复用的组件
   - 如果已有类似组件，应扩展而非重新创建
   - 遵循已有组件的 Props 命名和结构模式

3. **已有 API**（`.dev-flow/memory/apis/`）
   - 检查是否已有相关的 API 端点
   - 新 API 应遵循已有的路由命名、错误码、响应格式

4. **工具函数**（`.dev-flow/memory/utils/`）
   - 检查是否已有可复用的工具函数
   - 优先使用项目已有的工具函数

5. **架构决策**（`.dev-flow/memory/architecture/`）
   - 读取架构决策，确保新代码符合整体架构

### 记忆更新
每个阶段完成后，将新产生的信息写入记忆：
- Research: 写入项目结构、技术栈、组件、API
- Design: 写入新的数据模型、API 契约
- Develop: 更新组件库、API 文档
- Fix: 记录常见 Bug 模式和修复方案
