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
import { readText, writeText, fileExists } from '../utils/fs-utils.js';
import * as path from 'node:path';
import { glob } from 'glob';

/** 重构选项 */
export interface RefactorOptions {
  module?: string;
  safe?: boolean;      // 安全模式（保守重构）
  target?: string;     // 目标文件
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

export class LegacyRefactor extends BaseAgent {
  constructor(context: AgentContext) {
    super('LegacyRefactor', context);
  }

  async execute(options?: RefactorOptions): Promise<AgentResult<LegacyRefactorResult>> {
    this.log('开始老旧项目安全重构分析...');

    try {
      const projectRoot = this.getProjectRoot();
      const files = await this.findRefactorableFiles(options?.module);

      if (files.length === 0) {
        return {
          success: false,
          error: `未找到可重构的文件${options?.module ? ` (模块: ${options.module})` : ''}`,
        };
      }

      // 分析每个文件，生成重构建议
      const suggestions: RefactorSuggestion[] = [];
      for (const file of files) {
        const filePath = path.join(projectRoot, file);
        try {
          const content = await readText(filePath);
          const fileSuggestions = this.analyzeForRefactoring(file, content, options?.safe);
          suggestions.push(...fileSuggestions);
        } catch {
          // 跳过无法读取的文件
        }
      }

      // 按风险排序
      suggestions.sort((a, b) => {
        const riskOrder = { low: 0, medium: 1, high: 2 };
        return riskOrder[a.risk] - riskOrder[b.risk];
      });

      // 生成重构报告
      const reportContent = this.generateReport(suggestions, options);
      const reportPath = path.join(projectRoot, '.dev-flow', 'legacy-refactor.md');
      await writeText(reportPath, reportContent);

      const summary = `分析完成: ${suggestions.length} 条重构建议 (${suggestions.filter(s => s.risk === 'low').length} 低风险)`;

      this.log(summary);

      return {
        success: true,
        data: {
          suggestions,
          refactoredFiles: [],
          reportPath,
          summary,
        },
        artifacts: [reportPath],
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : '重构分析过程中发生未知错误';
      this.log(`重构分析失败: ${message}`);
      return {
        success: false,
        error: message,
      };
    }
  }

  /**
   * 分析文件，生成重构建议
   */
  private analyzeForRefactoring(
    filePath: string,
    content: string,
    safeMode?: boolean
  ): RefactorSuggestion[] {
    const suggestions: RefactorSuggestion[] = [];
    const lines = content.split('\n');

    // 1. 检测过长函数
    const functionBlocks = this.extractFunctionBlocks(content);
    for (const block of functionBlocks) {
      if (block.lines > 50) {
        suggestions.push({
          file: filePath,
          type: 'extract-function',
          description: `函数 "${block.name}" 过长 (${block.lines}行)，建议拆分为多个小函数`,
          effort: 'medium',
          risk: 'medium',
        });
      }
    }

    // 2. 检测深层嵌套 - 基于花括号深度追踪
    let maxNesting = 0;
    let currentNesting = 0;
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.length === 0) continue;

      const openBraces = (line.match(/{/g) || []).length;
      const closeBraces = (line.match(/}/g) || []).length;
      const isControlFlow = /\b(if|for|while|switch|try)\b/.test(trimmed);

      if (isControlFlow && openBraces > 0) {
        currentNesting += openBraces;
        maxNesting = Math.max(maxNesting, currentNesting);
      } else if (openBraces > 0) {
        currentNesting += openBraces;
      }

      currentNesting -= closeBraces;
      currentNesting = Math.max(0, currentNesting);
    }
    if (maxNesting >= 4) {
      suggestions.push({
        file: filePath,
        type: 'simplify-condition',
        description: `检测到深层嵌套 (最大 ${maxNesting} 层)，建议使用提前返回或提取方法`,
        effort: 'medium',
        risk: 'low',
      });
    }

    // 3. 检测重复代码
    const codeBlocks = lines.map(l => l.trim()).filter(l => l.length > 20);
    const blockCounts = new Map<string, number>();
    for (const block of codeBlocks) {
      blockCounts.set(block, (blockCounts.get(block) || 0) + 1);
    }
    for (const [block, count] of blockCounts) {
      if (count >= 3) {
        suggestions.push({
          file: filePath,
          type: 'remove-duplication',
          description: `检测到重复代码块 (${count}次): "${block.substring(0, 50)}..."`,
          effort: 'low',
          risk: 'low',
        });
      }
    }

