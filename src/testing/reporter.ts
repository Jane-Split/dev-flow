// src/testing/reporter.ts
import type { TestResult } from './test-runner.js';
import { writeText } from '../utils/fs-utils.js';
import path from 'node:path';

export interface TestReport {
  summary: {
    total: number;
    passed: number;
    failed: number;
    duration: number;
  };
  results: TestResult[];
  documentPath: string;
}

export class Reporter {
  private projectRoot: string;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
  }

  async generateReport(results: TestResult[]): Promise<TestReport> {
    const summary = {
      total: results.length,
      passed: results.filter(r => r.passed).length,
      failed: results.filter(r => !r.passed).length,
      duration: results.reduce((sum, r) => sum + r.duration, 0),
    };

    const documentPath = await this.writeReportDocument(results, summary);

    return {
      summary,
      results,
      documentPath,
    };
  }

  private async writeReportDocument(results: TestResult[], summary: any): Promise<string> {
    const doc = `# 测试报告

## 概览
- **总用例数**: ${summary.total}
- **通过**: ${summary.passed}
- **失败**: ${summary.failed}
- **耗时**: ${summary.duration}ms

## 测试结果
| 用例ID | 状态 | 耗时 | 错误信息 |
|--------|------|------|----------|
${results.map(r => `| ${r.testCaseId} | ${r.passed ? '✅ 通过' : '❌ 失败'} | ${r.duration}ms | ${r.error || '-'} |`).join('\n')}

## 失败详情
${results.filter(r => !r.passed).map(r => `
### ${r.testCaseId}
- **错误**: ${r.error || '未知错误'}
- **输出**: 
\`\`\`
${r.output || '无输出'}
\`\`\`
`).join('\n') || '无失败用例'}
`;

    const sessionsDir = path.join(this.projectRoot, '.dev-flow', 'sessions');
    const docPath = path.join(sessionsDir, `test-report-${Date.now()}.md`);
    await writeText(docPath, doc);
    return docPath;
  }
}
