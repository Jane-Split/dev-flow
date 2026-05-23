import type { ProjectMeta } from '../memory/types.js';
export declare class DependencyScanner {
    private projectRoot;
    constructor(projectRoot: string);
    scan(): Promise<ProjectMeta>;
    private readPackageJson;
    private detectTechStack;
    private detectPackageManager;
    private detectBuildTool;
}
//# sourceMappingURL=dependency-scanner.d.ts.map