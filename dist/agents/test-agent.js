// src/agents/test-agent.ts
import { BaseAgent } from './base-agent.js';
import { TestGenerator, TestRunner, Reporter } from '../testing/index.js';
import { logger } from '../utils/logger.js';
export class TestAgent extends BaseAgent {
    constructor(context) {
        super('TestAgent', context);
    }
    async execute(developResult) {
        try {
            logger.title('测试验证');
            const projectRoot = this.getProjectRoot();
            // Step 1: 生成测试用例
            logger.step(1, 4, '生成测试用例...');
            const generator = new TestGenerator();
            const testCases = await generator.generate(developResult.completedTasks, projectRoot);
            await generator.writeTestFiles(testCases, projectRoot);
            logger.success(`生成 ${testCases.length} 个测试用例`);
            // Step 2: 执行测试
            logger.step(2, 4, '执行测试...');
            const runner = new TestRunner(projectRoot);
            const results = await runner.runTests(testCases);
            logger.success(`执行完成: ${results.filter(r => r.passed).length}/${results.length} 通过`);
            // Step 3: 生成报告
            logger.step(3, 4, '生成测试报告...');
            const reporter = new Reporter(projectRoot);
            const report = await reporter.generateReport(results);
            logger.success(`报告已保存: ${report.documentPath}`);
            // Step 4: 识别Bug
            logger.step(4, 4, '识别Bug...');
            const bugs = results
                .filter(r => !r.passed)
                .map(r => ({
                id: r.testCaseId,
                description: r.error || '测试失败',
                file: testCases.find(t => t.id === r.testCaseId)?.file || '',
                type: 'logic',
            }));
            logger.info(`发现 ${bugs.length} 个Bug`);
            return {
                success: bugs.length === 0,
                data: {
                    testReport: report,
                    bugs,
                },
                artifacts: [report.documentPath],
            };
        }
        catch (error) {
            return { success: false, error: String(error) };
        }
    }
}
//# sourceMappingURL=test-agent.js.map