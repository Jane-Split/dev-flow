/**
 * 任务调度器 - 支持并行执行识别和进度追踪
 *
 * 功能:
 * - 基于依赖图的任务调度
 * - 并行执行识别
 * - 时间估算
 * - 动态任务分配
 */
import { DependencyGraph } from './dependency-graph.js';
/**
 * 任务调度器
 */
export class Scheduler {
    config;
    constructor(config) {
        this.config = {
            maxParallel: 3,
            timePerComplexity: {
                high: 60,
                medium: 30,
                low: 15,
            },
            parallelEfficiency: 0.8,
            ...config,
        };
    }
    /**
     * 创建调度计划
     */
    schedule(tasks) {
        const graph = new DependencyGraph(tasks);
        const levels = graph.getExecutionLevels();
        // 计算最大并行数
        const maxParallelInLevels = Math.max(...levels.map(l => l.tasks.length));
        const effectiveMaxParallel = Math.min(this.config.maxParallel, maxParallelInLevels);
        // 估算总时间
        const estimatedTime = this.calculateEstimatedTime(levels);
        // 获取并行组
        const parallelGroups = graph.getParallelGroups();
        // 获取关键路径
        const criticalPath = graph.getCriticalPath();
        return {
            levels,
            totalTasks: tasks.length,
            maxParallel: effectiveMaxParallel,
            estimatedTime,
            parallelGroups,
            criticalPath,
        };
    }
    /**
     * 计算预估执行时间
     */
    calculateEstimatedTime(levels) {
        let totalTime = 0;
        for (const level of levels) {
            // 计算该层级的总工作量
            const levelTime = level.tasks.reduce((sum, task) => {
                return sum + this.config.timePerComplexity[task.complexity];
            }, 0);
            // 考虑并行执行
            const parallelTasks = Math.min(level.tasks.length, this.config.maxParallel);
            const parallelTime = levelTime / (parallelTasks * this.config.parallelEfficiency);
            totalTime += Math.max(parallelTime, this.config.timePerComplexity.low);
        }
        return Math.round(totalTime);
    }
    /**
     * 获取下一个可执行的任务
     *
     * 考虑并行限制，返回当前可以开始执行的任务列表
     */
    getNextTasks(completedTasks, allTasks, inProgressCount = 0) {
        const completedSet = new Set(completedTasks);
        const availableSlots = this.config.maxParallel - inProgressCount;
        if (availableSlots <= 0) {
            return [];
        }
        const ready = [];
        for (const task of allTasks) {
            // 跳过已完成或正在执行的任务
            if (completedSet.has(task.id))
                continue;
            // 检查所有依赖是否已完成
            const allDepsCompleted = task.dependencies.every(d => completedSet.has(d));
            if (allDepsCompleted) {
                ready.push(task);
            }
        }
        // 按优先级排序（高复杂度优先）
        ready.sort((a, b) => {
            const complexityOrder = { high: 3, medium: 2, low: 1 };
            return complexityOrder[b.complexity] - complexityOrder[a.complexity];
        });
        return ready.slice(0, availableSlots);
    }
    /**
     * 创建初始执行状态
     */
    createExecutionState(allTasks) {
        return {
            completed: new Set(),
            inProgress: new Set(),
            failed: new Set(),
            pending: new Set(allTasks.map(t => t.id)),
        };
    }
    /**
     * 更新执行状态
     */
    updateExecutionState(state, taskId, status) {
        const newState = {
            completed: new Set(state.completed),
            inProgress: new Set(state.inProgress),
            failed: new Set(state.failed),
            pending: new Set(state.pending),
        };
        switch (status) {
            case 'start':
                newState.inProgress.add(taskId);
                newState.pending.delete(taskId);
                break;
            case 'complete':
                newState.inProgress.delete(taskId);
                newState.completed.add(taskId);
                break;
            case 'fail':
                newState.inProgress.delete(taskId);
                newState.failed.add(taskId);
                break;
        }
        return newState;
    }
    /**
     * 检查是否所有任务完成
     */
    isComplete(state) {
        return state.pending.size === 0 && state.inProgress.size === 0;
    }
    /**
     * 获取执行进度
     */
    getProgress(state, totalTasks) {
        return {
            completed: state.completed.size,
            inProgress: state.inProgress.size,
            failed: state.failed.size,
            pending: state.pending.size,
            percentage: Math.round((state.completed.size / totalTasks) * 100),
        };
    }
    /**
     * 获取可以并行执行的任务
     *
     * 返回所有当前可以并行执行的任务，不限制数量
     */
    getParallelReadyTasks(completedTasks, allTasks) {
        const completedSet = new Set(completedTasks);
        const ready = [];
        for (const task of allTasks) {
            if (completedSet.has(task.id))
                continue;
            const allDepsCompleted = task.dependencies.every(d => completedSet.has(d));
            if (allDepsCompleted) {
                ready.push(task);
            }
        }
        return ready;
    }
    /**
     * 重新调度失败的任务
     *
     * 返回需要重新执行的任务及其依赖
     */
    rescheduleFailedTasks(failedTaskIds, allTasks) {
        const graph = new DependencyGraph(allTasks);
        const tasksToRetry = [];
        const visited = new Set();
        for (const failedId of failedTaskIds) {
            const task = graph.getTask(failedId);
            if (task && !visited.has(failedId)) {
                tasksToRetry.push(task);
                visited.add(failedId);
                // 获取所有依赖该失败任务的任务
                const dependents = graph.getDependents(failedId);
                for (const dependent of dependents) {
                    if (!visited.has(dependent.id)) {
                        tasksToRetry.push(dependent);
                        visited.add(dependent.id);
                    }
                }
            }
        }
        return tasksToRetry;
    }
    /**
     * 优化调度计划
     *
     * 根据任务复杂度重新排序，优先执行关键路径上的任务
     */
    optimizeSchedule(tasks) {
        const graph = new DependencyGraph(tasks);
        const levels = graph.getExecutionLevels();
        // 在每个层级内按复杂度排序
        for (const level of levels) {
            level.tasks.sort((a, b) => {
                const complexityOrder = { high: 3, medium: 2, low: 1 };
                return complexityOrder[b.complexity] - complexityOrder[a.complexity];
            });
        }
        const estimatedTime = this.calculateEstimatedTime(levels);
        return {
            levels,
            totalTasks: tasks.length,
            maxParallel: this.config.maxParallel,
            estimatedTime,
            parallelGroups: graph.getParallelGroups(),
            criticalPath: graph.getCriticalPath(),
        };
    }
    /**
     * 生成执行报告
     */
    generateReport(schedule, state) {
        const progress = this.getProgress(state, schedule.totalTasks);
        const lines = [
            '=== 执行报告 ===',
            '',
            `总任务数: ${schedule.totalTasks}`,
            `已完成: ${progress.completed} (${progress.percentage}%)`,
            `执行中: ${progress.inProgress}`,
            `失败: ${progress.failed}`,
            `待执行: ${progress.pending}`,
            '',
            `最大并行数: ${schedule.maxParallel}`,
            `预估总时间: ${schedule.estimatedTime} 分钟`,
            '',
            '关键路径:',
            ...schedule.criticalPath.map((t, i) => `  ${i + 1}. ${t.name} (${t.complexity})`),
            '',
            '执行层级:',
            ...schedule.levels.map(l => `  Level ${l.level}: ${l.tasks.length} 个任务 ${l.parallel ? '(并行)' : '(串行)'}`),
        ];
        return lines.join('\n');
    }
}
//# sourceMappingURL=scheduler.js.map