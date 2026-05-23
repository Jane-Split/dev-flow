import type { FeedbackRecord } from '../memory/types.js';
import type { MemoryManager } from '../memory/index.js';
export interface FeedbackInput {
    stage: string;
    task: string;
    userAction: 'confirmed' | 'modified' | 'rejected';
    originalOutput?: string;
    userCorrection?: string;
}
export declare class FeedbackCollector {
    private memory;
    constructor(memory: MemoryManager);
    collect(input: FeedbackInput): FeedbackRecord;
    private extractLearning;
    private compareOutputs;
    getRecentFeedback(limit?: number): FeedbackRecord[];
    analyzePatterns(): {
        stage: string;
        modificationRate: number;
    }[];
}
//# sourceMappingURL=feedback-collector.d.ts.map