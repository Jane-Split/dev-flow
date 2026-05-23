import type { UtilityFunction } from '../memory/types.js';
export declare class UtilScanner {
    private projectRoot;
    constructor(projectRoot: string);
    scanFunctions(): Promise<UtilityFunction[]>;
    scanHooks(): Promise<UtilityFunction[]>;
    private extractFunctions;
    private extractHooks;
    private extractDescription;
    private parseParameters;
}
//# sourceMappingURL=util-scanner.d.ts.map