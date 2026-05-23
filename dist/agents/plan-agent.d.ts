/**
 * PlanAgent - 任务拆分Agent
 *
 * 负责将设计文档拆分为独立的开发任务，构建执行计划
 */
import { BaseAgent, type AgentContext, type AgentResult } from './base-agent.js';
import { type Task, type ScheduleResult, type DesignResult } from '../planner/index.js';
/**
 * 计划结果
 */
export interface PlanResult {
    tasks: Task[];
    schedule: ScheduleResult;
    documentPath: string;
}
/**
 * 计划Agent
 *
 * 将设计文档转换为可执行的任务计划
 */
export declare class PlanAgent extends BaseAgent {
    constructor(context: AgentContext);
    /**
     * 执行计划生成
     */
    execute(designResult: DesignResult): Promise<AgentResult<PlanResult>>;
    /**
     * 生成计划文档
     */
    private generateDocument;
    /**
     * 获取类型分布统计
     */
    private getTypeDistribution;
    /**
     * 获取复杂度分布统计
     */
    private getComplexityDistribution;
    /**
     * 获取专家分布统计
     */
    private getExpertDistribution;
    /**
     * 验证任务计划
     */
    validatePlan(tasks: Task[]): {
        valid: boolean;
        errors: string[];
    };
}
//# sourceMappingURL=plan-agent.d.ts.map