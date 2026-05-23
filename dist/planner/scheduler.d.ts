/**
 * 任务调度器 - 支持并行执行识别和进度追踪
 *
 * 功能:
 * - 基于依赖图的任务调度
 * - 并行执行识别
 * - 时间估算
 * - 动态任务分配
 */
import type { Task } from './task-splitter.js';
import { type ExecutionLevel } from './dependency-graph.js';
/**
 * 调度结果
 */
export interface ScheduleResult {
    levels: ExecutionLevel[];
    totalTasks: number;
    maxParallel: number;
    estimatedTime: number;
    parallelGroups: Task[][];
    criticalPath: Task[];
}
/**
 * 调度配置
 */
export interface SchedulerConfig {
    maxParallel: number;
    timePerComplexity: {
        high: number;
        medium: number;
        low: number;
    };
    parallelEfficiency: number;
}
/**
 * 执行状态
 */
export interface ExecutionState {
    completed: Set<string>;
    inProgress: Set<string>;
    failed: Set<string>;
    pending: Set<string>;
}
/**
 * 任务调度器
 */
export declare class Scheduler {
    private config;
    constructor(config?: Partial<SchedulerConfig>);
    /**
     * 创建调度计划
     */
    schedule(tasks: Task[]): ScheduleResult;
    /**
     * 计算预估执行时间
     */
    private calculateEstimatedTime;
    /**
     * 获取下一个可执行的任务
     *
     * 考虑并行限制，返回当前可以开始执行的任务列表
     */
    getNextTasks(completedTasks: string[], allTasks: Task[], inProgressCount?: number): Task[];
    /**
     * 创建初始执行状态
     */
    createExecutionState(allTasks: Task[]): ExecutionState;
    /**
     * 更新执行状态
     */
    updateExecutionState(state: ExecutionState, taskId: string, status: 'start' | 'complete' | 'fail'): ExecutionState;
    /**
     * 检查是否所有任务完成
     */
    isComplete(state: ExecutionState): boolean;
    /**
     * 获取执行进度
     */
    getProgress(state: ExecutionState, totalTasks: number): {
        completed: number;
        inProgress: number;
        failed: number;
        pending: number;
        percentage: number;
    };
    /**
     * 获取可以并行执行的任务
     *
     * 返回所有当前可以并行执行的任务，不限制数量
     */
    getParallelReadyTasks(completedTasks: string[], allTasks: Task[]): Task[];
    /**
     * 重新调度失败的任务
     *
     * 返回需要重新执行的任务及其依赖
     */
    rescheduleFailedTasks(failedTaskIds: string[], allTasks: Task[]): Task[];
    /**
     * 优化调度计划
     *
     * 根据任务复杂度重新排序，优先执行关键路径上的任务
     */
    optimizeSchedule(tasks: Task[]): ScheduleResult;
    /**
     * 生成执行报告
     */
    generateReport(schedule: ScheduleResult, state: ExecutionState): string;
}
//# sourceMappingURL=scheduler.d.ts.map