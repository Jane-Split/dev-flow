export interface Feature {
    id: string;
    name: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
}
export interface LogicStep {
    id: string;
    name: string;
    type: 'action' | 'condition' | 'loop' | 'parallel';
    description: string;
    next?: string[];
    onError?: string;
}
export interface StateDefinition {
    name: string;
    type: string;
    initialValue: string;
    description: string;
}
export interface LogicDesign {
    flows: {
        name: string;
        steps: LogicStep[];
        description: string;
    }[];
    states: StateDefinition[];
    sideEffects: {
        trigger: string;
        action: string;
        description: string;
    }[];
}
export declare class LogicDesigner {
    design(features: Feature[]): LogicDesign;
    private inferFlows;
    private inferStates;
    private inferSideEffects;
}
//# sourceMappingURL=logic-designer.d.ts.map