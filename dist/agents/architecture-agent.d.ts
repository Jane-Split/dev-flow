import { BaseAgent, type AgentContext, type AgentResult } from './base-agent.js';
import type { TechDecision, ArchitecturePattern, LayerStrategy, DeploymentPlan, ProjectScale } from './architecture-templates.js';
export interface ArchitectureResult {
    projectScale: ProjectScale;
    techDecisions: TechDecision[];
    pattern: ArchitecturePattern;
    layers: LayerStrategy;
    deployment: DeploymentPlan;
    tradeoffs: {
        concern: string;
        decision: string;
        impact: string;
    }[];
    documentPath: string;
}
export declare class ArchitectureAgent extends BaseAgent {
    constructor(context: AgentContext);
    execute(requirement: string): Promise<AgentResult<ArchitectureResult>>;
    private generateDocument;
}
//# sourceMappingURL=architecture-agent.d.ts.map