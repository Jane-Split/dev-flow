/**
 * 依赖图管理 - 使用DAG(有向无环图)管理任务依赖关系
 *
 * 功能:
 * - 构建任务依赖图
 * - 拓扑排序
 * - 检测循环依赖
 * - 计算执行层级(支持并行执行识别)
 */
/**
 * 循环依赖错误
 */
export class CircularDependencyError extends Error {
    constructor(message) {
        super(message);
        this.name = 'CircularDependencyError';
    }
}
/**
 * 依赖图类
 *
 * 使用邻接表实现有向无环图(DAG)
 */
export class DependencyGraph {
    tasks;
    adjList; // 邻接表: 任务ID -> 依赖该任务的任务列表
    inDegree; // 入度表: 任务ID -> 入度
    /**
     * 构造函数
     */
    constructor(tasks) {
        this.tasks = new Map(tasks.map(t => [t.id, t]));
        this.adjList = new Map();
        this.inDegree = new Map();
        this.buildGraph(tasks);
    }
    /**
     * 构建依赖图
     */
    buildGraph(tasks) {
        // 初始化邻接表和入度表
        for (const task of tasks) {
            this.adjList.set(task.id, []);
            this.inDegree.set(task.id, 0);
        }
        // 构建边和更新入度
        for (const task of tasks) {
            for (const depId of task.dependencies) {
                // 检查依赖的任务是否存在
                if (!this.tasks.has(depId)) {
                    throw new Error(`任务 ${task.id} 依赖不存在的任务: ${depId}`);
                }
                // 添加边: depId -> task.id
                this.adjList.get(depId)?.push(task.id);
                // 增加入度
                this.inDegree.set(task.id, (this.inDegree.get(task.id) || 0) + 1);
            }
        }
    }
    /**
     * 拓扑排序
     *
     * 使用Kahn算法实现
     * @returns 排序后的任务ID列表
     * @throws CircularDependencyError 如果检测到循环依赖
     */
    topologicalSort() {
        const result = [];
        const queue = [];
        const inDegree = new Map(this.inDegree);
        // 找出入度为0的节点（没有依赖的任务）
        for (const [id, degree] of inDegree) {
            if (degree === 0) {
                queue.push(id);
            }
        }
        // Kahn算法
        while (queue.length > 0) {
            const id = queue.shift();
            result.push(id);
            // 减少邻居节点的入度
            for (const neighbor of this.adjList.get(id) || []) {
                inDegree.set(neighbor, (inDegree.get(neighbor) || 0) - 1);
                if (inDegree.get(neighbor) === 0) {
                    queue.push(neighbor);
                }
            }
        }
        // 检查结果长度，如果小于任务总数，说明有循环依赖
        if (result.length !== this.tasks.size) {
            const remaining = Array.from(this.tasks.keys()).filter(id => !result.includes(id));
            throw new CircularDependencyError(`检测到循环依赖，涉及任务: ${remaining.join(', ')}`);
        }
        return result;
    }
    /**
     * 获取执行层级
     *
     * 将任务按层级分组，同一层的任务可以并行执行
     * @returns 执行层级列表
     */
    getExecutionLevels() {
        const levels = [];
        const inDegree = new Map(this.inDegree);
        let currentLevel = 0;
        while (inDegree.size > 0) {
            const levelTasks = [];
            // 找出当前入度为0的任务
            for (const [id, degree] of inDegree) {
                if (degree === 0) {
                    const task = this.tasks.get(id);
                    if (task) {
                        levelTasks.push(task);
                    }
                }
            }
            if (levelTasks.length === 0) {
                const remaining = Array.from(inDegree.keys());
                throw new CircularDependencyError(`检测到循环依赖，涉及任务: ${remaining.join(', ')}`);
            }
            // 添加当前层级
            levels.push({
                level: currentLevel,
                tasks: levelTasks,
                parallel: levelTasks.length > 1,
            });
            // 移除当前层级的节点，更新入度
            for (const task of levelTasks) {
                inDegree.delete(task.id);
                for (const neighbor of this.adjList.get(task.id) || []) {
                    if (inDegree.has(neighbor)) {
                        inDegree.set(neighbor, (inDegree.get(neighbor) || 0) - 1);
                    }
                }
            }
            currentLevel++;
        }
        return levels;
    }
    /**
     * 获取指定任务的直接依赖
     */
    getDependencies(id) {
        const task = this.tasks.get(id);
        if (!task)
            return [];
        return task.dependencies
            .map(d => this.tasks.get(d))
            .filter(Boolean);
    }
    /**
     * 获取指定任务的所有依赖（递归）
     */
    getAllDependencies(id) {
        const result = [];
        const visited = new Set();
        const stack = [id];
        while (stack.length > 0) {
            const currentId = stack.pop();
            if (visited.has(currentId))
                continue;
            visited.add(currentId);
            const task = this.tasks.get(currentId);
            if (task) {
                for (const depId of task.dependencies) {
                    const depTask = this.tasks.get(depId);
                    if (depTask) {
                        result.push(depTask);
                        stack.push(depId);
                    }
                }
            }
        }
        return result;
    }
    /**
     * 获取依赖于指定任务的任务列表
     */
    getDependents(id) {
        const dependents = [];
        for (const [taskId, deps] of this.adjList) {
            if (deps.includes(id)) {
                const task = this.tasks.get(taskId);
                if (task) {
                    dependents.push(task);
                }
            }
        }
        return dependents;
    }
    /**
     * 获取任务
     */
    getTask(id) {
        return this.tasks.get(id);
    }
    /**
     * 获取所有任务
     */
    getAllTasks() {
        return Array.from(this.tasks.values());
    }
    /**
     * 检查是否存在循环依赖
     */
    hasCircularDependency() {
        try {
            this.topologicalSort();
            return false;
        }
        catch (error) {
            if (error instanceof CircularDependencyError) {
                return true;
            }
            throw error;
        }
    }
    /**
     * 获取关键路径
     *
     * 关键路径是执行时间最长的路径
     */
    getCriticalPath() {
        const levels = this.getExecutionLevels();
        const path = [];
        // 从最后一层开始回溯
        for (let i = levels.length - 1; i >= 0; i--) {
            const level = levels[i];
            // 选择复杂度最高的任务
            const criticalTask = level.tasks.reduce((max, task) => {
                const complexityScore = { high: 3, medium: 2, low: 1 };
                return complexityScore[task.complexity] > complexityScore[max.complexity]
                    ? task
                    : max;
            });
            path.unshift(criticalTask);
        }
        return path;
    }
    /**
     * 获取可以并行执行的任务组
     */
    getParallelGroups() {
        const levels = this.getExecutionLevels();
        return levels
            .filter(level => level.parallel)
            .map(level => level.tasks);
    }
    /**
     * 获取任务的执行顺序（包括层级信息）
     */
    getExecutionOrder() {
        const levels = this.getExecutionLevels();
        const result = [];
        for (const level of levels) {
            for (const task of level.tasks) {
                result.push({ task, level: level.level });
            }
        }
        return result;
    }
}
//# sourceMappingURL=dependency-graph.js.map