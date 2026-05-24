/**
 * 老旧项目分析 Agent - 深度分析老旧项目的技术栈、复杂度和技术债务
 *
 * 职责:
 * - 执行老旧项目全面扫描
 * - 生成分析报告
 * - 提供迁移建议和风险评估
 */

import { BaseAgent, type AgentContext, type AgentResult } from './base-agent.js';
import { LegacyScanner, type LegacyAnalysisResult } from '../scanners/legacy-scanner.js';
import { writeText } from '../utils/fs-utils.js';
import * as path from 'node:path';

/** LegacyAnalyzer 输出结果 */
export interface LegacyAnalyzerResult {
  analysis: LegacyAnalysisResult;
  reportPath: string;
}

export class LegacyAnalyzer extends BaseAgent {
  constructor(context: AgentContext) {
    super('LegacyAnalyzer', context);
  }

  async execute(options?: { module?: string; techDebt?: boolean; complexity?: boolean }): Promise<AgentResult<LegacyAnalyzerResult>> {
    this.log('开始老旧项目分析...');

    try {
      const scanner = new LegacyScanner(this.getProjectRoot());
      const analysis = await scanner.scan();

      // 生成分析报告
      const reportContent = this.generateReport(analysis);
      const reportPath = path.join(this.getProjectRoot(), '.dev-flow', 'legacy-analysis.md');
      await writeText(reportPath, reportContent);

      this.log(`分析完成 - 老旧评分: ${analysis.legacyScore}/100`);

      return {
        success: true,
        data: {
          analysis,
          reportPath,
        },
        artifacts: [reportPath],
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : '分析过程中发生未知错误';
      this.log(`分析失败: ${message}`);
      return {
        success: false,
        error: message,
      };
    }
  }

  /**
   * 生成分析报告
   */
  private generateReport(analysis: LegacyAnalysisResult): string {
    const lines: string[] = [
      '# 老旧项目分析报告',
      '',
      `> 分析时间: ${new Date().toISOString().split('T')[0]}`,
      `> 老旧评分: ${analysis.legacyScore}/100`,
      `> 是否老旧项目: ${analysis.isLegacy ? '是' : '否'}`,
      '',
      '## 概要',
      '',
      analysis.summary,
      '',
    ];

    // 技术栈
    if (analysis.techStacks.length > 0) {
      lines.push('## 检测到的老旧技术栈', '');
      lines.push('| 技术栈 | 版本 | 置信度 | 文件数 | 迁移目标 |');
      lines.push('|--------|------|--------|--------|----------|');
      for (const tech of analysis.techStacks) {
        lines.push(
          `| ${tech.label} | ${tech.version} | ${tech.confidence}% | ${tech.files.length} | ${tech.migrationTargets.join(', ')} |`
        );
      }
      lines.push('');
    }

    // 代码复杂度
    lines.push('## 代码复杂度', '');
    lines.push(`- 平均圈复杂度: ${analysis.complexity.average}`);
    lines.push(`- 高复杂度热点文件: ${analysis.complexity.hotspots.length}`);
    if (analysis.complexity.hotspots.length > 0) {
      lines.push('');
      lines.push('| 文件 | 复杂度 | 行数 | 风险等级 |');
      lines.push('|------|--------|------|----------|');
      for (const hotspot of analysis.complexity.hotspots.slice(0, 10)) {
        lines.push(`| ${hotspot.file} | ${hotspot.complexity} | ${hotspot.lines} | ${hotspot.risk} |`);
      }
    }
    lines.push('');

    // 技术债务
    if (analysis.techDebts.length > 0) {
      lines.push('## 技术债务', '');
      lines.push(`共 ${analysis.techDebts.length} 项`, '');
      const severityGroups = {
        critical: analysis.techDebts.filter(d => d.severity === 'critical'),
        high: analysis.techDebts.filter(d => d.severity === 'high'),
        medium: analysis.techDebts.filter(d => d.severity === 'medium'),
        low: analysis.techDebts.filter(d => d.severity === 'low'),
      };

      for (const [severity, debts] of Object.entries(severityGroups)) {
        if (debts.length === 0) continue;
        const label = { critical: '严重', high: '高', medium: '中', low: '低' }[severity]!;
        lines.push(`### ${label} (${debts.length}项)`, '');
        for (const debt of debts) {
          lines.push(`- **[${debt.type}]** ${debt.description}`);
          if (debt.suggestion) lines.push(`  - 建议: ${debt.suggestion}`);
        }
        lines.push('');
      }
    }

    // 迁移路径
    if (analysis.migrationPaths.length > 0) {
      lines.push('## 推荐迁移路径', '');
      lines.push('| 从 | 到 | 难度 | 预计工作量 |');
      lines.push('|----|----|------|-----------|');
      for (const mp of analysis.migrationPaths) {
        lines.push(`| ${mp.from} | ${mp.to} | ${mp.difficulty} | ${mp.estimatedEffort} |`);
      }
      lines.push('');
    }

    // 建议
    if (analysis.recommendations.length > 0) {
      lines.push('## 建议', '');
      for (const rec of analysis.recommendations) {
        lines.push(`- ${rec}`);
      }
      lines.push('');
    }

    return lines.join('\n');
  }
}
