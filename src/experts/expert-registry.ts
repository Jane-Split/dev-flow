import type { Task } from '../planner/task-splitter.js';
import type { BaseExpert, ExpertContext, ExpertResult } from './base-expert.js';
import { FrontendExpert } from './frontend-expert.js';
import { BackendExpert } from './backend-expert.js';
import { DBExpert } from './db-expert.js';
import { TestExpert } from './test-expert.js';
import { AlgorithmExpert } from './algorithm-expert.js';
import { LegacyExpert } from './legacy-expert.js';
import { JavaExpert } from './java-expert.js';
import { PythonExpert } from './python-expert.js';

export class ExpertRegistry {
  private experts: BaseExpert[] = [];
  private context: ExpertContext;

  constructor(context: ExpertContext) {
    this.context = context;
    this.registerDefaultExperts();
  }

  private registerDefaultExperts(): void {
    this.experts.push(new FrontendExpert(this.context));
    this.experts.push(new BackendExpert(this.context));
    this.experts.push(new DBExpert(this.context));
    this.experts.push(new TestExpert(this.context));
    this.experts.push(new AlgorithmExpert(this.context));
    this.experts.push(new LegacyExpert(this.context));
    this.experts.push(new JavaExpert(this.context));
    this.experts.push(new PythonExpert(this.context));
  }

  register(expert: BaseExpert): void {
    this.experts.push(expert);
  }

  getExpert(task: Task): BaseExpert | null {
    // 首先检查任务指定的专家
    const specifiedExpert = this.experts.find(e => e.constructor.name === task.expert);
    if (specifiedExpert && specifiedExpert.canHandle(task)) {
      return specifiedExpert;
    }

    // 然后按优先级查找
    for (const expert of this.experts) {
      if (expert.canHandle(task)) {
        return expert;
      }
    }

    return null;
  }

  async executeTask(task: Task): Promise<ExpertResult> {
    const expert = this.getExpert(task);
    if (!expert) {
      return {
        success: false,
        files: [],
        changes: [],
        verification: { passed: false, message: `未找到适合任务 ${task.name} 的专家` },
      };
    }

    this.log(`分配任务 ${task.id} 给 ${expert.constructor.name}`);
    return expert.execute(task);
  }

  private log(message: string): void {
    console.log(`[ExpertRegistry] ${message}`);
  }
}
