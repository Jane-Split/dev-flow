export interface BrowserTestConfig {
    url: string;
    actions: BrowserAction[];
    assertions: BrowserAssertion[];
}
export interface BrowserAction {
    type: 'click' | 'type' | 'select' | 'wait' | 'navigate';
    selector?: string;
    value?: string;
    timeout?: number;
}
export interface BrowserAssertion {
    type: 'visible' | 'text' | 'url' | 'title';
    selector?: string;
    expected?: string;
}
export interface BrowserTestResult {
    passed: boolean;
    screenshot?: string;
    error?: string;
    duration: number;
}
export declare class BrowserTester {
    private projectRoot;
    constructor(projectRoot: string);
    runTest(config: BrowserTestConfig): Promise<BrowserTestResult>;
    private executeAction;
    private verifyAssertion;
}
//# sourceMappingURL=browser-tester.d.ts.map