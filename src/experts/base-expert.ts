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
  changes: { file: string; operation: 'create' | 'modify'; description: string }[];
  verification: { passed: boolean; message: string };
  suggestions?: string[];
}

export abstract class BaseExpert {
  protected name: string;
  protected context: ExpertContext;

  constructor(name: string, context: ExpertContext) {
    this.name = name;
    this.context = context;
  }

  abstract canHandle(task: Task): boolean;
  abstract execute(task: Task): Promise<ExpertResult>;

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
