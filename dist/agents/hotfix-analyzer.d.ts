export type ErrorType = 'syntax' | 'logic' | 'type' | 'dependency' | 'config' | 'runtime';
export interface Fix {
    file: string;
    originalCode: string;
    fixedCode: string;
    explanation: string;
}
/**
 * 从错误描述判断错误类型
 */
export declare function parseErrorType(description: string): ErrorType;
/**
 * 查找可能受影响的文件
 */
export declare function findAffectedFiles(projectRoot: string, description: string): Promise<string[]>;
/**
 * 根据错误类型生成标准化的修复建议
 */
export declare function generateFix(errorType: ErrorType, file: string, description: string): Fix;
/**
 * 生成验证步骤
 */
export declare function generateVerification(errorType: ErrorType, description: string): {
    steps: string[];
    expectedBehavior: string;
};
//# sourceMappingURL=hotfix-analyzer.d.ts.map