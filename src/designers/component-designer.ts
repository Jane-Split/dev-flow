// src/designers/component-designer.ts
import type { ComponentInfo, PropDefinition, EventDefinition } from '../memory/types.js';

export interface Feature {
  id: string;
  name: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
}

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
