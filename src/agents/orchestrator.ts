// src/agents/orchestrator.ts - 完整版（含新功能集成）
import type { MemoryManager } from '../memory/index.js';
import { ResearchAgent } from './research-agent.js';
import { AnalyzeAgent } from './analyze-agent.js';
import { DesignAgent } from './design-agent.js';
import { PlanAgent } from './plan-agent.js';
import { DevelopAgent } from './develop-agent.js';
import { TestAgent } from './test-agent.js';
import { FixAgent } from './fix-agent.js';
import { HotfixAgent } from './hotfix-agent.js';
import { ArchitectureAgent } from './architecture-agent.js';
import { SessionManager } from '../session/index.js';
import { ProgressReporter } from '../utils/progress-reporter.js';
import { logger } from '../utils/logger.js';
import type { AgentContext } from './base-agent.js';

export interface OrchestratorContext {
  projectRoot: string;
  memory: MemoryManager;
  sessionId: string;
}

export interface ExecutionOptions {
  stage?: 'research' | 'architecture' | 'analyze' | 'design' | 'plan' | 'develop' | 'test' | 'fix' | 'hotfix';
  requirement?: string;
  refresh?: boolean;
  resume?: boolean;
  onStageComplete?: (stage: string, result: any) => Promise<boolean>;
}

export class Orchestrator {
  private context: OrchestratorContext;
  private results: Map<string, any> = new Map();
  private sessionManager: SessionManager;
  private reporter: ProgressReporter | null = null;

  constructor(context: OrchestratorContext) {
    this.context = context;
    this.sessionManager = new SessionManager(context.projectRoot);
  }

  async execute(options: ExecutionOptions): Promise<void> {
    const { stage, requirement, refresh, resume, onStageComplete } = options;

    // 断点续传检查
    if (resume && !stage && requirement) {
      const existingSession = await this.sessionManager.getLatest();
      if (existingSession) {
        logger.info(`发现未完成的会话: ${existingSession.id}`);
        logger.info(`需求: ${existingSession.requirement}`);
        logger.info(`已完成阶段: ${existingSession.completedStages.join(', ')}`);
        logger.info(`当前阶段: ${existingSession.currentStage}`);
        await this.resumeSession(existingSession, onStageComplete);
        return;
      }
    }

    if (stage) {
      await this.executeStage(stage, requirement, refresh, onStageComplete);
    } else if (requirement) {
      await this.executeFullFlow(requirement, onStageComplete);
    } else {
      logger.error('请提供需求描述或指定阶段');
    }
  }

  private async resumeSession(
    session: any,
    onStageComplete?: (stage: string, result: any) => Promise<boolean>
  ): Promise<void> {
    // 恢复已完成的阶段结果
    for (const [stage, result] of Object.entries(session.stageResults)) {
      this.results.set(stage, result);
    }

    // 从下一个阶段继续执行
    const stages = ['research', 'architecture', 'analyze', 'design', 'plan', 'develop', 'test', 'fix'];
    const nextStageIndex = stages.indexOf(session.currentStage) + 1;

    if (nextStageIndex >= stages.length) {
      logger.success('所有阶段已完成');
      return;
    }

    logger.info(`从阶段 ${stages[nextStageIndex]} 继续执行...`);

    // 初始化进度报告
    this.reporter = new ProgressReporter(session.id, session.requirement);
    for (const completed of session.completedStages) {
      this.reporter.updateStage(completed, 'completed');
    }

    for (let i = nextStageIndex; i < stages.length; i++) {
      const stage = stages[i];
      this.reporter.updateStage(stage, 'running');

      await this.executeStage(stage, session.requirement, false, onStageComplete);

      const result = this.results.get(stage);
      if (result?.success) {
        this.reporter.updateStage(stage, 'completed');
        await this.sessionManager.saveStageResult(session.id, stage, result);
      } else {
        this.reporter.updateStage(stage, 'failed');
        break;
      }
    }

    await this.reporter.save(this.context.projectRoot);
    await this.sessionManager.complete(session.id);
    logger.success('会话已恢复并完成');
  }

