// src/analyzers/requirement-parser.ts
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileExists } from '../utils/fs-utils.js';

export interface ParsedRequirement {
  raw: string;
  type: 'feature' | 'modification' | 'refactor' | 'bugfix' | 'optimization';
  title: string;
  description: string;
  constraints: string[];
  priority: 'P0' | 'P1' | 'P2';
  source?: string;
}

export class RequirementParser {
  async parse(input: string, projectRoot: string): Promise<ParsedRequirement> {
    let raw = input;
    let source: string | undefined;

    // 检查是否是文件路径
    if (input.endsWith('.md') || input.endsWith('.txt')) {
      const filePath = path.join(projectRoot, input);
      if (await fileExists(filePath)) {
        raw = await fs.readFile(filePath, 'utf-8');
        source = input;
      }
    }

    const type = this.detectType(raw);
    const title = this.extractTitle(raw);
    const description = this.extractDescription(raw);
    const constraints = this.extractConstraints(raw);
    const priority = this.detectPriority(raw);

    return {
      raw,
      type,
      title,
      description,
      constraints,
      priority,
      source,
    };
  }

  private detectType(content: string): ParsedRequirement['type'] {
    const lower = content.toLowerCase();

    if (lower.includes('bug') || lower.includes('修复') || lower.includes('fix')) {
      return 'bugfix';
    }
    if (lower.includes('refactor') || lower.includes('重构')) {
      return 'refactor';
    }
    if (lower.includes('optimiz') || lower.includes('优化') || lower.includes('性能')) {
      return 'optimization';
    }
    if (lower.includes('修改') || lower.includes('update') || lower.includes('change')) {
      return 'modification';
    }
    return 'feature';
  }

  private extractTitle(content: string): string {
    // 尝试提取标题
    const lines = content.split('\n').filter(l => l.trim());

    // Markdown标题
    const h1Match = lines.find(l => l.startsWith('# '));
    if (h1Match) {
      return h1Match.replace(/^#\s+/, '').trim();
    }

    // 第一行作为标题
    if (lines.length > 0) {
      const firstLine = lines[0].trim();
      if (firstLine.length < 100) {
        return firstLine;
      }
      return firstLine.slice(0, 50) + '...';
    }

    return '未命名需求';
  }

  private extractDescription(content: string): string {
    // 移除标题行，提取描述
    const lines = content.split('\n');
    const descLines: string[] = [];
    let foundTitle = false;

    for (const line of lines) {
      if (line.startsWith('# ')) {
        foundTitle = true;
        continue;
      }
      if (foundTitle) {
        descLines.push(line);
      }
    }

    return descLines.join('\n').trim() || content;
  }

  private extractConstraints(content: string): string[] {
    const constraints: string[] = [];

    // 查找约束关键词
    const patterns = [
      /必须[：:]\s*(.+)/g,
      /约束[：:]\s*(.+)/g,
      /限制[：:]\s*(.+)/g,
      /constraint[：:]\s*(.+)/gi,
      /must[：:]\s*(.+)/gi,
    ];

    for (const pattern of patterns) {
      const matches = content.matchAll(pattern);
      for (const match of matches) {
        constraints.push(match[1].trim());
      }
    }

    return constraints;
  }

  private detectPriority(content: string): ParsedRequirement['priority'] {
    const lower = content.toLowerCase();

    if (lower.includes('p0') || lower.includes('紧急') || lower.includes('urgent')) {
      return 'P0';
    }
    if (lower.includes('p2') || lower.includes('低优先级') || lower.includes('low priority')) {
      return 'P2';
    }
    return 'P1';
  }
}
