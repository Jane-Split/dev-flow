import type { MemoryManager } from '../memory/index.js';
export interface AgentContext {
    projectRoot: string;
    memory: MemoryManager;
    sessionId: string;
}
export interface AgentResult<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
    artifacts?: string[];
}
export declare abstract class BaseAgent {
    protected context: AgentContext;
    protected name: string;
    constructor(name: string, context: AgentContext);
    abstract execute(...args: unknown[]): Promise<AgentResult>;
    protected log(message: string): void;
    protected getMemory(): MemoryManager;
    protected getProjectRoot(): string;
}
//# sourceMappingURL=base-agent.d.ts.map