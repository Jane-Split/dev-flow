/**
 * 老旧项目分析 Agent - 深度分析老旧项目的技术栈、复杂度和技术债务
 *
 * 职责:
 * - 执行老旧项目全面扫描
 * - 生成分析报告
 * - 提供迁移建议和风险评估
 */
import { BaseAgent, type AgentContext, type AgentResult } from './base-agent.js';
import { type LegacyAnalysisResult } from '../scanners/legacy-scanner.js';
/** LegacyAnalyzer 输出结果 */
export interface LegacyAnalyzerResult {
    analysis: LegacyAnalysisResult;
    reportPath: string;
}
export declare class LegacyAnalyzer extends BaseAgent {
    constructor(context: AgentContext);
    execute(options?: {
        module?: string;
        techDebt?: boolean;
        complexity?: boolean;
    }): Promise<AgentResult<LegacyAnalyzerResult>>;
    /**
     * 生成分析报告
     */
    private generateReport;
}
//# sourceMappingURL=legacy-analyzer.d.ts.map