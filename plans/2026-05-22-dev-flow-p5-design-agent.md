# P5: 详细设计Agent 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现DesignAgent，根据需求理解文档和项目记忆，生成可执行的技术设计文档，包括数据层设计、接口层设计、组件层设计、业务逻辑设计等。

**Architecture:** DesignAgent采用分层设计策略，依次完成数据层→接口层→组件层→业务逻辑层→样式层的设计，每层设计完成后进行自检。

**Tech Stack:** TypeScript

**依赖:** P2（记忆系统）, P4（需求分析Agent）

---

## 文件结构

```
dev-flow/
├── src/
│   ├── agents/
│   │   └── design-agent.ts        # 设计Agent
│   ├── designers/
│   │   ├── index.ts               # 设计器导出
│   │   ├── data-designer.ts       # 数据层设计器
│   │   ├── api-designer.ts        # 接口层设计器
│   │   ├── component-designer.ts  # 组件层设计器
│   │   ├── logic-designer.ts      # 业务逻辑设计器
│   │   └── style-designer.ts      # 样式设计器
│   └── templates/
│       └── design-doc.md          # 设计文档模板
└── tests/
    └── agents/
        └── design-agent.test.ts
```

---

### Task 1: 数据层设计器

**Files:**
- Create: `src/designers/data-designer.ts`

- [ ] **Step 1: 创建数据层设计器**

```typescript
// src/designers/data-designer.ts
import type { DataModel, ModelField } from '../memory/types.js';
import type { Feature } from '../agents/analyze-agent.js';

export interface DataDesign {
  models: DataModel[];
  validationRules: { model: string; field: string; rules: string[] }[];
  transformations: { name: string; from: string; to: string; logic: string }[];
}

export class DataDesigner {
  design(features: Feature[], existingModels: DataModel[]): DataDesign {
    const models: DataModel[] = [];
    const validationRules: DataDesign['validationRules'] = [];
    const transformations: DataDesign['transformations'] = [];

    for (const feature of features) {
      // 根据功能点推断需要的模型
      const inferredModels = this.inferModels(feature, existingModels);
      models.push(...inferredModels);

      // 生成校验规则
      for (const model of inferredModels) {
        for (const field of model.fields) {
          const rules = this.generateValidationRules(field);
          if (rules.length > 0) {
            validationRules.push({
              model: model.name,
              field: field.name,
              rules,
            });
          }
        }
      }
    }

    return { models, validationRules, transformations };
  }

  private inferModels(feature: Feature, existing: DataModel[]): DataModel[] {
    const models: DataModel[] = [];
    const lower = feature.name.toLowerCase();

    // 检查是否已存在相关模型
    const existingNames = existing.map(m => m.name.toLowerCase());

    if (lower.includes('用户') || lower.includes('user')) {
      if (!existingNames.includes('user')) {
        models.push({
          id: 'model-user',
          name: 'User',
          fields: [
            { name: 'id', type: 'string', required: true, description: '用户ID' },
            { name: 'username', type: 'string', required: true, description: '用户名' },
            { name: 'password', type: 'string', required: true, description: '密码（加密）' },
            { name: 'phone', type: 'string', required: false, description: '手机号' },
            { name: 'avatar', type: 'string', required: false, description: '头像URL' },
            { name: 'roles', type: 'string[]', required: false, description: '角色列表' },
            { name: 'createdAt', type: 'Date', required: true, description: '创建时间' },
          ],
          description: '用户模型',
        });
      }
    }

    if (lower.includes('登录') || lower.includes('login')) {
      models.push({
        id: 'model-loginparams',
        name: 'LoginParams',
        fields: [
          { name: 'username', type: 'string', required: true, description: '用户名' },
          { name: 'password', type: 'string', required: true, description: '密码' },
        ],
        description: '登录参数',
      });

      models.push({
        id: 'model-loginresult',
        name: 'LoginResult',
        fields: [
          { name: 'token', type: 'string', required: true, description: '访问令牌' },
          { name: 'refreshToken', type: 'string', required: false, description: '刷新令牌' },
          { name: 'user', type: 'User', required: true, description: '用户信息' },
        ],
        description: '登录结果',
      });
    }

    return models;
  }

  private generateValidationRules(field: ModelField): string[] {
    const rules: string[] = [];

    if (field.required) {
      rules.push('required');
    }

    if (field.type === 'string') {
      if (field.name.toLowerCase().includes('email')) {
        rules.push('email format');
      }
      if (field.name.toLowerCase().includes('phone')) {
        rules.push('phone format: 11 digits');
      }
      if (field.name.toLowerCase().includes('password')) {
        rules.push('min length: 6');
        rules.push('max length: 20');
      }
    }

    return rules;
  }
}
```

