---
name: dev-flow
description: AI开发全流程自动化Agent技能系统，支持架构决策、断点续传、进度可视化、算法专家、紧急Hotfix
---

# dev-flow

## 描述

AI驱动的开发全流程自动化系统，覆盖项目调研、架构决策、需求分析、详细设计、任务拆分、多Agent开发、测试验证、Bug修复的完整周期。支持断点续传和进度可视化。

## 使用场景

- 新功能开发
- 新项目架构设计
- 基于现有架构的功能增强
- 自动化测试生成与执行
- Bug修复与回归测试
- 紧急线上错误修复（Hotfix）
- 算法相关任务开发
- 中断流程恢复（断点续传）

## 命令格式

```
/dev-flow <需求描述>
/dev-flow --resume
/dev-flow -research [--refresh]
/dev-flow -architecture <需求描述>
/dev-flow -analyze
/dev-flow -design
/dev-flow -plan
/dev-flow -develop
/dev-flow -test
/dev-flow -fix
/dev-flow -hotfix <错误描述>
```

## 工作流程

### Stage 0: Architecture (架构决策)
评估项目规模并生成架构方案：
- 规模评估（小型/中型/大型）
- 技术选型（框架/数据库/缓存/消息队列/认证/监控/部署）
- 架构模式选择（单体/分层/微服务）
- 分层设计和目录结构
- 部署方案和权衡分析

输出: `.dev-flow/sessions/architecture-{timestamp}.md`

### Stage 1: Research (项目调研)
扫描项目，提取并存储：
- 目录结构和技术栈
- 编码规范
- 组件库
- API接口
- 工具函数

存储位置: `.dev-flow/memory/`

### Stage 2: Analyze (需求分析)
解析用户需求：
1. 识别需求类型和优先级
2. 检索相关项目记忆
3. 识别歧义和缺失信息
4. 评估影响范围

输出: `.dev-flow/sessions/<id>/analyze-result.md`

### Stage 3: Design (详细设计)
生成技术设计：
- 数据层设计
- 接口层设计
- 组件层设计
- 业务逻辑设计
- 样式设计

输出: `.dev-flow/sessions/<id>/design-doc.md`

### Stage 4: Plan (任务拆分)
将设计拆分为可执行任务：
1. 识别任务单元
2. 分析依赖关系
3. 构建DAG
4. 拓扑排序

输出: `.dev-flow/sessions/<id>/task-list.json`

### Stage 5: Develop (开发执行)
执行开发任务：
1. 按依赖顺序执行
2. 专家匹配（前端/后端/数据库/算法）
3. 并行执行无依赖任务
4. 代码自检

> **算法专家**: 自动识别算法任务，从20+模板生成 TypeScript 实现和测试。

### Stage 6: Test (测试验证)
生成并执行测试：
- 单元测试
- API测试
- E2E测试

输出: `.dev-flow/sessions/<id>/test-report.md`

### Stage 7: Fix (Bug修复)
修复测试发现的问题并回归测试。

### Hotfix 模式（独立）
快速修复线上错误：
1. 解析错误类型（语法/类型/依赖/配置/运行时/逻辑）
2. 搜索相关文件
3. 分析根因
4. 生成修复方案
5. 生成验证步骤

无需前置阶段，直接调用。

### 断点续传
- 全流程自动保存会话到 `.dev-flow/sessions/{sessionId}.json`
- `/dev-flow --resume` 从最近未完成会话继续
- 自动跳过已完成阶段

### 进度可视化
- 自动生成 Markdown 进度报告
- 保存到 `.dev-flow/sessions/progress-{sessionId}.md`
- 包含进度条、阶段状态、任务详情、产出文件

## 记忆系统

```
.dev-flow/memory/
├── conventions/     # 编码规范
├── components/      # 组件
├── apis/           # API接口
├── utils/          # 工具函数
├── styles/         # 样式系统
├── architecture/   # 架构决策
└── patterns/       # 学习到的模式
```

## 上下文控制

- 任务拆分: >8000 tokens 必须拆分
- 记忆检索: 限制 4000 tokens
- 增量加载: 按需加载任务上下文

## 学习机制

从用户确认和修改中提取模式，存储到 `.dev-flow/memory/patterns/`，后续自动应用。

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

## 约束

1. 遵守项目记忆中的编码规范
2. 优先复用已有组件和API
3. 代码包含适当注释
4. 测试覆盖率: 单元 >80%，关键路径 100%
5. 每个阶段完成后等待用户确认
6. Hotfix 模式无需等待确认
7. 断点续传自动跳过已完成阶段