  private async executeStage(
    stage: string,
    requirement?: string,
    refresh?: boolean,
    onStageComplete?: (stage: string, result: any) => Promise<boolean>
  ): Promise<void> {
    const agentContext: AgentContext = {
      projectRoot: this.context.projectRoot,
      memory: this.context.memory,
      sessionId: this.context.sessionId,
    };

    switch (stage) {
      case 'research': {
        const agent = new ResearchAgent(agentContext);
        const result = await agent.execute();
        this.results.set('research', result);
        await onStageComplete?.('research', result);
        break;
      }
      case 'architecture': {
        if (!requirement) {
          logger.error('architecture阶段需要提供需求描述');
          return;
        }
        const agent = new ArchitectureAgent(agentContext);
        const result = await agent.execute(requirement);
        this.results.set('architecture', result);
        await onStageComplete?.('architecture', result);
        break;
      }
      case 'analyze': {
        if (!requirement) {
          logger.error('analyze阶段需要提供需求描述');
          return;
        }
        const agent = new AnalyzeAgent(agentContext);
        const result = await agent.execute(requirement);
        this.results.set('analyze', result);
        await onStageComplete?.('analyze', result);
        break;
      }
      case 'design': {
        const analyzeResult = this.results.get('analyze');
        if (!analyzeResult?.success) {
          logger.error('design阶段需要先执行analyze');
          return;
        }
        const agent = new DesignAgent(agentContext);
        const result = await agent.execute(analyzeResult.data);
        this.results.set('design', result);
        await onStageComplete?.('design', result);
        break;
      }
      case 'plan': {
        const designResult = this.results.get('design');
        if (!designResult?.success) {
          logger.error('plan阶段需要先执行design');
          return;
        }
        const agent = new PlanAgent(agentContext);
        const result = await agent.execute(designResult.data);
        this.results.set('plan', result);
        await onStageComplete?.('plan', result);
        break;
      }
      case 'develop': {
        const planResult = this.results.get('plan');
        if (!planResult?.success) {
          logger.error('develop阶段需要先执行plan');
          return;
        }
        const agent = new DevelopAgent(agentContext);
        agent.setPlan(planResult.data);
        const result = await agent.execute();
        this.results.set('develop', result);
        await onStageComplete?.('develop', result);
        break;
      }
      case 'test': {
        const developResult = this.results.get('develop');
        if (!developResult?.success) {
          logger.error('test阶段需要先执行develop');
          return;
        }
        const agent = new TestAgent(agentContext);
        const testResult = await agent.execute(developResult.data);
        this.results.set('test', testResult);
        await onStageComplete?.('test', testResult);
        break;
      }
      case 'fix': {
        const testResult = this.results.get('test');
        if (!testResult?.success) {
          logger.error('fix阶段需要先执行test');
          return;
        }
        const agent = new FixAgent(agentContext);
        const result = await agent.execute(testResult.data);
        this.results.set('fix', result);
        await onStageComplete?.('fix', result);
        break;
      }
      case 'hotfix': {
        if (!requirement) {
          logger.error('hotfix模式需要提供错误描述');
          return;
        }
        const agent = new HotfixAgent(agentContext);
        const result = await agent.execute(requirement);
        this.results.set('hotfix', result);
        await onStageComplete?.('hotfix', result);
        break;
      }
      default:
        logger.error(`未知阶段: ${stage}`);
    }
  }

