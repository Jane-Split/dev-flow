export interface ProjectMeta {
    name: string;
    version: string;
    techStack: TechStack;
    packageManager: 'npm' | 'yarn' | 'pnpm';
    framework: string;
    buildTool: string;
    createdAt: string;
    updatedAt: string;
}
export interface TechStack {
    language: string;
    framework: string;
    uiLibrary?: string;
    stateManagement?: string;
    cssSolution?: string;
    testFramework?: string;
}
export interface ProjectStructure {
    root: string;
    directories: DirectoryNode[];
    entryFiles: string[];
    routes?: RouteInfo[];
}
export interface DirectoryNode {
    name: string;
    path: string;
    type: 'directory' | 'file';
    children?: DirectoryNode[];
    description?: string;
}
export interface RouteInfo {
    path: string;
    component: string;
    children?: RouteInfo[];
}
export interface CodingConvention {
    id: string;
    category: 'naming' | 'formatting' | 'structure' | 'git' | 'comment';
    name: string;
    description: string;
    examples: string[];
    severity: 'error' | 'warn' | 'info';
}
export interface ComponentInfo {
    id: string;
    name: string;
    type: 'page' | 'component' | 'layout' | 'widget';
    path: string;
    props: PropDefinition[];
    events: EventDefinition[];
    slots?: string[];
    description: string;
    usage?: string;
    dependencies: string[];
}
export interface PropDefinition {
    name: string;
    type: string;
    required: boolean;
    defaultValue?: string;
    description: string;
}
export interface EventDefinition {
    name: string;
    payload: string;
    description: string;
}
export interface ApiEndpoint {
    id: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    path: string;
    description: string;
    auth: boolean;
    request?: RequestResponse;
    response: RequestResponse;
    tags?: string[];
}
export interface RequestResponse {
    headers?: Record<string, string>;
    body?: string;
    schema?: string;
}
export interface DataModel {
    id: string;
    name: string;
    fields: ModelField[];
    description: string;
}
export interface ModelField {
    name: string;
    type: string;
    required: boolean;
    description?: string;
}
export interface UtilityFunction {
    id: string;
    name: string;
    path: string;
    signature: string;
    description: string;
    parameters: ParameterDefinition[];
    returnType: string;
    usage?: string;
}
export interface ParameterDefinition {
    name: string;
    type: string;
    required: boolean;
    description?: string;
}
export interface StyleSystem {
    solution: 'css-modules' | 'tailwind' | 'styled-components' | 'sass' | 'less';
    theme?: ThemeConfig;
    tokens: DesignToken[];
}
export interface ThemeConfig {
    colors?: Record<string, string>;
    breakpoints?: Record<string, string>;
    spacing?: Record<string, string>;
}
export interface DesignToken {
    name: string;
    value: string;
    type: 'color' | 'spacing' | 'typography' | 'shadow' | 'border' | 'font' | 'radius' | 'other';
}
export interface LearnedPattern {
    id: string;
    type: 'code' | 'flow' | 'problem';
    name: string;
    description: string;
    code?: string;
    steps?: string[];
    confidence: number;
    usageCount: number;
    lastUpdated: string;
}
export interface FeedbackRecord {
    id: string;
    timestamp: string;
    stage: string;
    task: string;
    userAction: 'confirmed' | 'modified' | 'rejected';
    originalOutput?: string;
    userCorrection?: string;
    learned?: string;
}
export type MemoryKey = 'project' | 'structure' | 'architecture' | 'conventions' | 'components' | 'apis' | 'models' | 'utils' | 'hooks' | 'styles' | 'patterns' | 'feedback';
export interface MemoryEntry {
    key: MemoryKey;
    data: unknown;
    updatedAt: string;
    version: number;
}
export interface VectorEntry {
    id: string;
    content: string;
    embedding: number[];
    metadata: {
        type: string;
        path?: string;
        name?: string;
    };
}
export interface SearchResult {
    entry: VectorEntry;
    score: number;
}
//# sourceMappingURL=types.d.ts.map