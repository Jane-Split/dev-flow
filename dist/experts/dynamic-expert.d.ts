import { BaseExpert, type ExpertResult, type ExpertContext } from './base-expert.js';
import type { Task } from '../planner/task-splitter.js';
/**
 * 动态专家配置
 */
export interface DynamicExpertConfig {
    name: string;
    canHandlePattern: {
        types?: string[];
        expertName?: string;
    };
    codeGenerator: {
        fileExtensions: string[];
        template: (name: string, task: Task) => string;
    };
}
/**
 * 动态专家生成器
 * 允许根据配置动态创建专家
 */
export declare class DynamicExpert extends BaseExpert {
    private config;
    constructor(context: ExpertContext, config: DynamicExpertConfig);
    canHandle(task: Task): boolean;
    execute(task: Task): Promise<ExpertResult>;
    private generateCode;
    private selfCheck;
}
/**
 * 动态专家工厂
 * 用于创建和管理动态专家
 */
export declare class DynamicExpertFactory {
    private context;
    constructor(context: ExpertContext);
    /**
     * 根据配置创建动态专家
     */
    create(config: DynamicExpertConfig): DynamicExpert;
    /**
     * 创建测试专家
     */
    createTestExpert(): DynamicExpert;
    /**
     * 创建配置专家
     */
    createConfigExpert(): DynamicExpert;
}
//# sourceMappingURL=dynamic-expert.d.ts.map