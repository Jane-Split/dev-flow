import type { StyleSystem } from '../memory/types.js';
export interface Feature {
    id: string;
    name: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
}
export interface ResponsiveBreakpoint {
    name: string;
    minWidth: string;
    description: string;
}
export interface AnimationDefinition {
    name: string;
    type: 'transition' | 'keyframe';
    duration: string;
    timing: string;
    description: string;
}
export interface StyleDesign {
    themeVariables: {
        name: string;
        value: string;
        usage: string;
    }[];
    responsive: ResponsiveBreakpoint[];
    animations: AnimationDefinition[];
    componentStyles: {
        component: string;
        styles: string[];
        description: string;
    }[];
}
export declare class StyleDesigner {
    design(features: Feature[], existingStyles: StyleSystem | null): StyleDesign;
    private inferStyles;
}
//# sourceMappingURL=style-designer.d.ts.map