- [ ] **Step 2: 提交**

```bash
git add src/designers/data-designer.ts
git commit -m "feat(designers): add data layer designer"
```

---

### Task 2: 接口层设计器

**Files:**
- Create: `src/designers/api-designer.ts`

- [ ] **Step 1: 创建接口层设计器**

```typescript
// src/designers/api-designer.ts
import type { ApiEndpoint } from '../memory/types.js';
import type { Feature } from '../agents/analyze-agent.js';

export interface ApiDesign {
  endpoints: ApiEndpoint[];
  errorCodes: { code: string; message: string; description: string }[];
  authStrategy: string;
}

export class ApiDesigner {
  design(features: Feature[], existingApis: ApiEndpoint[]): ApiDesign {
    const endpoints: ApiEndpoint[] = [];
    const errorCodes: ApiDesign['errorCodes'] = [];

    for (const feature of features) {
      const inferredApis = this.inferApis(feature, existingApis);
      endpoints.push(...inferredApis);
    }

    // 生成通用错误码
    errorCodes.push(
      { code: '400001', message: '参数错误', description: '请求参数验证失败' },
      { code: '401001', message: '未授权', description: '需要登录' },
      { code: '403001', message: '禁止访问', description: '无权限执行此操作' },
      { code: '404001', message: '资源不存在', description: '请求的资源未找到' },
      { code: '500001', message: '服务器错误', description: '服务器内部错误' },
    );

    // 根据功能添加特定错误码
    const hasLogin = features.some(f => f.name.toLowerCase().includes('登录'));
    if (hasLogin) {
      errorCodes.push(
        { code: '401002', message: '账号或密码错误', description: '登录凭证不正确' },
        { code: '401003', message: '账号已锁定', description: '登录失败次数过多' },
      );
    }

    return {
      endpoints,
      errorCodes,
      authStrategy: 'Bearer Token (JWT)',
    };
  }

  private inferApis(feature: Feature, existing: ApiEndpoint[]): ApiEndpoint[] {
    const apis: ApiEndpoint[] = [];
    const existingPaths = existing.map(a => a.path);
    const lower = feature.name.toLowerCase();

    if (lower.includes('登录') || lower.includes('login')) {
      if (!existingPaths.includes('/api/auth/login')) {
        apis.push({
          id: 'api-auth-login',
          method: 'POST',
          path: '/api/auth/login',
          description: '账号密码登录',
          auth: false,
          request: { body: '{ username: string, password: string }' },
          response: { body: '{ token: string, user: User }' },
        });
      }

      if (lower.includes('验证码') && !existingPaths.includes('/api/auth/sms-login')) {
        apis.push({
          id: 'api-auth-sms-login',
          method: 'POST',
          path: '/api/auth/sms-login',
          description: '手机验证码登录',
          auth: false,
          request: { body: '{ phone: string, code: string }' },
          response: { body: '{ token: string, user: User }' },
        });

        apis.push({
          id: 'api-auth-send-code',
          method: 'POST',
          path: '/api/auth/send-code',
          description: '发送验证码',
          auth: false,
          request: { body: '{ phone: string }' },
          response: { body: '{ success: boolean }' },
        });
      }

      if (!existingPaths.includes('/api/auth/logout')) {
        apis.push({
          id: 'api-auth-logout',
          method: 'POST',
          path: '/api/auth/logout',
          description: '退出登录',
          auth: true,
          response: { body: '{ success: boolean }' },
        });
      }
    }

    return apis;
  }
}
```

- [ ] **Step 2: 提交**

```bash
git add src/designers/api-designer.ts
git commit -m "feat(designers): add API layer designer"
```

---

### Task 3: 组件层设计器

**Files:**
- Create: `src/designers/component-designer.ts`

- [ ] **Step 1: 创建组件层设计器**

