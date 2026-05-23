/**
 * 任务拆分器 - 将设计文档拆分为独立的开发任务
 *
 * 特点:
 * - 考虑上下文限制(8000 tokens)
 * - 支持多种任务类型: data, api, component, logic, style, test
 * - 自动识别任务依赖关系
 */
import type { DesignResult } from '../agents/design-agent.js';
export interface DataModel {
    name: string;
    fields: Array<{
        name: string;
        type: string;
        required?: boolean;
        description?: string;
    }>;
}
export interface ApiEndpoint {
    method: string;
    path: string;
    description: string;
    parameters?: Array<{
        name: string;
        type: string;
        required?: boolean;
    }>;
    response?: unknown;
    auth?: boolean;
}
export interface Component {
    name: string;
    type: 'page' | 'component' | 'layout';
    description: string;
    path: string;
    dependencies: string[];
    props?: Array<{
        name: string;
        type: string;
        required?: boolean;
        description?: string;
    }>;
}
export declare const CONTEXT_LIMIT = 8000;
export type TaskType = 'data' | 'api' | 'component' | 'logic' | 'style' | 'test';
export type Complexity = 'high' | 'medium' | 'low';
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'failed';
/**
 * 任务定义接口
 */
export interface Task {
    id: string;
    name: string;
    description: string;
    type: TaskType;
    complexity: Complexity;
    dependencies: string[];
    context: {
        memoryKeys: string[];
        referenceFiles: string[];
        designSection: string;
        estimatedTokens?: number;
    };
    expert: string;
    output: {
        files: string[];
        verification: string;
    };
    status: TaskStatus;
}
/**
 * 任务拆分结果
 */
export interface SplitResult {
    tasks: Task[];
    warnings: string[];
}
/**
 * 任务拆分器
 *
 * 将设计文档解析为可执行的任务列表
 */
export declare class TaskSplitter {
    private taskIdCounter;
    private warnings;
    /**
     * 拆分设计文档为任务列表
     */
    split(designResult: DesignResult): SplitResult;
    /**
     * 创建数据层任务
     */
    private createDataTasks;
    /**
     * 创建API层任务
     */
    private createApiTasks;
    /**
     * 创建组件层任务
     */
    private createComponentTasks;
    /**
     * 创建样式任务
     */
    private createStyleTasks;
    /**
     * 创建测试任务
     */
    private createTestTasks;
    /**
     * 检查任务的上下文限制
     */
    private checkContextLimits;
    /**
     * 估算文本的token数量（简化版）
     * 假设平均每个token约4个字符
     */
    private estimateTokens;
    /**
     * 转换名称为文件安全名称
     */
    private toFileName;
}
//# sourceMappingURL=task-splitter.d.ts.map