// src/analyzers/context-linker.ts
import type { MemoryManager } from '../memory/index.js';
import type { ComponentInfo, ApiEndpoint, DataModel } from '../memory/types.js';

export interface ContextLink {
  type: 'component' | 'api' | 'model' | 'util';
  name: string;
  path: string;
  relation: 'reuse' | 'modify' | 'depend' | 'conflict';
  description: string;
}

export interface ContextLinkResult {
  links: ContextLink[];
  relatedComponents: ComponentInfo[];
  relatedApis: ApiEndpoint[];
  relatedModels: DataModel[];
  suggestions: string[];
}

export class ContextLinker {
  private memory: MemoryManager;

  constructor(memory: MemoryManager) {
    this.memory = memory;
  }

  async link(requirement: string): Promise<ContextLinkResult> {
    const links: ContextLink[] = [];
    const suggestions: string[] = [];

    // 从记忆中检索相关组件
    const relatedComponents = await this.findRelatedComponents(requirement);
    for (const comp of relatedComponents) {
      links.push({
        type: 'component',
        name: comp.name,
        path: comp.path,
        relation: 'reuse',
        description: comp.description,
      });
    }

    // 从记忆中检索相关API
    const relatedApis = await this.findRelatedApis(requirement);
    for (const api of relatedApis) {
      links.push({
        type: 'api',
        name: api.path,
        path: api.path,
        relation: 'depend',
        description: api.description,
      });
    }

    // 从记忆中检索相关模型
    const relatedModels = await this.findRelatedModels(requirement);
    for (const model of relatedModels) {
      links.push({
        type: 'model',
        name: model.name,
        path: model.name,
        relation: 'depend',
        description: model.description,
      });
    }

    // 生成建议
    if (relatedComponents.length > 0) {
      suggestions.push(`可复用现有组件: ${relatedComponents.map(c => c.name).join(', ')}`);
    }
    if (relatedApis.length > 0) {
      suggestions.push(`需要对接现有API: ${relatedApis.map(a => a.path).join(', ')}`);
    }

    return {
      links,
      relatedComponents,
      relatedApis,
      relatedModels,
      suggestions,
    };
  }

  private async findRelatedComponents(requirement: string): Promise<ComponentInfo[]> {
    const components = await this.memory.getComponents();
    if (!components) return [];

    // 关键词匹配
    const keywords = this.extractKeywords(requirement);
    return components.filter(comp => {
      const text = `${comp.name} ${comp.description}`.toLowerCase();
      return keywords.some(kw => text.includes(kw.toLowerCase()));
    }).slice(0, 10);
  }

  private async findRelatedApis(requirement: string): Promise<ApiEndpoint[]> {
    const apis = await this.memory.getApis();
    if (!apis) return [];

    const keywords = this.extractKeywords(requirement);
    return apis.filter(api => {
      const text = `${api.path} ${api.description}`.toLowerCase();
      return keywords.some(kw => text.includes(kw.toLowerCase()));
    }).slice(0, 10);
  }

  private async findRelatedModels(requirement: string): Promise<DataModel[]> {
    const models = await this.memory.getModels();
    if (!models) return [];

    const keywords = this.extractKeywords(requirement);
    return models.filter(model => {
      const text = `${model.name} ${model.description}`.toLowerCase();
      return keywords.some(kw => text.includes(kw.toLowerCase()));
    }).slice(0, 10);
  }

  private extractKeywords(text: string): string[] {
    // 简单的关键词提取
    const stopWords = new Set(['的', '是', '在', '和', '了', '有', '我', '你', '他', 'the', 'a', 'an', 'is', 'are', 'was', 'were']);

    return text
      .split(/[\s,，。.!！?？;；:：""''「」【】()（）\[\]{}]+/)
      .filter(word => word.length >= 2 && !stopWords.has(word.toLowerCase()));
  }
}
