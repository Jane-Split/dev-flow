/**
 * 迁移模块导出
 */

export { getMigrationTemplate, listMigrationPaths, getRecommendedTemplates } from './migration-templates.js';
export type { MigrationTemplate, MigrationPattern } from './migration-templates.js';
export { MigrationToolkit } from './migration-toolkit.js';
export type { FileMigrationResult, ModuleMigrationResult, MigrationConfig, CodeSnippet } from './migration-toolkit.js';
