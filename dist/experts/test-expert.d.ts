import type { Task } from '../planner/task-splitter.js';
import { BaseExpert, type ExpertContext, type ExpertResult } from './base-expert.js';
/**
 * 测试专家 - 处理测试相关任务
 *
 * 根据任务输出文件的扩展名自动生成对应语言的测试代码：
 * - .ts/.tsx -> vitest
 * - .js/.jsx -> jest
 * - .java -> JUnit 5
 * - .py -> pytest
 * - 其他 -> 通用测试骨架
 */
export declare class TestExpert extends BaseExpert {
    constructor(context: ExpertContext);
    canHandle(task: Task): boolean;
    execute(task: Task): Promise<ExpertResult>;
    /**
     * 根据文件扩展名生成对应语言的测试代码
     */
    private generateTestCode;
    /**
     * 根据任务描述推导测试用例名称
     */
    private deriveTestCases;
    /**
     * 生成 Vitest 测试代码 (.ts/.tsx)
     */
    private generateVitestTest;
    /**
     * 生成 Jest 测试代码 (.js/.jsx)
     */
    private generateJestTest;
    /**
     * 生成 JUnit 5 测试代码 (.java)
     */
    private generateJUnitTest;
    /**
     * 生成 pytest 测试代码 (.py)
     */
    private generatePytestTest;
    /**
     * 生成通用测试骨架
     */
    private generateGenericTest;
    /**
     * 当没有指定输出文件时，生成默认测试文件
     */
    private generateDefaultTest;
    /**
     * selfCheck: 验证生成的测试文件是否包含基本测试结构
     */
    private selfCheck;
    /**
     * 获取语言标签
     */
    private getLanguageLabel;
    /**
     * 清理 describe 名称中的特殊字符
     */
    private sanitizeDescribeName;
    /**
     * 清理 it 名称中的特殊字符
     */
    private sanitizeItName;
    /**
     * 转换为 PascalCase
     */
    private toPascalCase;
    /**
     * 转换为 camelCase
     */
    private toCamelCase;
    /**
     * 转换为 snake_case
     */
    private toSnakeCase;
}
//# sourceMappingURL=test-expert.d.ts.map