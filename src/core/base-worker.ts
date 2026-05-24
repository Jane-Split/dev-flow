// src/core/base-worker.ts - 共享基类
// BaseAgent 和 BaseExpert 的公共逻辑抽取

import type { MemoryManager } from '../memory/index.js';

export interface WorkerContext {
  projectRoot: string;
  memory: MemoryManager;
  sessionId: string;
}

export abstract class BaseWorker {
  protected context: WorkerContext;
  protected name: string;

  constructor(name: string, context: WorkerContext) {
    this.name = name;
    this.context = context;
  }

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
