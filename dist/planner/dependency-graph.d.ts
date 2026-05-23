/**
 * 依赖图管理 - 使用DAG(有向无环图)管理任务依赖关系
 *
 * 功能:
 * - 构建任务依赖图
 * - 拓扑排序
 * - 检测循环依赖
 * - 计算执行层级(支持并行执行识别)
 */
import type { Task } from './task-splitter.js';
/**
 * 执行层级定义
 */
export interface ExecutionLevel {
    level: number;
    tasks: Task[];
    parallel: boolean;
}
/**
 * 循环依赖错误
 */
export declare class CircularDependencyError extends Error {
    constructor(message: string);
}
/**
 * 依赖图类
 *
 * 使用邻接表实现有向无环图(DAG)
 */
export declare class DependencyGraph {
    private tasks;
    private adjList;
    private inDegree;
    /**
     * 构造函数
     */
    constructor(tasks: Task[]);
    /**
     * 构建依赖图
     */
    private buildGraph;
    /**
     * 拓扑排序
     *
     * 使用Kahn算法实现
     * @returns 排序后的任务ID列表
     * @throws CircularDependencyError 如果检测到循环依赖
     */
    topologicalSort(): string[];
    /**
     * 获取执行层级
     *
     * 将任务按层级分组，同一层的任务可以并行执行
     * @returns 执行层级列表
     */
    getExecutionLevels(): ExecutionLevel[];
    /**
     * 获取指定任务的直接依赖
     */
    getDependencies(id: string): Task[];
    /**
     * 获取指定任务的所有依赖（递归）
     */
    getAllDependencies(id: string): Task[];
    /**
     * 获取依赖于指定任务的任务列表
     */
    getDependents(id: string): Task[];
    /**
     * 获取任务
     */
    getTask(id: string): Task | undefined;
    /**
     * 获取所有任务
     */
    getAllTasks(): Task[];
    /**
     * 检查是否存在循环依赖
     */
    hasCircularDependency(): boolean;
    /**
     * 获取关键路径
     *
     * 关键路径是执行时间最长的路径
     */
    getCriticalPath(): Task[];
    /**
     * 获取可以并行执行的任务组
     */
    getParallelGroups(): Task[][];
    /**
     * 获取任务的执行顺序（包括层级信息）
     */
    getExecutionOrder(): Array<{
        task: Task;
        level: number;
    }>;
}
//# sourceMappingURL=dependency-graph.d.ts.map