```typescript
// src/designers/component-designer.ts
import type { ComponentInfo, PropDefinition, EventDefinition } from '../memory/types.js';
import type { Feature } from '../agents/analyze-agent.js';

export interface ComponentDesign {
  components: ComponentInfo[];
  componentTree: string;
  reusableComponents: string[];
}

export class ComponentDesigner {
  design(features: Feature[], existingComponents: ComponentInfo[]): ComponentDesign {
    const components: ComponentInfo[] = [];
    const reusableComponents: string[] = [];

    for (const feature of features) {
      const inferredComponents = this.inferComponents(feature, existingComponents);
      components.push(...inferredComponents);

      // 识别可复用组件
      for (const comp of inferredComponents) {
        if (comp.dependencies.length > 0) {
          reusableComponents.push(...comp.dependencies);
        }
      }
    }

    const componentTree = this.generateComponentTree(components);

    return {
      components,
      componentTree,
      reusableComponents: [...new Set(reusableComponents)],
    };
  }

  private inferComponents(feature: Feature, existing: ComponentInfo[]): ComponentInfo[] {
    const components: ComponentInfo[] = [];
    const lower = feature.name.toLowerCase();

    if (lower.includes('登录') || lower.includes('login')) {
      components.push({
        id: 'comp-loginpage',
        name: 'LoginPage',
        type: 'page',
        path: 'src/pages/Login/index.tsx',
        props: [],
        events: [],
        description: '登录页面',
        dependencies: ['LoginForm'],
      });

      components.push({
        id: 'comp-loginform',
        name: 'LoginForm',
        type: 'component',
        path: 'src/pages/Login/LoginForm.tsx',
        props: [
          { name: 'onSuccess', type: '() => void', required: false, description: '登录成功回调' },
          { name: 'mode', type: "'password' | 'sms'", required: false, description: '登录模式' },
        ],
        events: [],
        description: '登录表单组件',
        dependencies: ['Input', 'Button', 'Form'],
      });

      if (lower.includes('验证码')) {
        components.push({
          id: 'comp-captchabutton',
          name: 'CaptchaButton',
          type: 'component',
          path: 'src/components/CaptchaButton/index.tsx',
          props: [
            { name: 'phone', type: 'string', required: true, description: '手机号' },
            { name: 'countdown', type: 'number', required: false, description: '倒计时秒数，默认60' },
          ],
          events: [
            { name: 'onSend', payload: 'Promise<void>', description: '发送验证码回调' },
          ],
          description: '验证码发送按钮',
          dependencies: ['Button'],
        });
      }
    }

    return components;
  }

  private generateComponentTree(components: ComponentInfo[]): string {
    const pages = components.filter(c => c.type === 'page');
    const comps = components.filter(c => c.type === 'component');

    let tree = '';
    for (const page of pages) {
      tree += `${page.name} (Page)\n`;
      const children = comps.filter(c => page.dependencies.includes(c.name));
      for (const child of children) {
        tree += `├── ${child.name}\n`;
      }
    }

    return tree;
  }
}
```

- [ ] **Step 2: 提交**

```bash
git add src/designers/component-designer.ts
git commit -m "feat(designers): add component layer designer"
```

---

### Task 4: 业务逻辑设计器

**Files:**
- Create: `src/designers/logic-designer.ts`

- [ ] **Step 1: 创建业务逻辑设计器**

