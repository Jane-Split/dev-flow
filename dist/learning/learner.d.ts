import { type ExtractionContext } from './pattern-extractor.js';
import { type FeedbackInput } from './feedback-collector.js';
import type { MemoryManager } from '../memory/index.js';
import type { LearnedPattern } from '../memory/types.js';
export declare class Learner {
    private memory;
    private patternExtractor;
    private feedbackCollector;
    constructor(memory: MemoryManager);
    learn(context: ExtractionContext): Promise<LearnedPattern[]>;
    collectFeedback(input: FeedbackInput): void;
    applyLearnedPatterns(context: string): Promise<LearnedPattern[]>;
    private updateConfidence;
    getLearningStats(): {
        totalPatterns: number;
        avgConfidence: number;
        topPatterns: LearnedPattern[];
    };
}
//# sourceMappingURL=learner.d.ts.map