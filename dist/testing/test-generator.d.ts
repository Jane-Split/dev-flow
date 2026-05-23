import type { Task } from '../planner/task-splitter.js';
export interface TestCase {
    id: string;
    name: string;
    type: 'unit' | 'api' | 'e2e';
    description: string;
    file: string;
    code: string;
}
export declare class TestGenerator {
    generate(tasks: Task[], projectRoot: string): Promise<TestCase[]>;
    private generateTestsForTask;
    private generateComponentTests;
    private generateApiTests;
    private generateModelTests;
    writeTestFiles(testCases: TestCase[], projectRoot: string): Promise<void>;
}
//# sourceMappingURL=test-generator.d.ts.map