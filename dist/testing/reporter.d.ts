import type { TestResult } from './test-runner.js';
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
export declare class Reporter {
    private projectRoot;
    constructor(projectRoot: string);
    generateReport(results: TestResult[]): Promise<TestReport>;
    private writeReportDocument;
}
//# sourceMappingURL=reporter.d.ts.map