// src/designers/logic-designer.ts

export interface Feature {
  id: string;
  name: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
}

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
