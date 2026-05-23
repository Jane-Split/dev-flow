// src/analyzers/impact-analyzer.ts
import type { ContextLink } from './context-linker.js';

export interface ImpactItem {
  type: 'file' | 'api' | 'model' | 'config' | 'database';
  path: string;
  operation: 'create' | 'modify' | 'delete';
  description: string;
  risk?: 'low' | 'medium' | 'high';
}

export interface ImpactResult {
  items: ImpactItem[];
  risks: string[];
  dependencies: string[];
}

export class ImpactAnalyzer {
  analyze(requirement: string, contextLinks: ContextLink[]): ImpactResult {
    const items: ImpactItem[] = [];
    const risks: string[] = [];
    const dependencies: string[] = [];

    // 分析上下文链接
    for (const link of contextLinks) {
      if (link.relation === 'modify') {
        items.push({
          type: link.type as any,
          path: link.path,
          operation: 'modify',
          description: `修改现有${link.type}: ${link.name}`,
          risk: 'medium',
        });
        risks.push(`修改${link.type} ${link.name} 可能影响现有功能`);
      } else if (link.relation === 'depend') {
        dependencies.push(link.name);
      }
    }

    // 根据需求关键词推断影响
    const lower = requirement.toLowerCase();

    if (lower.includes('登录') || lower.includes('login')) {
      items.push(
        { type: 'file', path: 'src/pages/Login/', operation: 'create', description: '登录页面' },
        { type: 'api', path: '/api/auth/login', operation: 'create', description: '登录接口' },
        { type: 'model', path: 'User', operation: 'modify', description: '用户模型扩展' },
      );
    }

    if (lower.includes('用户') || lower.includes('user')) {
      items.push(
        { type: 'model', path: 'User', operation: 'modify', description: '用户相关模型' },
      );
    }

    if (lower.includes('数据库') || lower.includes('database') || lower.includes('表')) {
      items.push(
        { type: 'database', path: 'migration', operation: 'create', description: '数据库迁移' },
      );
      risks.push('数据库变更需要谨慎处理，建议做好备份');
    }

    return { items, risks, dependencies };
  }
}
