/**
 * 老旧项目安全重构 Agent - 对老旧代码进行安全重构
 *
 * 职责:
 * - 分析代码复杂度和耦合度
 * - 生成安全重构方案
 * - 执行渐进式重构
 * - 确保重构不破坏现有功能
 */
import { BaseAgent, type AgentContext, type AgentResult } from './base-agent.js';
/** 重构选项 */
export interface RefactorOptions {
    module?: string;
    safe?: boolean;
    target?: string;
    strategy?: 'extract' | 'simplify' | 'rename' | 'decompose';
}
/** 重构建议 */
export interface RefactorSuggestion {
    file: string;
    type: 'extract-function' | 'extract-class' | 'simplify-condition' | 'rename' | 'decompose' | 'remove-duplication';
    description: string;
    effort: 'low' | 'medium' | 'high';
    risk: 'low' | 'medium' | 'high';
    code?: string;
}
/** 重构结果 */
export interface LegacyRefactorResult {
    suggestions: RefactorSuggestion[];
    refactoredFiles: string[];
    reportPath: string;
    summary: string;
}
export declare class LegacyRefactor extends BaseAgent {
    constructor(context: AgentContext);
    execute(options?: RefactorOptions): Promise<AgentResult<LegacyRefactorResult>>;
    /**
     * 分析文件，生成重构建议
     */
    private analyzeForRefactoring;
    /**
     * 提取函数块
     */
    private extractFunctionBlocks;
    /**
     * 查找可重构的文件
     */
    private findRefactorableFiles;
    /**
     * 生成重构报告
     */
    private generateReport;
}
//# sourceMappingURL=legacy-refactor.d.ts.map