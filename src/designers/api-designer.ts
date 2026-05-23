// src/designers/api-designer.ts
import type { ApiEndpoint } from '../memory/types.js';

export interface Feature {
  id: string;
  name: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
}

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
