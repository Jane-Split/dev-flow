import { BaseAgent, type AgentContext, type AgentResult } from './base-agent.js';
export interface Bug {
    id: string;
    description: string;
    file: string;
    line?: number;
    type: 'syntax' | 'runtime' | 'logic' | 'type' | 'dependency' | 'config';
}
export interface TestAgentResult {
    bugs: Bug[];
    testReport: any;
    testCases?: any[];
    reportPath?: string;
}
export interface FixResult {
    fixedBugs: string[];
    remainingBugs: string[];
    files: string[];
}
export declare class FixAgent extends BaseAgent {
    private registry;
    constructor(context: AgentContext);
    execute(testResult: TestAgentResult): Promise<AgentResult<FixResult>>;
    private fixBug;
    private fixSyntaxError;
    /**
     * 修复运行时错误 - 只在 bug 相关行附近添加空值检查，而非全局替换
     */
    private fixRuntimeError;
    /**
     * 修复逻辑错误 - 只替换 == 为 === 当两边不是 null/undefined 检查时
     */
    private fixLogicError;
    private fixTypeError;
    /**
     * 修复依赖缺失问题
     */
    private fixDependencyError;
    /**
     * 修复配置错误
     */
    private fixConfigError;
    /**
     * 修复 JSON 配置文件错误
     */
    private fixJsonConfigError;
    /**
     * 修复环境变量配置错误
     */
    private fixEnvConfigError;
    /**
     * 修复路径配置错误
     */
    private fixPathConfigError;
    private applyGenericFix;
    private fixUnclosedBrackets;
    /**
     * 移除字符串和注释中的内容，避免误判括号
     */
    private removeStringsAndComments;
    private fixMissingSemicolons;
    /**
     * 只在 bug 行附近添加可选链，而非全局替换
     */
    private addNullChecksNearLine;
    /**
     * 只在 bug 行附近添加数组边界检查
     */
    private addBoundsChecksNearLine;
    /**
     * 在文件内容中查找与 bug 描述相关的行号
     */
    private findRelevantLine;
    /**
     * 检查匹配项是否在类型注解中
     */
    private isInsideTypeAnnotation;
    /**
     * 全局添加空值检查（保留作为内部方法，但主要逻辑使用 addNullChecksNearLine）
     */
    private addNullChecks;
    /**
     * 全局添加边界检查（保留作为内部方法）
     */
    private addBoundsChecks;
    /**
     * 为未标注类型的函数参数添加类型注解，保留已有类型注解
     */
    private addTypeAnnotations;
    /**
     * 为参数列表中的每个未标注类型的参数添加类型注解
     */
    private annotateParams;
    private fixAnyTypes;
}
//# sourceMappingURL=fix-agent.d.ts.map