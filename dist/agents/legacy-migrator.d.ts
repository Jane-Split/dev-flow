/**
 * 老旧项目迁移 Agent - 执行渐进式代码迁移
 *
 * 职责:
 * - 根据迁移配置执行代码迁移
 * - 支持按模块逐步迁移
 * - 生成迁移报告
 */
import { BaseAgent, type AgentContext, type AgentResult } from './base-agent.js';
import { type FileMigrationResult } from '../migration/migration-toolkit.js';
/** LegacyMigrator 输出结果 */
export interface LegacyMigratorResult {
    from: string;
    to: string;
    migratedFiles: FileMigrationResult[];
    reportPath: string;
    summary: string;
}
export declare class LegacyMigrator extends BaseAgent {
    constructor(context: AgentContext);
    execute(options: {
        from: string;
        to: string;
        sourceDir?: string;
        targetDir?: string;
        module?: string;
        dryRun?: boolean;
    }): Promise<AgentResult<LegacyMigratorResult>>;
    /**
     * 查找可迁移的文件
     */
    private findMigratableFiles;
}
//# sourceMappingURL=legacy-migrator.d.ts.map