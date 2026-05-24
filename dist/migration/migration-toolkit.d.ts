/**
 * 迁移工具集 - 提供代码迁移的核心工具函数
 *
 * 能力:
 * - 代码模式匹配和转换
 * - 代码复杂度评估
 * - 迁移安全检查
 * - 迁移进度追踪
 */
import type { MigrationTemplate } from './migration-templates.js';
/** 单文件迁移结果 */
export interface FileMigrationResult {
    sourceFile: string;
    targetFile: string;
    appliedPatterns: string[];
    skippedPatterns: string[];
    success: boolean;
    warnings: string[];
}
/** 模块迁移结果 */
export interface ModuleMigrationResult {
    moduleName: string;
    files: FileMigrationResult[];
    totalPatterns: number;
    appliedPatterns: number;
    success: boolean;
    summary: string;
}
/** 迁移配置 */
export interface MigrationConfig {
    from: string;
    to: string;
    sourceDir: string;
    targetDir: string;
    module?: string;
    dryRun?: boolean;
    backup?: boolean;
}
/** 代码片段 */
export interface CodeSnippet {
    file: string;
    startLine: number;
    endLine: number;
    content: string;
}
export declare class MigrationToolkit {
    private config;
    private template;
    constructor(config: MigrationConfig);
    /**
     * 获取当前迁移模板信息
     */
    getTemplate(): MigrationTemplate | null;
    /**
     * 分析源文件中的老旧代码模式
     */
    analyzeFile(filePath: string): Promise<CodeSnippet[]>;
    /**
     * 迁移单个文件
     */
    migrateFile(filePath: string): Promise<FileMigrationResult>;
    /**
     * 生成迁移报告
     */
    generateReport(results: FileMigrationResult[]): string;
    /**
     * 将 legacy 模式字符串转为正则表达式
     */
    private patternToRegex;
}
//# sourceMappingURL=migration-toolkit.d.ts.map