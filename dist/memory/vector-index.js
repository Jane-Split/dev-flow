/**
 * 简单的本地嵌入提供者
 * 实际使用时可以替换为 OpenAI、Cohere 等API
 */
export class LocalEmbeddingProvider {
    dimension;
    constructor(dimension = 384) {
        this.dimension = dimension;
    }
    async embed(text) {
        // 简化版：基于文本特征生成伪嵌入
        // 实际项目中应使用真实的嵌入模型
        const embedding = [];
        // 使用简单的哈希特征
        const words = text.toLowerCase().split(/\s+/);
        const wordSet = new Set(words);
        for (let i = 0; i < this.dimension; i++) {
            let sum = 0;
            for (const word of Array.from(wordSet)) {
                sum += this.simpleHash(word + i) / 2147483647;
            }
            embedding.push(sum / wordSet.size);
        }
        // 归一化
        const norm = Math.sqrt(embedding.reduce((a, b) => a + b * b, 0));
        return embedding.map(v => v / norm);
    }
    simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash);
    }
}
export class VectorIndex {
    dbStore;
    embeddingProvider;
    constructor(dbStore, embeddingProvider) {
        this.dbStore = dbStore;
        this.embeddingProvider = embeddingProvider || new LocalEmbeddingProvider();
    }
    async index(id, content, metadata) {
        const embedding = await this.embeddingProvider.embed(content);
        const entry = {
            id,
            content,
            embedding,
            metadata,
        };
        this.dbStore.insertVector(entry);
    }
    async search(query, limit = 10, filter) {
        const queryEmbedding = await this.embeddingProvider.embed(query);
        const results = this.dbStore.searchVectors(queryEmbedding, limit * 2);
        // 应用过滤器
        let filtered = results;
        if (filter?.type) {
            filtered = results.filter(r => r.entry.metadata.type === filter.type);
        }
        return filtered.slice(0, limit);
    }
    delete(id) {
        this.dbStore.deleteVector(id);
    }
    get(id) {
        return this.dbStore.getVector(id);
    }
}
//# sourceMappingURL=vector-index.js.map