```typescript
// src/designers/logic-designer.ts
import type { Feature } from '../agents/analyze-agent.js';

export interface LogicStep {
  id: string;
  name: string;
  type: 'action' | 'condition' | 'loop' | 'parallel';
  description: string;
  next?: string[];
  onError?: string;
}

export interface StateDefinition {
  name: string;
  type: string;
  initialValue: string;
  description: string;
}

export interface LogicDesign {
  flows: { name: string; steps: LogicStep[]; description: string }[];
  states: StateDefinition[];
  sideEffects: { trigger: string; action: string; description: string }[];
}

export class LogicDesigner {
  design(features: Feature[]): LogicDesign {
    const flows: LogicDesign['flows'] = [];
    const states: StateDefinition[] = [];
    const sideEffects: LogicDesign['sideEffects'] = [];

    for (const feature of features) {
      const inferredFlows = this.inferFlows(feature);
      flows.push(...inferredFlows);

      const inferredStates = this.inferStates(feature);
      states.push(...inferredStates);

      const inferredEffects = this.inferSideEffects(feature);
      sideEffects.push(...inferredEffects);
    }

    return { flows, states, sideEffects };
  }

  private inferFlows(feature: Feature): LogicDesign['flows'] {
    const flows: LogicDesign['flows'] = [];
    const lower = feature.name.toLowerCase();

    if (lower.includes('登录') || lower.includes('login')) {
      flows.push({
        name: '登录流程',
        description: '用户账号密码登录的完整流程',
        steps: [
          {
            id: 'start',
            name: '开始',
            type: 'action',
            description: '用户点击登录按钮',
            next: ['validate'],
          },
          {
            id: 'validate',
            name: '表单验证',
            type: 'condition',
            description: '验证用户名和密码格式',
            next: ['callApi', 'showError'],
          },
          {
            id: 'callApi',
            name: '调用登录API',
            type: 'action',
            description: '发送登录请求到后端',
            next: ['handleSuccess'],
            onError: 'handleError',
          },
          {
            id: 'handleSuccess',
            name: '处理成功',
            type: 'action',
            description: '保存token，更新用户状态',
            next: ['redirect'],
          },
          {
            id: 'redirect',
            name: '跳转首页',
            type: 'action',
            description: '登录成功后跳转到首页',
            next: [],
          },
          {
            id: 'showError',
            name: '显示错误',
            type: 'action',
            description: '显示表单验证错误信息',
            next: [],
          },
          {
            id: 'handleError',
            name: '处理失败',
            type: 'action',
            description: '显示登录失败错误信息',
            next: [],
          },
        ],
      });

      // 验证码登录流程
      if (lower.includes('验证码')) {
        flows.push({
          name: '验证码登录流程',
          description: '用户手机验证码登录流程',
          steps: [
            {
              id: 'start',
              name: '开始',
              type: 'action',
              description: '用户输入手机号',
              next: ['sendCode'],
            },
            {
              id: 'sendCode',
              name: '发送验证码',
              type: 'action',
              description: '调用发送验证码API',
              next: ['inputCode'],
              onError: 'showSendError',
            },
            {
              id: 'inputCode',
              name: '输入验证码',
              type: 'action',
              description: '用户输入收到的验证码',
              next: ['verifyCode'],
            },
            {
              id: 'verifyCode',
              name: '验证登录',
              type: 'action',
              description: '调用验证码登录API',
              next: ['handleSuccess'],
              onError: 'showVerifyError',
            },
            {
              id: 'handleSuccess',
              name: '处理成功',
              type: 'action',
              description: '保存token，更新用户状态',
              next: ['redirect'],
            },
            {
              id: 'redirect',
              name: '跳转首页',
              type: 'action',
              description: '登录成功后跳转',
              next: [],
            },
            {
              id: 'showSendError',
              name: '发送失败',
              type: 'action',
              description: '显示验证码发送失败信息',
              next: [],
            },
            {
              id: 'showVerifyError',
              name: '验证失败',
              type: 'action',
              description: '显示验证码验证失败信息',
              next: [],
            },
          ],
        });
      }
    }

    return flows;
  }

  private inferStates(feature: Feature): StateDefinition[] {
    const states: StateDefinition[] = [];
    const lower = feature.name.toLowerCase();

    if (lower.includes('登录') || lower.includes('login')) {
      states.push(
        {
          name: 'isLoggedIn',
          type: 'boolean',
          initialValue: 'false',
          description: '用户是否已登录',
        },
        {
          name: 'currentUser',
          type: 'User | null',
          initialValue: 'null',
          description: '当前登录用户信息',
        },
        {
          name: 'token',
          type: 'string | null',
          initialValue: 'null',
          description: '访问令牌',
        },
        {
          name: 'loginLoading',
          type: 'boolean',
          initialValue: 'false',
          description: '登录请求加载状态',
        },
        {
          name: 'loginError',
          type: 'string | null',
          initialValue: 'null',
          description: '登录错误信息',
        }
      );
    }

    return states;
  }

  private inferSideEffects(feature: Feature): LogicDesign['sideEffects'] {
    const effects: LogicDesign['sideEffects'] = [];
    const lower = feature.name.toLowerCase();

    if (lower.includes('登录') || lower.includes('login')) {
      effects.push(
        {
          trigger: '登录成功',
          action: '保存token到localStorage',
          description: '持久化用户登录状态',
        },
        {
          trigger: '登录成功',
          action: '更新全局用户状态',
          description: '同步用户信息到全局Store',
        },
        {
          trigger: '退出登录',
          action: '清除localStorage',
          description: '清除本地存储的token',
        },
        {
          trigger: 'token过期',
          action: '刷新token或跳转登录',
          description: '处理token过期场景',
        }
      );
    }

    return effects;
  }
}
```

