/**
 * 老旧项目专家 - 处理老旧技术栈相关的开发任务
 *
 * 能力:
 * - 识别老旧技术栈代码并生成兼容代码
 * - 执行渐进式代码迁移
 * - 为老旧框架生成测试用例
 * - 提供迁移建议和风险评估
 *
 * 支持的老旧技术栈:
 * - jQuery → React/Vue
 * - AngularJS 1.x → Angular 17+
 * - PHP 5.x → Node.js/PHP 8.x
 * - Java 6/7 → Java 17+
 * - Python 2.x → Python 3.x
 * - Backbone.js / Knockout.js → React/Vue
 */
import type { Task } from '../planner/task-splitter.js';
import { BaseExpert, type ExpertResult } from './base-expert.js';
export declare class LegacyExpert extends BaseExpert {
    constructor(context: any);
    canHandle(task: Task): boolean;
    execute(task: Task): Promise<ExpertResult>;
    /**
     * 检测迁移类型
     */
    private detectMigrationType;
    /**
     * 执行代码迁移
     */
    private executeMigration;
    /**
     * 生成迁移后的代码
     */
    private generateMigratedCode;
    /**
     * 生成 React 代码
     */
    private generateReactCode;
    /**
     * 生成 Vue 代码
     */
    private generateVueCode;
    /**
     * 生成 Angular 代码
     */
    private generateAngularCode;
    /**
     * 生成 Node.js 代码
     */
    private generateNodeCode;
    /**
     * 生成迁移测试
     */
    private generateMigrationTest;
    /**
     * 生成迁移指南
     */
    private generateMigrationGuide;
    /**
     * 通用迁移代码（无匹配模板时）
     */
    private generateGenericMigration;
    /**
     * 通用老旧项目代码生成
     */
    private generateLegacyCode;
    /**
     * 自检
     */
    private selfCheck;
    /**
     * 转换名称为文件安全名称
     */
    private toFileName;
    /**
     * 转换为 PascalCase
     */
    private toPascalCase;
}
//# sourceMappingURL=legacy-expert.d.ts.map