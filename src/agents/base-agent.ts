import type { MemoryManager } from '../memory/index.js';
import { BaseWorker, type WorkerContext } from '../core/base-worker.js';

export type { WorkerContext };

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

export abstract class BaseAgent extends BaseWorker {
  constructor(name: string, context: AgentContext) {
    super(name, context);
  }

  abstract execute(...args: unknown[]): Promise<AgentResult>;
}
