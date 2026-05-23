import type { TestCase } from './test-generator.js';
export interface TestResult {
    testCaseId: string;
    passed: boolean;
    duration: number;
    error?: string;
    output?: string;
}
export declare class TestRunner {
    private projectRoot;
    constructor(projectRoot: string);
    runTests(testCases: TestCase[]): Promise<TestResult[]>;
    private runTest;
    runAllTests(): Promise<TestResult[]>;
}
//# sourceMappingURL=test-runner.d.ts.map