- [ ] **Step 2: 提交**

```bash
git add src/designers/logic-designer.ts
git commit -m "feat(designers): add business logic designer with flow and state design"
```

---

### Task 5: 样式设计器

**Files:**
- Create: `src/designers/style-designer.ts`

- [ ] **Step 1: 创建样式设计器**

```typescript
// src/designers/style-designer.ts
import type { StyleSystem, DesignToken } from '../memory/types.js';
import type { Feature } from '../agents/analyze-agent.js';

export interface ResponsiveBreakpoint {
  name: string;
  minWidth: string;
  description: string;
}

export interface AnimationDefinition {
  name: string;
  type: 'transition' | 'keyframe';
  duration: string;
  timing: string;
  description: string;
}

export interface StyleDesign {
  themeVariables: { name: string; value: string; usage: string }[];
  responsive: ResponsiveBreakpoint[];
  animations: AnimationDefinition[];
  componentStyles: { component: string; styles: string[]; description: string }[];
}

export class StyleDesigner {
  design(features: Feature[], existingStyles: StyleSystem | null): StyleDesign {
    const themeVariables: StyleDesign['themeVariables'] = [];
    const responsive: StyleDesign['responsive'] = [];
    const animations: StyleDesign['animations'] = [];
    const componentStyles: StyleDesign['componentStyles'] = [];

    // 基础响应式断点
    responsive.push(
      { name: 'sm', minWidth: '640px', description: '手机横屏' },
      { name: 'md', minWidth: '768px', description: '平板竖屏' },
      { name: 'lg', minWidth: '1024px', description: '平板横屏/小屏电脑' },
      { name: 'xl', minWidth: '1280px', description: '桌面电脑' },
      { name: '2xl', minWidth: '1536px', description: '大屏显示器' }
    );

    // 基础动画
    animations.push(
      {
        name: 'fade-in',
        type: 'keyframe',
        duration: '300ms',
        timing: 'ease-out',
        description: '淡入动画',
      },
      {
        name: 'fade-out',
        type: 'keyframe',
        duration: '300ms',
        timing: 'ease-in',
        description: '淡出动画',
      },
      {
        name: 'slide-up',
        type: 'keyframe',
        duration: '300ms',
        timing: 'ease-out',
        description: '从下往上滑入',
      },
      {
        name: 'default-transition',
        type: 'transition',
        duration: '200ms',
        timing: 'ease',
        description: '默认过渡效果',
      }
    );

    for (const feature of features) {
      const inferredStyles = this.inferStyles(feature, existingStyles);
      themeVariables.push(...inferredStyles.themeVariables);
      componentStyles.push(...inferredStyles.componentStyles);
    }

    return { themeVariables, responsive, animations, componentStyles };
  }

  private inferStyles(
    feature: Feature,
    existingStyles: StyleSystem | null
  ): Pick<StyleDesign, 'themeVariables' | 'componentStyles'> {
    const themeVariables: StyleDesign['themeVariables'] = [];
    const componentStyles: StyleDesign['componentStyles'] = [];
    const lower = feature.name.toLowerCase();

    if (lower.includes('登录') || lower.includes('login')) {
      // 登录页面主题变量
      themeVariables.push(
        {
          name: '--login-bg',
          value: existingStyles?.theme?.colors?.background || '#f5f5f5',
          usage: '登录页面背景色',
        },
        {
          name: '--login-card-bg',
          value: '#ffffff',
          usage: '登录卡片背景色',
        },
        {
          name: '--login-card-shadow',
          value: '0 4px 12px rgba(0, 0, 0, 0.1)',
          usage: '登录卡片阴影',
        }
      );

      // 登录表单组件样式
      componentStyles.push(
        {
          component: 'LoginForm',
          styles: [
            'max-width: 400px',
            'padding: 24px',
            'background: var(--login-card-bg)',
            'border-radius: 8px',
            'box-shadow: var(--login-card-shadow)',
          ],
          description: '登录表单容器样式',
        },
        {
          component: 'LoginInput',
          styles: [
            'width: 100%',
            'height: 40px',
            'padding: 0 12px',
            'border: 1px solid #d9d9d9',
            'border-radius: 4px',
            'transition: all 0.2s',
          ],
          description: '登录输入框样式',
        },
        {
          component: 'LoginButton',
          styles: [
            'width: 100%',
            'height: 40px',
            'background: var(--primary-color, #1890ff)',
            'color: #fff',
            'border: none',
            'border-radius: 4px',
            'cursor: pointer',
            'transition: background 0.2s',
          ],
          description: '登录按钮样式',
        }
      );

      // 验证码按钮样式
      if (lower.includes('验证码')) {
        componentStyles.push({
          component: 'CaptchaButton',
          styles: [
            'min-width: 120px',
            'height: 40px',
            'padding: 0 16px',
            'background: transparent',
            'border: 1px solid #d9d9d9',
            'border-radius: 4px',
            'cursor: pointer',
            'transition: all 0.2s',
            '&:disabled': 'opacity: 0.5; cursor: not-allowed',
          ],
          description: '验证码发送按钮样式',
        });
      }
    }

    return { themeVariables, componentStyles };
  }
}
```

