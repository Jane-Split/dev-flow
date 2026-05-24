export interface DevFlowOptions {
    requirement: string;
    stage: string | null;
    refresh: boolean;
    legacy?: boolean;
    legacyFrom?: string | null;
    legacyTo?: string | null;
    legacyModule?: string | null;
    legacySafe?: boolean;
}
/**
 * 运行开发流程
 */
export declare function runDevFlow(options: DevFlowOptions): Promise<void>;
/**
 * 确认阶段转换
 */
export declare function confirmStageTransition(stage: string, current: number, total: number): Promise<boolean>;
/**
 * 显示阶段进度
 */
export declare function showStageProgress(stage: string, progress: number, message?: string): void;
/**
 * 询问用户确认
 */
export declare function askConfirmation(message: string): Promise<boolean>;
/**
 * 询问用户选择
 */
export declare function askChoice<T>(message: string, choices: Array<{
    name: string;
    value: T;
}>): Promise<T>;
//# sourceMappingURL=interactive.d.ts.map