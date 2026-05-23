import type { VectorEntry, SearchResult } from './types.js';
import { DbStore } from './db-store.js';
export interface EmbeddingProvider {
    embed(text: string): Promise<number[]>;
}
/**
 * 简单的本地嵌入提供者
 * 实际使用时可以替换为 OpenAI、Cohere 等API
 */
export declare class LocalEmbeddingProvider implements EmbeddingProvider {
    private dimension;
    constructor(dimension?: number);
    embed(text: string): Promise<number[]>;
    private simpleHash;
}
export declare class VectorIndex {
    private dbStore;
    private embeddingProvider;
    constructor(dbStore: DbStore, embeddingProvider?: EmbeddingProvider);
    index(id: string, content: string, metadata: VectorEntry['metadata']): Promise<void>;
    search(query: string, limit?: number, filter?: {
        type?: string;
    }): Promise<SearchResult[]>;
    delete(id: string): void;
    get(id: string): VectorEntry | null;
}
//# sourceMappingURL=vector-index.d.ts.map