import type { ProjectStructure } from '../memory/types.js';
export declare class StructureScanner {
    private projectRoot;
    constructor(projectRoot: string);
    scan(): Promise<ProjectStructure>;
    private scanDirectories;
    private findEntryFiles;
    private extractRoutes;
    private extractJavaRoutes;
    private extractPythonRoutes;
    private fileToRoute;
}
//# sourceMappingURL=structure-scanner.d.ts.map