  private async executeFullFlow(
    requirement: string,
    onStageComplete?: (stage: string, result: any) => Promise<boolean>
  ): Promise<void> {
    const agentContext: AgentContext = {
      projectRoot: this.context.projectRoot,
      memory: this.context.memory,
      sessionId: this.context.sessionId,
    };

    // 创建会话和进度报告
    const session = await this.sessionManager.create(requirement);
    this.reporter = new ProgressReporter(session.id, requirement);

    // Stage 1: Research
    logger.title('Stage 1/7: 项目调研');
    this.reporter.updateStage('research', 'running');
    const researchAgent = new ResearchAgent(agentContext);
    const researchResult = await researchAgent.execute();
    this.results.set('research', researchResult);
    this.reporter.updateStage('research', 'completed');
    await this.sessionManager.saveStageResult(session.id, 'research', researchResult);
    if (!(await this.confirmStage('research', researchResult, onStageComplete))) return;

    // Stage 2: Analyze
    logger.title('Stage 2/7: 需求分析');
    this.reporter.updateStage('analyze', 'running');
    const analyzeAgent = new AnalyzeAgent(agentContext);
    const analyzeResult = await analyzeAgent.execute(requirement);
    this.results.set('analyze', analyzeResult);
    this.reporter.updateStage('analyze', 'completed');
    await this.sessionManager.saveStageResult(session.id, 'analyze', analyzeResult);
    if (!(await this.confirmStage('analyze', analyzeResult, onStageComplete))) return;

    // Stage 3: Design
    logger.title('Stage 3/7: 详细设计');
    this.reporter.updateStage('design', 'running');
    const designAgent = new DesignAgent(agentContext);
    const designResult = await designAgent.execute(analyzeResult.data!);
    this.results.set('design', designResult);
    this.reporter.updateStage('design', 'completed');
    await this.sessionManager.saveStageResult(session.id, 'design', designResult);
    if (!(await this.confirmStage('design', designResult, onStageComplete))) return;

    // Stage 4: Plan
    logger.title('Stage 4/7: 任务拆分');
    this.reporter.updateStage('plan', 'running');
    const planAgent = new PlanAgent(agentContext);
    const planResult = await planAgent.execute(designResult.data!);
    this.results.set('plan', planResult);
    this.reporter.updateStage('plan', 'completed');
    await this.sessionManager.saveStageResult(session.id, 'plan', planResult);
    if (!(await this.confirmStage('plan', planResult, onStageComplete))) return;

    // Stage 5: Develop
    logger.title('Stage 5/7: 开发执行');
    this.reporter.updateStage('develop', 'running');
    const developAgent = new DevelopAgent(agentContext);
    developAgent.setPlan(planResult.data!);
    const developResult = await developAgent.execute();
    this.results.set('develop', developResult);
    this.reporter.updateStage('develop', 'completed');
    await this.sessionManager.saveStageResult(session.id, 'develop', developResult);
    if (!(await this.confirmStage('develop', developResult, onStageComplete))) return;

    // Stage 6: Test
    logger.title('Stage 6/7: 测试验证');
    this.reporter.updateStage('test', 'running');
    const testAgent = new TestAgent(agentContext);
    const testResult = await testAgent.execute(developResult.data!);
    this.results.set('test', testResult);
    this.reporter.updateStage('test', 'completed');
    await this.sessionManager.saveStageResult(session.id, 'test', testResult);
    if (!(await this.confirmStage('test', testResult, onStageComplete))) return;

    // Stage 7: Fix (if needed)
    if (testResult.data && testResult.data.bugs.length > 0) {
      logger.title('Stage 7/7: Bug修复');
      this.reporter.updateStage('fix', 'running');
      const fixAgent = new FixAgent(agentContext);
      const fixResult = await fixAgent.execute(testResult.data);
      this.results.set('fix', fixResult);
      this.reporter.updateStage('fix', 'completed');
      await this.sessionManager.saveStageResult(session.id, 'fix', fixResult);
      await onStageComplete?.('fix', fixResult);
    } else {
      logger.title('Stage 7/7: 完成');
      logger.success('所有测试通过，无需修复');
      this.reporter.updateStage('fix', 'skipped');
    }

    // 保存进度报告和完成会话
    const progressPath = await this.reporter.save(this.context.projectRoot);
    await this.sessionManager.complete(session.id);

    logger.title('🎉 全流程完成！');
    logger.info(`进度报告: ${progressPath}`);
  }

  private async confirmStage(
    stage: string,
    result: any,
    onStageComplete?: (stage: string, result: any) => Promise<boolean>
  ): Promise<boolean> {
    if (!result.success) {
      logger.error(`阶段 ${stage} 执行失败: ${result.error}`);
      return false;
    }

    if (onStageComplete) {
      return onStageComplete(stage, result);
    }
    return true;
  }

  getResult(stage: string): any {
    return this.results.get(stage);
  }

  getAllResults(): Map<string, any> {
    return this.results;
  }
}
