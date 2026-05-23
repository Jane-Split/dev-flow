import type { ApiEndpoint } from '../memory/types.js';
export interface Feature {
    id: string;
    name: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
}
export interface ApiDesign {
    endpoints: ApiEndpoint[];
    errorCodes: {
        code: string;
        message: string;
        description: string;
    }[];
    authStrategy: string;
}
export declare class ApiDesigner {
    design(features: Feature[], existingApis: ApiEndpoint[]): ApiDesign;
    private inferApis;
}
//# sourceMappingURL=api-designer.d.ts.map