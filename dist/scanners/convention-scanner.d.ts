import type { CodingConvention } from '../memory/types.js';
export declare class ConventionScanner {
    private projectRoot;
    constructor(projectRoot: string);
    scan(): Promise<CodingConvention[]>;
    private scanEslint;
    private scanTsconfig;
    private inferNamingConventions;
}
//# sourceMappingURL=convention-scanner.d.ts.map