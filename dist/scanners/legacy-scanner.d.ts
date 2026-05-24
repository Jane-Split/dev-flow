/**
 * 老旧技术栈扫描器 - 识别项目中的老旧技术栈、代码复杂度和技术债务
 *
 * 能力:
 * - 识别老旧技术栈 (jQuery, AngularJS, PHP 5.x, Java 6/7, Python 2.x, Backbone.js, Knockout.js)
 * - 分析代码复杂度和热点文件
 * - 识别技术债务和安全风险
 * - 生成迁移路径建议
 */
/** 老旧技术栈类型 */
export type LegacyTechType = 'jquery' | 'angularjs' | 'php-legacy' | 'java-legacy' | 'python-legacy' | 'ruby-legacy' | 'backbone' | 'knockout' | 'gulp-grunt' | 'ie-compat';
/** 识别到的老旧技术栈 */
export interface LegacyTechStack {
    type: LegacyTechType;
    label: string;
    version: string;
    confidence: number;
    files: string[];
    dependencies: string[];
    migrationTargets: string[];
}
/** 代码复杂度热点 */
export interface ComplexityHotspot {
    file: string;
    complexity: number;
    lines: number;
    risk: 'high' | 'medium' | 'low';
}
/** 技术债务项 */
export interface TechDebt {
    id: string;
    type: 'security' | 'compatibility' | 'maintainability' | 'performance' | 'dependency';
    severity: 'critical' | 'high' | 'medium' | 'low';
    files: string[];
    description: string;
    suggestion: string;
    effort: 'low' | 'medium' | 'high';
}
/** 迁移路径 */
export interface MigrationPath {
    from: string;
    to: string;
    difficulty: 'easy' | 'medium' | 'hard';
    estimatedEffort: string;
    steps: string[];
    risks: string[];
}
/** 老旧项目分析结果 */
export interface LegacyAnalysisResult {
    isLegacy: boolean;
    legacyScore: number;
    techStacks: LegacyTechStack[];
    complexity: {
        average: number;
        hotspots: ComplexityHotspot[];
    };
    techDebts: TechDebt[];
    migrationPaths: MigrationPath[];
    summary: string;
    recommendations: string[];
}
export declare class LegacyScanner {
    private projectRoot;
    constructor(projectRoot: string);
    /**
     * 执行完整的老旧项目扫描
     */
    scan(): Promise<LegacyAnalysisResult>;
    /**
     * 识别老旧技术栈
     */
    private identifyTechStacks;
    /**
     * 分析代码复杂度
     */
    private analyzeComplexity;
    /**
     * 计算圈复杂度（简化版）
     */
    private calculateCyclomaticComplexity;
    /**
     * 识别技术债务
     */
    private identifyTechDebts;
    /**
     * 生成迁移路径
     */
    private generateMigrationPaths;
    private findSourceFiles;
    private readPackageDeps;
    private calculateLegacyScore;
    private generateSummary;
    private generateRecommendations;
    private getSecurityFixSuggestion;
    private estimateEffort;
    private getMigrationSteps;
    private getMigrationRisks;
}
//# sourceMappingURL=legacy-scanner.d.ts.map