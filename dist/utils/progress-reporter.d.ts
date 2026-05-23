/**
 * 阶段进度
 */
export interface StageProgress {
    name: string;
    status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
    startTime?: string;
    endTime?: string;
    duration?: number;
    summary?: string;
    artifacts?: string[];
}
/**
 * 任务进度
 */
export interface TaskProgress {
    id: string;
    name: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    expert?: string;
    level?: number;
    files?: string[];
}
/**
 * 进度报告
 */
export interface ProgressReport {
    sessionId: string;
    requirement: string;
    startTime: string;
    endTime?: string;
    currentStage: string;
    stages: StageProgress[];
    tasks: TaskProgress[];
    overallStatus: 'running' | 'completed' | 'failed';
}
/**
 * 进度报告器 - 跟踪和可视化 dev-flow 执行进度
 *
 * 功能:
 * - 跟踪各阶段执行状态
 * - 跟踪任务执行状态
 * - 渲染为 Markdown 格式的进度报告
 * - 保存进度报告到文件
 * - 计算总体进度百分比
 */
export declare class ProgressReporter {
    private report;
    constructor(sessionId: string, requirement: string);
    /**
     * 更新阶段状态
     *
     * @param name - 阶段名称
     * @param status - 阶段状态
     * @param summary - 阶段摘要
     * @param artifacts - 产出文件列表
     */
    updateStage(name: string, status: StageProgress['status'], summary?: string, artifacts?: string[]): void;
    /**
     * 更新任务状态
     *
     * @param id - 任务 ID
     * @param name - 任务名称
     * @param status - 任务状态
     * @param expert - 负责的专家
     * @param level - 任务层级
     * @param files - 产出文件列表
     */
    updateTask(id: string, name: string, status: TaskProgress['status'], expert?: string, level?: number, files?: string[]): void;
    /**
     * 完成报告
     */
    complete(): void;
    /**
     * 渲染为 Markdown 格式
     */
    render(): string;
    /**
     * 保存进度报告到文件
     *
     * @param projectRoot - 项目根目录
     * @returns 保存的文件路径
     */
    save(projectRoot: string): Promise<string>;
    /**
     * 获取进度百分比 (0-100)
     */
    getProgress(): number;
    /**
     * 获取当前状态摘要
     */
    getSummary(): string;
    /**
     * 获取完整的进度报告数据
     */
    getReport(): ProgressReport;
    /**
     * 渲染进度条
     */
    private renderProgressBar;
    /**
     * 获取阶段状态图标
     */
    private getStageStatusIcon;
    /**
     * 获取阶段状态文本
     */
    private getStageStatusText;
    /**
     * 获取任务状态图标
     */
    private getTaskStatusIcon;
    /**
     * 获取任务状态文本
     */
    private getTaskStatusText;
    /**
     * 格式化持续时间（秒转为可读格式）
     */
    private formatDuration;
    /**
     * 收集所有产出文件
     */
    private collectArtifacts;
    /**
     * 检查整体状态
     */
    private checkOverallStatus;
}
//# sourceMappingURL=progress-reporter.d.ts.map