/**
 * 老旧项目迁移 Agent - 执行渐进式代码迁移
 *
 * 职责:
 * - 根据迁移配置执行代码迁移
 * - 支持按模块逐步迁移
 * - 生成迁移报告
 */

import { BaseAgent, type AgentContext, type AgentResult } from './base-agent.js';
import { MigrationToolkit, type MigrationConfig, type FileMigrationResult } from '../migration/migration-toolkit.js';
import { writeText } from '../utils/fs-utils.js';
import * as path from 'node:path';
import { glob } from 'glob';

/** LegacyMigrator 输出结果 */
export interface LegacyMigratorResult {
  from: string;
  to: string;
  migratedFiles: FileMigrationResult[];
  reportPath: string;
  summary: string;
}

export class LegacyMigrator extends BaseAgent {
  constructor(context: AgentContext) {
    super('LegacyMigrator', context);
  }

  async execute(
    options: {
      from: string;
      to: string;
      sourceDir?: string;
      targetDir?: string;
      module?: string;
      dryRun?: boolean;
    }
  ): Promise<AgentResult<LegacyMigratorResult>> {
    const { from, to, module, dryRun = false } = options;

    this.log(`开始迁移: ${from} → ${to}`);

    try {
      const projectRoot = this.getProjectRoot();
      const sourceDir = options.sourceDir || projectRoot;
      const targetDir = options.targetDir || path.join(projectRoot, 'migrated');

      // 创建迁移工具
      const config: MigrationConfig = {
        from,
        to,
        sourceDir,
        targetDir,
        module,
        dryRun,
        backup: true,
      };

      const toolkit = new MigrationToolkit(config);
      const template = toolkit.getTemplate();

      if (!template) {
        return {
          success: false,
          error: `未找到迁移模板: ${from} → ${to}。支持的路径: jquery-to-react, jquery-to-vue, angularjs-to-angular, php-to-node`,
        };
      }

      // 查找需要迁移的文件
      const files = await this.findMigratableFiles(sourceDir, module);

      if (files.length === 0) {
        return {
          success: false,
          error: `未找到需要迁移的文件${module ? ` (模块: ${module})` : ''}`,
        };
      }

      this.log(`找到 ${files.length} 个文件需要迁移`);

      // 逐文件迁移
      const results: FileMigrationResult[] = [];
      for (const file of files) {
        this.log(`迁移文件: ${file}`);
        const result = await toolkit.migrateFile(file);
        results.push(result);
      }

      // 生成迁移报告
      const reportContent = toolkit.generateReport(results);
      const reportPath = path.join(projectRoot, '.dev-flow', `migration-${from}-to-${to}.md`);
      await writeText(reportPath, reportContent);

      const successCount = results.filter(r => r.success).length;
      const summary = `迁移完成: ${successCount}/${results.length} 个文件成功`;

      this.log(summary);

      return {
        success: successCount > 0,
        data: {
          from,
          to,
          migratedFiles: results,
          reportPath,
          summary,
        },
        artifacts: [reportPath],
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : '迁移过程中发生未知错误';
      this.log(`迁移失败: ${message}`);
      return {
        success: false,
        error: message,
      };
    }
  }

  /**
   * 查找可迁移的文件
   */
  private async findMigratableFiles(sourceDir: string, module?: string): Promise<string[]> {
    const patterns = [
      '**/*.{js,jsx,ts,tsx,vue,php,html,htm}',
    ];

    const files: string[] = [];
    for (const pattern of patterns) {
      const matches = await glob(pattern, {
        cwd: sourceDir,
        ignore: [
          'node_modules/**', 'dist/**', 'build/**', 'vendor/**',
          '.git/**', 'coverage/**', 'migrated/**',
        ],
      });
      files.push(...matches);
    }

    // 如果指定了模块，过滤文件
    if (module) {
      return files.filter(f => f.toLowerCase().includes(module.toLowerCase()));
    }

    return files;
  }
}
