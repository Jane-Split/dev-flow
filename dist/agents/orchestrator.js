import { ResearchAgent } from './research-agent.js';
import { AnalyzeAgent } from './analyze-agent.js';
import { DesignAgent } from './design-agent.js';
import { PlanAgent } from './plan-agent.js';
import { DevelopAgent } from './develop-agent.js';
import { TestAgent } from './test-agent.js';
import { FixAgent } from './fix-agent.js';
import { logger } from '../utils/logger.js';
export class Orchestrator {
    context;
    results = new Map();
    constructor(context) {
        this.context = context;
    }
    async execute(options) {
        const { stage, requirement, refresh, onStageComplete } = options;
        if (stage) {
            await this.executeStage(stage, requirement, refresh, onStageComplete);
        }
        else if (requirement) {
            await this.executeFullFlow(requirement, onStageComplete);
        }
        else {
            logger.error('请提供需求描述或指定阶段');
        }
    }
    async executeStage(stage, requirement, refresh, onStageComplete) {
        const agentContext = {
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
            default:
                logger.error(`未知阶段: ${stage}`);
        }
    }
    async executeFullFlow(requirement, onStageComplete) {
        const agentContext = {
            projectRoot: this.context.projectRoot,
            memory: this.context.memory,
            sessionId: this.context.sessionId,
        };
        // Stage 1: Research
        logger.title('Stage 1/7: 项目调研');
        const researchAgent = new ResearchAgent(agentContext);
        const researchResult = await researchAgent.execute();
        this.results.set('research', researchResult);
        if (!(await this.confirmStage('research', researchResult, onStageComplete)))
            return;
        // Stage 2: Analyze
        logger.title('Stage 2/7: 需求分析');
        const analyzeAgent = new AnalyzeAgent(agentContext);
        const analyzeResult = await analyzeAgent.execute(requirement);
        this.results.set('analyze', analyzeResult);
        if (!(await this.confirmStage('analyze', analyzeResult, onStageComplete)))
            return;
        // Stage 3: Design
        logger.title('Stage 3/7: 详细设计');
        const designAgent = new DesignAgent(agentContext);
        const designResult = await designAgent.execute(analyzeResult.data);
        this.results.set('design', designResult);
        if (!(await this.confirmStage('design', designResult, onStageComplete)))
            return;
        // Stage 4: Plan
        logger.title('Stage 4/7: 任务拆分');
        const planAgent = new PlanAgent(agentContext);
        const planResult = await planAgent.execute(designResult.data);
        this.results.set('plan', planResult);
        if (!(await this.confirmStage('plan', planResult, onStageComplete)))
            return;
        // Stage 5: Develop
        logger.title('Stage 5/7: 开发执行');
        const developAgent = new DevelopAgent(agentContext);
        developAgent.setPlan(planResult.data);
        const developResult = await developAgent.execute();
        this.results.set('develop', developResult);
        if (!(await this.confirmStage('develop', developResult, onStageComplete)))
            return;
        // Stage 6: Test
        logger.title('Stage 6/7: 测试验证');
        const testAgent = new TestAgent(agentContext);
        const testResult = await testAgent.execute(developResult.data);
        this.results.set('test', testResult);
        if (!(await this.confirmStage('test', testResult, onStageComplete)))
            return;
        // Stage 7: Fix (if needed)
        if (testResult.data && testResult.data.bugs.length > 0) {
            logger.title('Stage 7/7: Bug修复');
            const fixAgent = new FixAgent(agentContext);
            const fixResult = await fixAgent.execute(testResult.data);
            this.results.set('fix', fixResult);
            await onStageComplete?.('fix', fixResult);
        }
        else {
            logger.title('Stage 7/7: 完成');
            logger.success('所有测试通过，无需修复');
        }
        logger.title('🎉 全流程完成！');
    }
    async confirmStage(stage, result, onStageComplete) {
        if (!result.success) {
            logger.error(`阶段 ${stage} 执行失败: ${result.error}`);
            return false;
        }
        if (onStageComplete) {
            return onStageComplete(stage, result);
        }
        return true;
    }
    getResult(stage) {
        return this.results.get(stage);
    }
    getAllResults() {
        return this.results;
    }
}
//# sourceMappingURL=orchestrator.js.map