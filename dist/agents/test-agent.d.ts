import { BaseAgent, type AgentContext, type AgentResult } from './base-agent.js';
import type { DevelopResult } from './develop-agent.js';
import type { TestAgentResult } from './fix-agent.js';
export type { TestAgentResult };
export declare class TestAgent extends BaseAgent {
    constructor(context: AgentContext);
    execute(developResult: DevelopResult): Promise<AgentResult<TestAgentResult>>;
}
//# sourceMappingURL=test-agent.d.ts.map