export interface Ambiguity {
    type: 'vague' | 'missing' | 'conflict' | 'undefined';
    description: string;
    location: string;
    suggestion: string;
    severity: 'high' | 'medium' | 'low';
}
export declare class AmbiguityDetector {
    detect(requirement: string): Ambiguity[];
    private findLocation;
}
//# sourceMappingURL=ambiguity-detector.d.ts.map