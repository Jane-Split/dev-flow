// src/testing/test-runner.ts
import { exec } from 'node:child_process';
import { promisify } from 'node:util';
const execAsync = promisify(exec);
export class TestRunner {
    projectRoot;
    constructor(projectRoot) {
        this.projectRoot = projectRoot;
    }
    async runTests(testCases) {
        const results = [];
        for (const testCase of testCases) {
            const result = await this.runTest(testCase);
            results.push(result);
        }
        return results;
    }
    async runTest(testCase) {
        const startTime = Date.now();
        try {
            const { stdout, stderr } = await execAsync(`npx vitest run ${testCase.file} --reporter=json`, { cwd: this.projectRoot });
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
        }
        catch (error) {
            return {
                testCaseId: testCase.id,
                passed: false,
                duration: Date.now() - startTime,
                error: String(error),
            };
        }
    }
    async runAllTests() {
        try {
            const { stdout } = await execAsync('npx vitest run --reporter=json', { cwd: this.projectRoot });
            // 解析JSON输出
            const result = JSON.parse(stdout);
            return result.testResults?.map((r) => ({
                testCaseId: r.name,
                passed: r.status === 'passed',
                duration: r.duration,
                output: r.message,
            })) || [];
        }
        catch (error) {
            return [{
                    testCaseId: 'all',
                    passed: false,
                    duration: 0,
                    error: String(error),
                }];
        }
    }
}
//# sourceMappingURL=test-runner.js.map