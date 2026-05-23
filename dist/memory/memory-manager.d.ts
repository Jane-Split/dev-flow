import type { MemoryKey, ProjectMeta, ProjectStructure, CodingConvention, ComponentInfo, ApiEndpoint, DataModel, UtilityFunction, StyleSystem, LearnedPattern, FeedbackRecord } from './types.js';
export declare class MemoryManager {
    private fileStore;
    private dbStore;
    private vectorIndex;
    private projectRoot;
    constructor(projectRoot: string);
    getProjectMeta(): Promise<ProjectMeta | null>;
    setProjectMeta(meta: ProjectMeta): Promise<void>;
    getStructure(): Promise<ProjectStructure | null>;
    setStructure(structure: ProjectStructure): Promise<void>;
    getConventions(): Promise<CodingConvention[] | null>;
    setConventions(conventions: CodingConvention[]): Promise<void>;
    getComponents(): Promise<ComponentInfo[] | null>;
    setComponents(components: ComponentInfo[]): Promise<void>;
    getApis(): Promise<ApiEndpoint[] | null>;
    setApis(apis: ApiEndpoint[]): Promise<void>;
    getModels(): Promise<DataModel[] | null>;
    setModels(models: DataModel[]): Promise<void>;
    getUtils(): Promise<UtilityFunction[] | null>;
    setUtils(utils: UtilityFunction[]): Promise<void>;
    getStyles(): Promise<StyleSystem | null>;
    setStyles(styles: StyleSystem): Promise<void>;
    getPatterns(): Promise<LearnedPattern[] | null>;
    setPatterns(patterns: LearnedPattern[]): Promise<void>;
    addPattern(pattern: LearnedPattern): Promise<void>;
    addFeedback(feedback: Omit<FeedbackRecord, 'id'>): void;
    getFeedback(limit?: number): any[];
    search(query: string, options?: {
        limit?: number;
        type?: 'component' | 'api' | 'util';
    }): Promise<any[]>;
    read<T>(key: MemoryKey): Promise<T | null>;
    write<T>(key: MemoryKey, data: T): Promise<void>;
    hasMemory(): Promise<boolean>;
    close(): void;
}
//# sourceMappingURL=memory-manager.d.ts.map