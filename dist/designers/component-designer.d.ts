import type { ComponentInfo } from '../memory/types.js';
export interface Feature {
    id: string;
    name: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
}
export interface ComponentDesign {
    components: ComponentInfo[];
    componentTree: string;
    reusableComponents: string[];
}
export declare class ComponentDesigner {
    design(features: Feature[], existingComponents: ComponentInfo[]): ComponentDesign;
    private inferComponents;
    private generateComponentTree;
}
//# sourceMappingURL=component-designer.d.ts.map