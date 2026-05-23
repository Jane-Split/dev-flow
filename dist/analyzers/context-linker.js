export class ContextLinker {
    memory;
    constructor(memory) {
        this.memory = memory;
    }
    async link(requirement) {
        const links = [];
        const suggestions = [];
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
    async findRelatedComponents(requirement) {
        const components = await this.memory.getComponents();
        if (!components)
            return [];
        // 关键词匹配
        const keywords = this.extractKeywords(requirement);
        return components.filter(comp => {
            const text = `${comp.name} ${comp.description}`.toLowerCase();
            return keywords.some(kw => text.includes(kw.toLowerCase()));
        }).slice(0, 10);
    }
    async findRelatedApis(requirement) {
        const apis = await this.memory.getApis();
        if (!apis)
            return [];
        const keywords = this.extractKeywords(requirement);
        return apis.filter(api => {
            const text = `${api.path} ${api.description}`.toLowerCase();
            return keywords.some(kw => text.includes(kw.toLowerCase()));
        }).slice(0, 10);
    }
    async findRelatedModels(requirement) {
        const models = await this.memory.getModels();
        if (!models)
            return [];
        const keywords = this.extractKeywords(requirement);
        return models.filter(model => {
            const text = `${model.name} ${model.description}`.toLowerCase();
            return keywords.some(kw => text.includes(kw.toLowerCase()));
        }).slice(0, 10);
    }
    extractKeywords(text) {
        // 简单的关键词提取
        const stopWords = new Set(['的', '是', '在', '和', '了', '有', '我', '你', '他', 'the', 'a', 'an', 'is', 'are', 'was', 'were']);
        return text
            .split(/[\s,，。.!！?？;；:：""''「」【】()（）\[\]{}]+/)
            .filter(word => word.length >= 2 && !stopWords.has(word.toLowerCase()));
    }
}
//# sourceMappingURL=context-linker.js.map