import type { MemoryManager } from '../memory/index.js';
import type { ComponentInfo, ApiEndpoint, DataModel } from '../memory/types.js';
export interface ContextLink {
    type: 'component' | 'api' | 'model' | 'util';
    name: string;
    path: string;
    relation: 'reuse' | 'modify' | 'depend' | 'conflict';
    description: string;
}
export interface ContextLinkResult {
    links: ContextLink[];
    relatedComponents: ComponentInfo[];
    relatedApis: ApiEndpoint[];
    relatedModels: DataModel[];
    suggestions: string[];
}
export declare class ContextLinker {
    private memory;
    constructor(memory: MemoryManager);
    link(requirement: string): Promise<ContextLinkResult>;
    private findRelatedComponents;
    private findRelatedApis;
    private findRelatedModels;
    private extractKeywords;
}
//# sourceMappingURL=context-linker.d.ts.map