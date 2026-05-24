import type { MemoryManager } from '../memory/index.js';
export interface WorkerContext {
    projectRoot: string;
    memory: MemoryManager;
    sessionId: string;
}
export declare abstract class BaseWorker {
    protected context: WorkerContext;
    protected name: string;
    constructor(name: string, context: WorkerContext);
    protected log(message: string): void;
    protected getMemory(): MemoryManager;
    protected getProjectRoot(): string;
}
//# sourceMappingURL=base-worker.d.ts.map