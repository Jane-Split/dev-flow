// src/testing/test-runner.ts
import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import type { TestCase } from './test-generator.js';

const execAsync = promisify(exec);

export interface TestResult {
  testCaseId: string;
  passed: boolean;
  duration: number;
  error?: string;
  output?: string;
}

export class TestRunner {
  private projectRoot: string;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
  }

  async runTests(testCases: TestCase[]): Promise<TestResult[]> {
    const results: TestResult[] = [];

    for (const testCase of testCases) {
      const result = await this.runTest(testCase);
      results.push(result);
    }

    return results;
  }

  private async runTest(testCase: TestCase): Promise<TestResult> {
    const startTime = Date.now();

    try {
      const { stdout, stderr } = await execAsync(
        `npx vitest run ${testCase.file} --reporter=json`,
        { cwd: this.projectRoot }
      );

      const duration = Date.now() - startTime;
      const output = stdout || stderr;

      // 解析结果
      const passed = !stderr && !output.includes('failed');

      return {
        testCaseId: testCase.id,
        passed,
        duration,
        output,
      };
    } catch (error) {
      return {
        testCaseId: testCase.id,
        passed: false,
        duration: Date.now() - startTime,
        error: String(error),
      };
    }
  }

  async runAllTests(): Promise<TestResult[]> {
    try {
      const { stdout } = await execAsync(
        'npx vitest run --reporter=json',
        { cwd: this.projectRoot }
      );

      // 解析JSON输出
      const result = JSON.parse(stdout);
      return result.testResults?.map((r: any) => ({
        testCaseId: r.name,
        passed: r.status === 'passed',
        duration: r.duration,
        output: r.message,
      })) || [];
    } catch (error) {
      return [{
        testCaseId: 'all',
        passed: false,
        duration: 0,
        error: String(error),
      }];
    }
  }
}
