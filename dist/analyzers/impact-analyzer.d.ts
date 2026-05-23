import type { ContextLink } from './context-linker.js';
export interface ImpactItem {
    type: 'file' | 'api' | 'model' | 'config' | 'database';
    path: string;
    operation: 'create' | 'modify' | 'delete';
    description: string;
    risk?: 'low' | 'medium' | 'high';
}
export interface ImpactResult {
    items: ImpactItem[];
    risks: string[];
    dependencies: string[];
}
export declare class ImpactAnalyzer {
    analyze(requirement: string, contextLinks: ContextLink[]): ImpactResult;
}
//# sourceMappingURL=impact-analyzer.d.ts.map