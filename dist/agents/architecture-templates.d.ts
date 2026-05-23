export interface TechOption {
    name: string;
    pros: string[];
    cons: string[];
    score: number;
    recommended: boolean;
}
export interface TechDecision {
    category: 'framework' | 'database' | 'cache' | 'queue' | 'auth' | 'monitoring' | 'deployment';
    options: TechOption[];
    selected: string;
    rationale: string;
}
export interface ArchitecturePattern {
    name: string;
    description: string;
    suitableFor: string[];
    tradeoffs: string[];
}
export interface LayerStrategy {
    directoryStructure: string[];
    moduleBoundaries: string[];
    dataFlow: string;
    apiContract: string;
}
export interface DeploymentPlan {
    strategy: 'docker' | 'k8s' | 'vercel' | 'static' | 'hybrid';
    description: string;
    requirements: string[];
}
export type ProjectScale = 'small' | 'medium' | 'large';
/**
 * 从需求描述中评估项目规模
 */
export declare function getScaleFromRequirement(requirement: string): ProjectScale;
/**
 * 根据规模获取技术选型推荐
 */
export declare function getTechRecommendations(scale: ProjectScale): TechDecision[];
/**
 * 根据规模获取架构模式
 */
export declare function getArchitecturePattern(scale: ProjectScale): ArchitecturePattern;
/**
 * 根据规模和框架获取分层策略
 */
export declare function getLayerStrategy(scale: ProjectScale, _framework: string): LayerStrategy;
/**
 * 根据规模获取部署方案
 */
export declare function getDeploymentPlan(scale: ProjectScale): DeploymentPlan;
/**
 * 根据规模获取权衡分析
 */
export declare function getTradeoffs(scale: ProjectScale): {
    concern: string;
    decision: string;
    impact: string;
}[];
//# sourceMappingURL=architecture-templates.d.ts.map