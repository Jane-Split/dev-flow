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

export abstract class BaseAgent {
  protected context: AgentContext;
  protected name: string;

  constructor(name: string, context: AgentContext) {
    this.name = name;
    this.context = context;
  }

  abstract execute(...args: unknown[]): Promise<AgentResult>;

  protected log(message: string): void {
    console.log(`[${this.name}] ${message}`);
  }

  protected getMemory(): MemoryManager {
    return this.context.memory;
  }

  protected getProjectRoot(): string {
    return this.context.projectRoot;
  }
}