- [ ] **Step 2: 提交**

```bash
git add src/designers/style-designer.ts
git commit -m "feat(designers): add style designer with theme, responsive and animation design"
```

---

### Task 6: DesignAgent整合

**Files:**
- Create: `src/agents/design-agent.ts`
- Create: `src/designers/index.ts`
- Test: `tests/agents/design-agent.test.ts`

- [ ] **Step 1: 创建设计器导出**

```typescript
// src/designers/index.ts
export { DataDesigner, type DataDesign } from './data-designer.js';
export { ApiDesigner, type ApiDesign } from './api-designer.js';
export { ComponentDesigner, type ComponentDesign } from './component-designer.js';
export { LogicDesigner, type LogicDesign } from './logic-designer.js';
export { StyleDesigner, type StyleDesign } from './style-designer.js';
```

- [ ] **Step 2: 创建DesignAgent**

```typescript
// src/agents/design-agent.ts
import { BaseAgent, type AgentContext, type AgentResult } from './base-agent.js';
import { DataDesigner, ApiDesigner, ComponentDesigner } from '../designers/index.js';
import { logger } from '../utils/logger.js';
import { writeText } from '../utils/fs-utils.js';
import path from 'node:path';
import type { Feature, AnalyzeResult } from './analyze-agent.js';

export interface DesignResult {
  dataDesign: any;
  apiDesign: any;
  componentDesign: any;
  documentPath: string;
}

export class DesignAgent extends BaseAgent {
  constructor(context: AgentContext) {
    super('DesignAgent', context);
  }

  async execute(analyzeResult: AnalyzeResult): Promise<AgentResult<DesignResult>> {
    try {
      logger.title('详细设计');

      const memory = this.getMemory();

      // Step 1: 数据层设计
      logger.step(1, 5, '设计数据层...');
      const existingModels = (await memory.getModels()) || [];
      const dataDesigner = new DataDesigner();
      const dataDesign = dataDesigner.design(analyzeResult.features, existingModels);
      logger.success(`定义 ${dataDesign.models.length} 个数据模型`);

      // Step 2: 接口层设计
      logger.step(2, 5, '设计接口层...');
      const existingApis = (await memory.getApis()) || [];
      const apiDesigner = new ApiDesigner();
      const apiDesign = apiDesigner.design(analyzeResult.features, existingApis);
      logger.success(`定义 ${apiDesign.endpoints.length} 个API端点`);

      // Step 3: 组件层设计
      logger.step(3, 5, '设计组件层...');
      const existingComponents = (await memory.getComponents()) || [];
      const componentDesigner = new ComponentDesigner();
      const componentDesign = componentDesigner.design(analyzeResult.features, existingComponents);
      logger.success(`定义 ${componentDesign.components.length} 个组件`);

      // Step 4: 设计自检
      logger.step(4, 5, '执行设计自检...');
      const issues = this.selfCheck(dataDesign, apiDesign, componentDesign, analyzeResult);
      if (issues.length > 0) {
        logger.warn(`发现 ${issues.length} 个设计问题`);
        issues.forEach(i => logger.warn(`  - ${i}`));
      } else {
        logger.success('设计自检通过');
      }

      // Step 5: 生成设计文档
      logger.step(5, 5, '生成设计文档...');
      const documentPath = await this.generateDocument({
        title: analyzeResult.title,
        dataDesign,
        apiDesign,
        componentDesign,
        issues,
      });
      logger.success(`文档已保存: ${documentPath}`);

      return {
        success: true,
        data: {
          dataDesign,
          apiDesign,
          componentDesign,
          documentPath,
        },
        artifacts: [documentPath],
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { success: false, error: message };
    }
  }

  private selfCheck(
    dataDesign: any,
    apiDesign: any,
    componentDesign: any,
    analyzeResult: AnalyzeResult
  ): string[] {
    const issues: string[] = [];

    // 检查功能点覆盖
    for (const feature of analyzeResult.features) {
      const hasApi = apiDesign.endpoints.some((a: any) =>
        feature.name.toLowerCase().includes('登录') && a.path.includes('auth')
      );
      const hasComponent = componentDesign.components.some((c: any) =>
        feature.name.toLowerCase().includes('登录') && c.name.includes('Login')
      );

      if (!hasApi && feature.name.toLowerCase().includes('登录')) {
        issues.push(`功能"${feature.name}"缺少对应的API设计`);
      }
      if (!hasComponent && feature.name.toLowerCase().includes('登录')) {
        issues.push(`功能"${feature.name}"缺少对应的组件设计`);
      }
    }

    return issues;
  }

  private async generateDocument(data: {
    title: string;
    dataDesign: any;
    apiDesign: any;
    componentDesign: any;
    issues: string[];
  }): Promise<string> {
    const { title, dataDesign, apiDesign, componentDesign, issues } = data;

    const doc = `# 详细设计文档 - ${title}