    // 4. 检测魔术数字
    const magicNumbers = content.match(/(?<![.\w])(?:[3-9]\d{2,}|1\d{3,})(?!\w*[.])/g);
    if (magicNumbers && magicNumbers.length > 3) {
      suggestions.push({
        file: filePath,
        type: 'rename',
        description: `检测到 ${magicNumbers.length} 个魔术数字，建议提取为命名常量`,
        effort: 'low',
        risk: 'low',
      });
    }

    // 5. 检测过长参数列表
    for (const block of functionBlocks) {
      const paramMatch = block.signature.match(/\(([^)]+)\)/);
      if (paramMatch) {
        const params = paramMatch[1].split(',').filter(p => p.trim());
        if (params.length > 5) {
          suggestions.push({
            file: filePath,
            type: 'extract-class',
            description: `函数 "${block.name}" 参数过多 (${params.length}个)，建议封装为参数对象`,
            effort: 'medium',
            risk: 'medium',
          });
        }
      }
    }

    // 安全模式下过滤高风险建议
    if (safeMode) {
      return suggestions.filter(s => s.risk === 'low');
    }

    return suggestions;
  }

  /**
   * 提取函数块
   */
  private extractFunctionBlocks(content: string): Array<{ name: string; lines: number; signature: string }> {
    const blocks: Array<{ name: string; lines: number; signature: string }> = [];

    // 匹配函数声明
    const funcRegex = /(?:function\s+(\w+)|(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?(?:function|\([^)]*\)\s*=>))\s*\(([^)]*)\)/g;
    let match;

    while ((match = funcRegex.exec(content)) !== null) {
      const name = match[1] || match[2] || 'anonymous';
      const signature = match[0];

      // 简单估算函数行数（到下一个同级函数或文件末尾）
      const startPos = match.index;
      const remaining = content.substring(startPos + signature.length);
      const braceCount = (remaining.match(/{/g) || []).length;
      let lines = 1;
      let depth = 0;
      let found = false;

      for (const char of remaining) {
        if (char === '{') depth++;
        if (char === '}') depth--;
        if (char === '\n') lines++;
        if (depth === 0 && found) break;
        if (depth > 0) found = true;
      }

      blocks.push({ name, lines, signature });
    }

    return blocks;
  }

  /**
   * 查找可重构的文件
   */
  private async findRefactorableFiles(module?: string): Promise<string[]> {
    const patterns = ['**/*.{js,jsx,ts,tsx,php,py,java,rb}'];
    const files: string[] = [];

    for (const pattern of patterns) {
      const matches = await glob(pattern, {
        cwd: this.getProjectRoot(),
        ignore: [
          'node_modules/**', 'dist/**', 'build/**', 'vendor/**',
          '.git/**', 'coverage/**', 'migrated/**',
        ],
      });
      files.push(...matches);
    }

    if (module) {
      return files.filter(f => f.toLowerCase().includes(module.toLowerCase()));
    }

    return files;
  }

  /**
   * 生成重构报告
   */
  private generateReport(suggestions: RefactorSuggestion[], options?: RefactorOptions): string {
    const lines: string[] = [
      '# 老旧项目安全重构报告',
      '',
      `> 分析时间: ${new Date().toISOString().split('T')[0]}`,
      `> 分析模式: ${options?.safe ? '安全模式（仅低风险）' : '标准模式'}`,
      `> 总建议数: ${suggestions.length}`,
      '',
    ];

    // 按类型分组
    const typeGroups = new Map<string, RefactorSuggestion[]>();
    for (const s of suggestions) {
      const group = typeGroups.get(s.type) || [];
      group.push(s);
      typeGroups.set(s.type, group);
    }

    const typeLabels: Record<string, string> = {
      'extract-function': '提取函数',
      'extract-class': '提取类',
      'simplify-condition': '简化条件',
      'rename': '重命名',
      'decompose': '分解模块',
      'remove-duplication': '消除重复',
    };

    for (const [type, items] of typeGroups) {
      lines.push(`## ${typeLabels[type] || type} (${items.length}项)`, '');
      for (const item of items) {
        const riskIcon = { low: '🟢', medium: '🟡', high: '🔴' }[item.risk];
        lines.push(`- ${riskIcon} **${item.file}**: ${item.description}`);
        lines.push(`  - 工作量: ${item.effort} | 风险: ${item.risk}`);
      }
      lines.push('');
    }

    // 优先级建议
    lines.push('## 推荐执行顺序', '');
    const lowRisk = suggestions.filter(s => s.risk === 'low');
    if (lowRisk.length > 0) {
      lines.push('### 第一批（低风险，可立即执行）', '');
      for (const s of lowRisk.slice(0, 5)) {
        lines.push(`1. ${s.description} (${s.file})`);
      }
      lines.push('');
    }

    return lines.join('\n');
  }
}
