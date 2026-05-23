/**
 * 算法模板库 - 提供常见算法的代码模板和测试生成
 *
 * 支持的算法类型:
 * - 排序: 冒泡、选择、插入、快速、归并、堆排序
 * - 搜索: 线性、二分、BFS、DFS
 * - 数据结构: 链表、栈、队列、哈希表、二叉树
 * - 动态规划: 斐波那契、背包、最长子序列
 * - 其他: 递归、回溯、贪心
 */
export interface AlgorithmTemplate {
    name: string;
    keywords: string[];
    category: string;
    complexity: {
        time: string;
        space: string;
    };
    generate: (taskName: string) => {
        code: string;
        test: string;
    };
}
/**
 * 根据描述文本匹配最合适的算法模板
 *
 * @param description - 任务描述文本
 * @returns 匹配到的算法模板，未匹配返回 null
 */
export declare function getAlgorithmTemplate(description: string): AlgorithmTemplate | null;
/**
 * 使用模板生成算法代码和测试
 *
 * @param template - 算法模板
 * @param taskName - 任务名称（用于文件命名）
 * @returns 包含代码和测试内容的对象
 */
export declare function generateAlgorithmCode(template: AlgorithmTemplate, taskName: string): {
    code: string;
    test: string;
};
/**
 * 获取所有可用的算法模板
 *
 * @returns 所有算法模板的名称和分类
 */
export declare function listAvailableAlgorithms(): Array<{
    name: string;
    category: string;
    keywords: string[];
}>;
//# sourceMappingURL=algorithm-templates.d.ts.map