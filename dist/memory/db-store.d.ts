import type { VectorEntry, SearchResult } from './types.js';
export declare class DbStore {
    private db;
    private dbPath;
    constructor(projectRoot: string);
    private openOrCreate;
    private save;
    private initialize;
    insertVector(entry: VectorEntry): void;
    getVector(id: string): VectorEntry | null;
    searchVectors(queryEmbedding: number[], limit?: number): SearchResult[];
    private cosineSimilarity;
    deleteVector(id: string): void;
    insertFeedback(feedback: {
        id: string;
        timestamp: string;
        stage: string;
        task: string;
        userAction: string;
        originalOutput?: string;
        userCorrection?: string;
        learned?: string;
    }): void;
    getFeedback(limit?: number): any[];
    createSession(id: string, metadata?: Record<string, unknown>): void;
    updateSessionStatus(id: string, status: string): void;
    close(): void;
}
//# sourceMappingURL=db-store.d.ts.map