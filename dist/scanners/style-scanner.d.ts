import type { StyleSystem } from '../memory/types.js';
export declare class StyleScanner {
    private projectRoot;
    constructor(projectRoot: string);
    scan(): Promise<StyleSystem>;
    private detectSolution;
    private extractTheme;
    private parseColors;
    private extractTokens;
    private inferTokenType;
}
//# sourceMappingURL=style-scanner.d.ts.map