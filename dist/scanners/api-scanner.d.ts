import type { ApiEndpoint, DataModel } from '../memory/types.js';
export declare class ApiScanner {
    private projectRoot;
    constructor(projectRoot: string);
    scanEndpoints(): Promise<ApiEndpoint[]>;
    scanModels(): Promise<DataModel[]>;
    private extractEndpoints;
    private extractModels;
    private parseFields;
}
//# sourceMappingURL=api-scanner.d.ts.map