export interface ParsedRequirement {
    raw: string;
    type: 'feature' | 'modification' | 'refactor' | 'bugfix' | 'optimization';
    title: string;
    description: string;
    constraints: string[];
    priority: 'P0' | 'P1' | 'P2';
    source?: string;
}
export declare class RequirementParser {
    parse(input: string, projectRoot: string): Promise<ParsedRequirement>;
    private detectType;
    private extractTitle;
    private extractDescription;
    private extractConstraints;
    private detectPriority;
}
//# sourceMappingURL=requirement-parser.d.ts.map