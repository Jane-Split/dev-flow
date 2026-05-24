/**
 * 迁移模板库 - 提供各老旧技术栈到现代技术栈的代码转换模板
 *
 * 支持的迁移路径:
 * - jQuery → React
 * - jQuery → Vue
 * - AngularJS → Angular
 * - PHP → Node.js (Express)
 * - Python 2 → Python 3
 * - Backbone.js → React
 * - Knockout.js → Vue
 */
export interface MigrationPattern {
    legacy: string;
    modern: string;
    description: string;
    category: string;
}
export interface MigrationTemplate {
    id: string;
    from: string;
    to: string;
    patterns: MigrationPattern[];
    notes: string[];
    warnings: string[];
}
export declare const JQUERY_TO_REACT: MigrationTemplate;
export declare const JQUERY_TO_VUE: MigrationTemplate;
export declare const ANGULARJS_TO_ANGULAR: MigrationTemplate;
export declare const PHP_TO_NODE: MigrationTemplate;
/**
 * 获取迁移模板
 */
export declare function getMigrationTemplate(from: string, to: string): MigrationTemplate | null;
/**
 * 列出所有可用的迁移路径
 */
export declare function listMigrationPaths(): Array<{
    from: string;
    to: string;
    id: string;
}>;
/**
 * 根据老旧技术栈类型获取推荐的迁移模板
 */
export declare function getRecommendedTemplates(legacyType: string): MigrationTemplate[];
//# sourceMappingURL=migration-templates.d.ts.map