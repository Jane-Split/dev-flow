import type { DataModel } from '../memory/types.js';
export interface Feature {
    id: string;
    name: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
}
export interface DataDesign {
    models: DataModel[];
    validationRules: {
        model: string;
        field: string;
        rules: string[];
    }[];
    transformations: {
        name: string;
        from: string;
        to: string;
        logic: string;
    }[];
}
export declare class DataDesigner {
    design(features: Feature[], existingModels: DataModel[]): DataDesign;
    private inferModels;
    private generateValidationRules;
}
//# sourceMappingURL=data-designer.d.ts.map