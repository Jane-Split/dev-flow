import type { Task } from '../planner/task-splitter.js';
import { BaseExpert, type ExpertResult } from './base-expert.js';
/**
 * 算法专家 - 处理算法相关的开发任务
 *
 * 能力:
 * - 从任务描述中识别算法类型
 * - 根据算法模板生成 TypeScript 实现代码
 * - 生成配套的测试用例
 * - 标注时间和空间复杂度
 *
 * 支持的算法类型:
 * - 排序: 冒泡、选择、插入、快速、归并、堆排序
 * - 搜索: 线性、二分、BFS、DFS
 * - 数据结构: 链表、栈、队列、哈希表、二叉树
 * - 动态规划: 斐波那契、背包、最长子序列
 * - 其他: 递归、回溯、贪心
 */
export declare class AlgorithmExpert extends BaseExpert {
    constructor(context: any);
    canHandle(task: Task): boolean;
    execute(task: Task): Promise<ExpertResult>;
    /**
     * 将生成的代码和测试写入文件
     */
    private writeFiles;
    /**
     * 生成通用算法文件骨架（当未匹配到模板时使用）
     */
    private generateGenericAlgorithm;
    /**
     * 自检：验证生成的文件是否存在且包含必要内容
     */
    private selfCheck;
    /**
     * 转换名称为文件安全名称
     */
    private toFileName;
}
//# sourceMappingURL=algorithm-expert.d.ts.map