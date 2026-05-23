import type { LearnedPattern } from '../memory/types.js';
import type { Task } from '../planner/task-splitter.js';
export interface TestResult {
    name: string;
    passed: boolean;
    error?: string;
    duration: number;
}
export interface ExtractionContext {
    tasks: Task[];
    codeChanges: {
        file: string;
        content: string;
    }[];
    testResults: TestResult[];
    userFeedback?: {
        action: string;
        correction?: string;
    }[];
}
export declare class PatternExtractor {
    extract(context: ExtractionContext): LearnedPattern[];
    private extractCodePatterns;
    private extractFlowPatterns;
    private extractProblemPatterns;
}
//# sourceMappingURL=pattern-extractor.d.ts.map