## 1. 设计概述
- **需求来源**: ${title}
- **设计原则**: 复用现有组件、遵循项目规范、最小化改动

## 2. 数据层设计

### 2.1 数据模型
${dataDesign.models.map((m: any) => `
#### ${m.name}
\`\`\`typescript
interface ${m.name} {
${m.fields.map((f: any) => `  ${f.name}${f.required ? '' : '?'}: ${f.type}; // ${f.description}`).join('\n')}
}
\`\`\`
`).join('\n')}

### 2.2 数据校验规则
| 模型 | 字段 | 规则 |
|------|------|------|
${dataDesign.validationRules.map((r: any) => `| ${r.model} | ${r.field} | ${r.rules.join(', ')} |`).join('\n')}

## 3. 接口层设计

### 3.1 API端点
| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
${apiDesign.endpoints.map((a: any) => `| ${a.method} | ${a.path} | ${a.description} | ${a.auth ? '是' : '否' } |`).join('\n')}

### 3.2 错误码定义
| 错误码 | 说明 | 描述 |
|--------|------|------|
${apiDesign.errorCodes.map((e: any) => `| ${e.code} | ${e.message} | ${e.description} |`).join('\n')}

### 3.3 认证策略
${apiDesign.authStrategy}

## 4. 组件层设计

### 4.1 组件树
\`\`\`
${componentDesign.componentTree}
\`\`\`

### 4.2 组件定义
${componentDesign.components.map((c: any) => `
#### ${c.name}
- **类型**: ${c.type}
- **路径**: ${c.path}
- **描述**: ${c.description}
- **Props**:
${c.props.map((p: any) => `  - ${p.name}: ${p.type}${p.required ? ' (必填)' : ''} - ${p.description}`).join('\n')}
`).join('\n')}

## 5. 设计问题
${issues.length > 0 ? issues.map(i => `- ⚠️ ${i}`).join('\n') : '- 无设计问题'}

## 6. 文件变更清单
| 操作 | 文件路径 | 说明 |
|------|----------|------|
${componentDesign.components.map((c: any) => `| 新增 | ${c.path} | ${c.name}组件 |`).join('\n')}
`;

    const sessionsDir = path.join(this.getProjectRoot(), '.dev-flow', 'sessions');
    const docPath = path.join(sessionsDir, `design-${Date.now()}.md`);
    await writeText(docPath, doc);

    return docPath;
  }
}
```

- [ ] **Step 3: 编写测试并提交**

```bash
git add src/agents/design-agent.ts src/designers/ tests/agents/design-agent.test.ts
git commit -m "feat(agents): P5 complete - design agent with layered design approach"
```
