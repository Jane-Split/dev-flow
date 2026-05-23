import { BaseAgent, type AgentContext, type AgentResult } from './base-agent.js';
export interface Feature {
    name: string;
    priority: string;
    complexity: 'high' | 'medium' | 'low';
    role: string;
    action: string;
    value: string;
    acceptances: {
        given: string;
        when: string;
        then: string;
    }[];
    relatedComponents: string;
    relatedApis: string;
    relatedModels: string;
}
export interface AnalyzeResult {
    title: string;
    type: string;
    priority: string;
    features: Feature[];
    impacts: {
        type: string;
        path: string;
        operation: string;
        description: string;
    }[];
    constraints: string[];
    risks: string[];
    ambiguities: {
        description: string;
        suggestion: string;
    }[];
    documentPath: string;
}
export declare class AnalyzeAgent extends BaseAgent {
    constructor(context: AgentContext);
    execute(requirement: string): Promise<AgentResult<AnalyzeResult>>;
    private generateFeatures;
    private generateDocument;
}
//# sourceMappingURL=analyze-agent.d.ts.map