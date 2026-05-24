/**
 * 迁移工具集 - 提供代码迁移的核心工具函数
 *
 * 能力:
 * - 代码模式匹配和转换
 * - 代码复杂度评估
 * - 迁移安全检查
 * - 迁移进度追踪
 */
import * as path from 'node:path';
import { readText, writeText } from '../utils/fs-utils.js';
import { getMigrationTemplate } from './migration-templates.js';
// ─── MigrationToolkit ─────────────────────────────────────
export class MigrationToolkit {
    config;
    template;
    constructor(config) {
        this.config = config;
        this.template = getMigrationTemplate(config.from, config.to);
    }
    /**
     * 获取当前迁移模板信息
     */
    getTemplate() {
        return this.template;
    }
    /**
     * 分析源文件中的老旧代码模式
     */
    async analyzeFile(filePath) {
        if (!this.template)
            return [];
        const fullPath = path.isAbsolute(filePath) ? filePath : path.join(this.config.sourceDir, filePath);
        const content = await readText(fullPath);
        const lines = content.split('\n');
        const snippets = [];
        for (const pattern of this.template.patterns) {
            // 将 legacy 模式转为正则
            const regex = this.patternToRegex(pattern.legacy);
            for (let i = 0; i < lines.length; i++) {
                if (regex.test(lines[i])) {
                    snippets.push({
                        file: filePath,
                        startLine: i + 1,
                        endLine: i + 1,
                        content: lines[i],
                    });
                }
            }
        }
        return snippets;
    }
    /**
     * 迁移单个文件
     */
    async migrateFile(filePath) {
        if (!this.template) {
            return {
                sourceFile: filePath,
                targetFile: '',
                appliedPatterns: [],
                skippedPatterns: [],
                success: false,
                warnings: ['未找到匹配的迁移模板'],
            };
        }
        const sourcePath = path.isAbsolute(filePath) ? filePath : path.join(this.config.sourceDir, filePath);
        const relativePath = path.relative(this.config.sourceDir, sourcePath);
        const targetPath = path.join(this.config.targetDir, relativePath);
        let content;
        try {
            content = await readText(sourcePath);
        }
        catch {
            return {
                sourceFile: filePath,
                targetFile: targetPath,
                appliedPatterns: [],
                skippedPatterns: [],
                success: false,
                warnings: [`无法读取源文件: ${sourcePath}`],
            };
        }
        const appliedPatterns = [];
        const skippedPatterns = [];
        const warnings = [];
        // 逐模式应用转换
        for (const pattern of this.template.patterns) {
            const regex = this.patternToRegex(pattern.legacy);
            if (regex.test(content)) {
                try {
                    content = content.replace(regex, pattern.modern);
                    appliedPatterns.push(pattern.description);
                }
                catch {
                    skippedPatterns.push(pattern.description);
                    warnings.push(`模式转换失败: ${pattern.description}`);
                }
            }
        }
        // dryRun 模式不写入文件
        if (!this.config.dryRun) {
            try {
                await writeText(targetPath, content);
            }
            catch {
                return {
                    sourceFile: filePath,
                    targetFile: targetPath,
                    appliedPatterns,
                    skippedPatterns,
                    success: false,
                    warnings: [`无法写入目标文件: ${targetPath}`],
                };
            }
        }
        return {
            sourceFile: filePath,
            targetFile: targetPath,
            appliedPatterns,
            skippedPatterns,
            success: true,
            warnings,
        };
    }
    /**
     * 生成迁移报告
     */
    generateReport(results) {
        const totalFiles = results.length;
        const successFiles = results.filter(r => r.success).length;
        const totalApplied = results.reduce((sum, r) => sum + r.appliedPatterns.length, 0);
        const totalSkipped = results.reduce((sum, r) => sum + r.skippedPatterns.length, 0);
        const allWarnings = results.flatMap(r => r.warnings);
        const lines = [
            '# 迁移报告',
            '',
            `**迁移路径**: ${this.config.from} → ${this.config.to}`,
            `**源目录**: ${this.config.sourceDir}`,
            `**目标目录**: ${this.config.targetDir}`,
            '',
            '## 概览',
            '',
            `| 指标 | 数值 |`,
            `|------|------|`,
            `| 总文件数 | ${totalFiles} |`,
            `| 成功迁移 | ${successFiles} |`,
            `| 失败文件 | ${totalFiles - successFiles} |`,
            `| 应用模式 | ${totalApplied} |`,
            `| 跳过模式 | ${totalSkipped} |`,
            '',
        ];
        if (allWarnings.length > 0) {
            lines.push('## 警告', '');
            for (const w of allWarnings) {
                lines.push(`- ⚠️ ${w}`);
            }
            lines.push('');
        }
        if (this.template) {
            lines.push('## 注意事项', '');
            for (const note of this.template.notes) {
                lines.push(`- 💡 ${note}`);
            }
            lines.push('');
            for (const warning of this.template.warnings) {
                lines.push(`- 🔴 ${warning}`);
            }
        }
        return lines.join('\n');
    }
    // ─── 辅助方法 ─────────────────────────────────────────
    /**
     * 将 legacy 模式字符串转为正则表达式
     */
    patternToRegex(pattern) {
        // 转义正则特殊字符，但保留已有的正则语法
        const escaped = pattern
            .replace(/[.+^${}()|[\]\\]/g, '\\$&')
            .replace(/\*/g, '.*')
            .replace(/\s+/g, '\\s+');
        try {
            return new RegExp(escaped, 'gm');
        }
        catch {
            // 如果正则创建失败，使用原始字符串
            return new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gm');
        }
    }
}
//# sourceMappingURL=migration-toolkit.js.map