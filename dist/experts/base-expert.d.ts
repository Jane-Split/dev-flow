import type { Task } from '../planner/task-splitter.js';
import type { MemoryManager } from '../memory/index.js';
export interface ExpertContext {
    projectRoot: string;
    memory: MemoryManager;
    sessionId: string;
}
export interface ExpertResult {
    success: boolean;
    files: string[];
    changes: {
        file: string;
        operation: 'create' | 'modify';
        description: string;
    }[];
    verification: {
        passed: boolean;
        message: string;
    };
    suggestions?: string[];
}
export declare abstract class BaseExpert {
    protected name: string;
    protected context: ExpertContext;
    constructor(name: string, context: ExpertContext);
    abstract canHandle(task: Task): boolean;
    abstract execute(task: Task): Promise<ExpertResult>;
    protected log(message: string): void;
    protected getMemory(): MemoryManager;
    protected getProjectRoot(): string;
}
//# sourceMappingURL=base-expert.d.ts.map