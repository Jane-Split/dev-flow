import type { ComponentInfo } from '../memory/types.js';
export declare class ComponentScanner {
    private projectRoot;
    constructor(projectRoot: string);
    scan(): Promise<ComponentInfo[]>;
    private extractComponentInfo;
    private extractComponentName;
    private detectComponentType;
    private extractProps;
    private extractEvents;
    private extractDescription;
    private extractDependencies;
    private generateId;
}
//# sourceMappingURL=component-scanner.d.ts.map