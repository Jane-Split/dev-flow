# dev-flow

AI开发全流程自动化系统（支持断点续传 + 进度可视化 + 算法专家 + Hotfix）

## 用法

```
/dev-flow <需求描述>              # 执行完整流程
/dev-flow --resume                # 断点续传
/dev-flow -research [--refresh]   # 项目调研
/dev-flow -architecture <需求>    # 架构决策
/dev-flow -analyze                # 需求分析
/dev-flow -design                 # 详细设计
/dev-flow -plan                   # 任务拆分
/dev-flow -develop                # 开发执行
/dev-flow -test                   # 测试验证
/dev-flow -fix                    # Bug修复
/dev-flow -hotfix <错误描述>      # 紧急修复
```

## 执行流程

### 0. 断点续传
全流程自动保存会话到 `.dev-flow/sessions/{sessionId}.json`。
`/dev-flow --resume` 查找最近未完成会话，恢复已保存的阶段结果，从中断处继续。

### 1. 检查记忆
首先检查 `.dev-flow/memory/` 是否存在项目记忆。如果没有，或用户使用 `--refresh`，执行 Research 阶段。

### 2. 阶段执行

**Architecture**: 评估规模 → 技术选型 → 架构模式 → 分层设计 → 部署方案 → 权衡分析 → 生成文档

**Research**: 扫描项目 → 提取规范/组件/API → 写入记忆

**Analyze**: 解析需求 → 关联记忆 → 识别歧义 → 评估影响 → 生成文档

**Design**: 设计数据层 → 接口层 → 组件层 → 业务逻辑 → 样式 → 生成设计文档

**Plan**: 拆分任务 → 分析依赖 → 构建DAG → 生成任务列表

**Develop**: 按序执行任务 → 专家匹配（前端/后端/数据库/算法）→ 并行开发 → 自检 → 生成代码

> **算法专家**: 自动识别算法任务，从20+内置模板生成 TypeScript 实现和测试用例，标注复杂度。

**Test**: 生成测试 → 执行（单元/API/E2E）→ 生成报告

**Fix**: 分析失败 → 定位Bug → 修复 → 回归测试

**Hotfix**: 解析错误类型 → 搜索相关文件 → 分析根因 → 生成修复方案 → 验证步骤（独立模式，无需前置阶段）

### 3. 记忆系统

```
.dev-flow/memory/
├── conventions/    # 编码规范
├── components/     # 组件文档
├── apis/          # API文档
├── utils/         # 工具函数
├── styles/        # 样式系统
├── architecture/  # 架构决策
└── patterns/      # 学习到的模式
```

执行各阶段前读取相关记忆作为上下文。

### 4. 进度报告

全流程自动生成 Markdown 进度报告：
- 保存位置: `.dev-flow/sessions/progress-{sessionId}.md`
- 内容: 进度条、阶段状态/耗时、任务详情、产出文件清单

### 5. 输出位置

```
.dev-flow/sessions/<session-id>/
├── analyze-result.md              # 需求分析结果
├── design-doc.md                  # 设计文档
├── task-list.json                 # 任务列表
├── test-report.md                 # 测试报告
├── architecture-{timestamp}.md    # 架构决策文档
├── {sessionId}.json               # 会话状态（断点续传）
└── progress-{sessionId}.md        # 进度报告
```

### 6. 上下文控制

- 任务控制在 8000 tokens 以内
- 记忆检索限制 4000 tokens
- 阶段间传递摘要而非完整文档

### 7. 学习

从用户反馈中学习，更新 `.dev-flow/memory/patterns/`，后续自动应用。

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

- 遵守项目记忆中的编码规范
- 优先复用已有组件和API
- 代码包含适当注释
- 测试覆盖率：单元 >80%，关键路径 100%
- 每个阶段完成后等待用户确认
- Hotfix 模式无需等待确认，直接输出
- 断点续传自动跳过已完成阶段
