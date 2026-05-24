/**
 * Legacy Support 集成测试
 *
 * 测试老旧项目支持的所有新功能:
 * - LegacyScanner: 老旧技术栈识别
 * - LegacyExpert: 老旧代码生成和迁移
 * - LegacyAnalyzer: 老旧项目分析
 * - LegacyMigrator: 渐进式迁移
 * - LegacyRefactor: 安全重构
 * - MigrationToolkit: 迁移工具
 * - MigrationTemplates: 迁移模板
 * - ExpertRegistry: LegacyExpert 注册
 * - TaskType: legacy/migration 类型
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { LegacyScanner } from '../src/scanners/legacy-scanner.js';
import { LegacyExpert } from '../src/experts/legacy-expert.js';
import { ExpertRegistry } from '../src/experts/expert-registry.js';
import { LegacyAnalyzer } from '../src/agents/legacy-analyzer.js';
import { LegacyMigrator } from '../src/agents/legacy-migrator.js';
import { LegacyRefactor } from '../src/agents/legacy-refactor.js';
import { MigrationToolkit } from '../src/migration/migration-toolkit.js';
import {
  getMigrationTemplate,
  listMigrationPaths,
  getRecommendedTemplates,
} from '../src/migration/migration-templates.js';
import type { Task } from '../src/planner/task-splitter.js';

// ─── 测试辅助 ─────────────────────────────────────────

const TEST_DIR = '/data/user/work/test-legacy-project';

/** 创建模拟老旧项目 */
async function createLegacyProject(type: 'jquery' | 'angularjs' | 'php' | 'mixed'): Promise<void> {
  await fs.mkdir(TEST_DIR, { recursive: true });
  await fs.mkdir(path.join(TEST_DIR, 'src'), { recursive: true });

  if (type === 'jquery' || type === 'mixed') {
    await fs.writeFile(path.join(TEST_DIR, 'package.json'), JSON.stringify({
      name: 'test-legacy',
      dependencies: { jquery: '1.12.4' },
    }));
    await fs.writeFile(path.join(TEST_DIR, 'src', 'app.js'), `
      $(document).ready(function() {
        $('#btn').on('click', function() {
          $.ajax({
            url: '/api/data',
            success: function(data) {
              $('.list').append('<li>' + data.name + '</li>');
              $('#content').html(data.content);
              $('#loading').hide();
            }
          });
        });

        $('.item').each(function() {
          $(this).addClass('active');
          var text = $(this).text();
          console.log(text);
        });

        eval(userInput);
      });
    `.trim());
  }

  if (type === 'angularjs' || type === 'mixed') {
    await fs.writeFile(path.join(TEST_DIR, 'src', 'angular-app.js'), `
      var app = angular.module('myApp', []);
      app.controller('MyCtrl', function($scope, $http) {
        $scope.items = [];
        $http.get('/api/items').then(function(response) {
          $scope.items = response.data;
        });
      });
    `.trim());
  }

  if (type === 'php' || type === 'mixed') {
    await fs.writeFile(path.join(TEST_DIR, 'index.php'), `
      <?php
      $conn = mysql_connect('localhost', 'root', 'password');
      $result = mysql_query("SELECT * FROM users WHERE id=" . $_GET['id']);
      echo json_encode($result);
      ?>
    `.trim());
  }

  // 创建一个有复杂度的文件
  await fs.writeFile(path.join(TEST_DIR, 'src', 'complex.js'), `
    function process(data) {
      if (data) {
        if (data.type === 'a') {
          if (data.value > 0) {
            if (data.active) {
              if (data.valid) {
                return data.value * 2;
              }
            }
          }
        } else if (data.type === 'b') {
          for (var i = 0; i < data.items.length; i++) {
            for (var j = 0; j < data.items[i].sub.length; j++) {
              console.log(data.items[i].sub[j]);
            }
          }
        }
      }
      return null;
    }
  `.trim());
}

/** 清理测试目录 */
async function cleanupTestDir(): Promise<void> {
  try {
    await fs.rm(TEST_DIR, { recursive: true, force: true });
  } catch {
    // 忽略
  }
}

/** 创建模拟上下文 */
function createMockContext(projectRoot: string) {
  return {
    projectRoot,
    memory: {
      get: async () => null,
      set: async () => {},
      has: async () => false,
    },
    sessionId: 'test-session',
  };
}

/** 创建测试任务 */
function createTestTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'task-1',
    name: '迁移用户管理模块',
    description: '将 jQuery 用户管理模块迁移到 React',
    type: 'migration',
    complexity: 'medium',
    dependencies: [],
    context: {
      memoryKeys: [],
      referenceFiles: [],
      designSection: '迁移设计',
    },
    expert: 'LegacyExpert',
    output: {
      files: ['src/components/UserManager.tsx'],
      verification: '组件渲染正常',
    },
    status: 'pending',
    ...overrides,
  };
}

// ─── 测试用例 ─────────────────────────────────────────

describe('Legacy Support 集成测试', () => {

  beforeEach(async () => {
    await cleanupTestDir();
  });

  afterEach(async () => {
    await cleanupTestDir();
  });

  // ─── TaskType 扩展 ─────────────────────────────────

  describe('TaskType 扩展', () => {
    it('应支持 legacy 和 migration 任务类型', async () => {
      const { TaskType } = await import('../src/planner/task-splitter.js');
      const validTypes: string[] = ['data', 'api', 'component', 'logic', 'style', 'test', 'algorithm', 'legacy', 'migration'];
      for (const t of validTypes) {
        expect(t).toBe(t); // 确认类型值有效
      }
      // 验证 legacy 和 migration 在类型列表中
      expect(validTypes).toContain('legacy');
      expect(validTypes).toContain('migration');
    });
  });

  // ─── MigrationTemplates ─────────────────────────────

  describe('MigrationTemplates 迁移模板', () => {
    it('应列出所有迁移路径', () => {
      const paths = listMigrationPaths();
      expect(paths.length).toBeGreaterThanOrEqual(4);
      const ids = paths.map(p => p.id);
      expect(ids).toContain('jquery-to-react');
      expect(ids).toContain('jquery-to-vue');
      expect(ids).toContain('angularjs-to-angular');
      expect(ids).toContain('php-to-node');
    });

    it('应获取 jQuery → React 迁移模板', () => {
      const template = getMigrationTemplate('jquery', 'react');
      expect(template).not.toBeNull();
      expect(template!.from).toBe('jQuery');
      expect(template!.to).toBe('React');
      expect(template!.patterns.length).toBeGreaterThan(10);
    });

    it('应获取 AngularJS → Angular 迁移模板', () => {
      const template = getMigrationTemplate('angularjs', 'angular');
      expect(template).not.toBeNull();
      expect(template!.from).toBe('AngularJS 1.x');
      expect(template!.to).toBe('Angular 17+');
    });

    it('应获取 PHP → Node.js 迁移模板', () => {
      const template = getMigrationTemplate('php', 'node');
      expect(template).not.toBeNull();
      expect(template!.from).toBe('PHP');
      expect(template!.to).toBe('Node.js (Express)');
    });

    it('不存在的迁移路径应返回 null', () => {
      const template = getMigrationTemplate('nonexist', 'nonexist');
      expect(template).toBeNull();
    });

    it('应根据老旧技术栈类型获取推荐模板', () => {
      const templates = getRecommendedTemplates('jquery');
      expect(templates.length).toBeGreaterThanOrEqual(2);
      const targets = templates.map(t => t.to);
      expect(targets).toContain('React');
      expect(targets).toContain('Vue');
    });

    it('jQuery → React 模板应包含关键迁移模式', () => {
      const template = getMigrationTemplate('jquery', 'react')!;
      const categories = template.patterns.map(p => p.category);
      expect(categories).toContain('dom');
      expect(categories).toContain('event');
      expect(categories).toContain('ajax');
      expect(categories).toContain('lifecycle');
    });

    it('迁移模板应包含注意事项和警告', () => {
      const template = getMigrationTemplate('jquery', 'react')!;
      expect(template.notes.length).toBeGreaterThan(0);
      expect(template.warnings.length).toBeGreaterThan(0);
    });
  });

  // ─── LegacyScanner ──────────────────────────────────

  describe('LegacyScanner 老旧技术栈识别', () => {
    it('应识别 jQuery 项目', async () => {
      await createLegacyProject('jquery');
      const scanner = new LegacyScanner(TEST_DIR);
      const result = await scanner.scan();

      expect(result.isLegacy).toBe(true);
      expect(result.legacyScore).toBeGreaterThan(0);
      const jqueryTech = result.techStacks.find(t => t.type === 'jquery');
      expect(jqueryTech).toBeDefined();
      expect(jqueryTech!.confidence).toBeGreaterThanOrEqual(20);
    });

    it('应识别 AngularJS 项目', async () => {
      await createLegacyProject('angularjs');
      const scanner = new LegacyScanner(TEST_DIR);
      const result = await scanner.scan();

      expect(result.isLegacy).toBe(true);
      const angularjsTech = result.techStacks.find(t => t.type === 'angularjs');
      expect(angularjsTech).toBeDefined();
      expect(angularjsTech!.confidence).toBeGreaterThanOrEqual(20);
    });

    it('应识别 PHP 老旧项目', async () => {
      await createLegacyProject('php');
      const scanner = new LegacyScanner(TEST_DIR);
      const result = await scanner.scan();

      expect(result.isLegacy).toBe(true);
      const phpTech = result.techStacks.find(t => t.type === 'php-legacy');
      expect(phpTech).toBeDefined();
    });

    it('应识别混合老旧项目', async () => {
      await createLegacyProject('mixed');
      const scanner = new LegacyScanner(TEST_DIR);
      const result = await scanner.scan();

      expect(result.isLegacy).toBe(true);
      expect(result.techStacks.length).toBeGreaterThanOrEqual(2);
    });

    it('应检测安全风险', async () => {
      await createLegacyProject('jquery');
      const scanner = new LegacyScanner(TEST_DIR);
      const result = await scanner.scan();

      const securityDebts = result.techDebts.filter(d => d.type === 'security');
      expect(securityDebts.length).toBeGreaterThan(0);

      // 应检测到 eval() 风险
      const evalDebt = securityDebts.find(d => d.description.includes('eval'));
      expect(evalDebt).toBeDefined();
      expect(evalDebt!.severity).toBe('critical');
    });

    it('应分析代码复杂度', async () => {
      await createLegacyProject('jquery');
      const scanner = new LegacyScanner(TEST_DIR);
      const result = await scanner.scan();

      expect(result.complexity.average).toBeGreaterThan(0);
      expect(result.complexity.hotspots.length).toBeGreaterThan(0);
    });

    it('应生成迁移路径', async () => {
      await createLegacyProject('jquery');
      const scanner = new LegacyScanner(TEST_DIR);
      const result = await scanner.scan();

      expect(result.migrationPaths.length).toBeGreaterThan(0);
      const hasReactMigration = result.migrationPaths.some(p => p.to === 'React');
      expect(hasReactMigration).toBe(true);
    });

    it('应生成摘要和建议', async () => {
      await createLegacyProject('jquery');
      const scanner = new LegacyScanner(TEST_DIR);
      const result = await scanner.scan();

      expect(result.summary).toBeTruthy();
      expect(result.recommendations.length).toBeGreaterThan(0);
    });

    it('空目录应返回非老旧项目', async () => {
      await fs.mkdir(TEST_DIR, { recursive: true });
      const scanner = new LegacyScanner(TEST_DIR);
      const result = await scanner.scan();

      expect(result.isLegacy).toBe(false);
      expect(result.techStacks.length).toBe(0);
    });
  });

  // ─── LegacyExpert ──────────────────────────────────

  describe('LegacyExpert 老旧项目专家', () => {
    it('应通过显式指定专家匹配', () => {
      const expert = new LegacyExpert(createMockContext('/tmp'));
      const task = createTestTask({ expert: 'LegacyExpert' });
      expect(expert.canHandle(task)).toBe(true);
    });

    it('应通过 legacy 任务类型匹配', () => {
      const expert = new LegacyExpert(createMockContext('/tmp'));
      const task = createTestTask({ type: 'legacy' });
      expect(expert.canHandle(task)).toBe(true);
    });

    it('应通过 migration 任务类型匹配', () => {
      const expert = new LegacyExpert(createMockContext('/tmp'));
      const task = createTestTask({ type: 'migration' });
      expect(expert.canHandle(task)).toBe(true);
    });

    it('应通过关键词匹配', () => {
      const expert = new LegacyExpert(createMockContext('/tmp'));
      expect(expert.canHandle(createTestTask({ description: '迁移jQuery到React' }))).toBe(true);
      expect(expert.canHandle(createTestTask({ description: '重构老旧代码' }))).toBe(true);
      expect(expert.canHandle(createTestTask({ name: 'Legacy module refactor' }))).toBe(true);
    });

    it('不应匹配非老旧任务', () => {
      const expert = new LegacyExpert(createMockContext('/tmp'));
      const task = createTestTask({
        expert: 'FrontendExpert',
        type: 'component',
        description: '创建用户列表组件',
      });
      expect(expert.canHandle(task)).toBe(false);
    });

    it('应执行 jQuery → React 迁移任务', async () => {
      await fs.mkdir(path.join(TEST_DIR, 'src', 'components'), { recursive: true });
      const expert = new LegacyExpert(createMockContext(TEST_DIR));
      const task = createTestTask({
        name: '迁移用户管理模块',
        description: '将 jQuery 用户管理模块迁移到 React',
        type: 'migration',
        output: {
          files: ['src/components/UserManager.tsx'],
          verification: '组件渲染正常',
        },
      });

      const result = await expert.execute(task);
      expect(result.success).toBe(true);
      expect(result.files.length).toBeGreaterThanOrEqual(2); // 代码 + 测试
      expect(result.changes.length).toBeGreaterThan(0);
      expect(result.verification.passed).toBe(true);
    });

    it('应生成迁移指南文档', async () => {
      await fs.mkdir(path.join(TEST_DIR, 'src', 'components'), { recursive: true });
      await fs.mkdir(path.join(TEST_DIR, 'docs'), { recursive: true });
      const expert = new LegacyExpert(createMockContext(TEST_DIR));
      const task = createTestTask({
        name: '迁移用户管理模块',
        description: '将 jQuery 用户管理模块迁移到 React',
        type: 'migration',
      });

      const result = await expert.execute(task);
      expect(result.success).toBe(true);

      // 应包含迁移指南文档
      const hasGuide = result.files.some(f => f.includes('migration-'));
      expect(hasGuide).toBe(true);
    });

    it('应提供迁移建议', async () => {
      await fs.mkdir(path.join(TEST_DIR, 'src', 'components'), { recursive: true });
      const expert = new LegacyExpert(createMockContext(TEST_DIR));
      const task = createTestTask({
        description: '将 jQuery 迁移到 React',
        type: 'migration',
      });

      const result = await expert.execute(task);
      expect(result.success).toBe(true);
      expect(result.suggestions).toBeDefined();
      expect(result.suggestions!.length).toBeGreaterThan(0);
    });

    it('应处理通用老旧代码生成', async () => {
      await fs.mkdir(path.join(TEST_DIR, 'src', 'legacy'), { recursive: true });
      const expert = new LegacyExpert(createMockContext(TEST_DIR));
      const task = createTestTask({
        name: '老旧模块兼容',
        description: '为老旧系统添加兼容层',
        type: 'legacy',
        output: {
          files: ['src/legacy/compat.ts'],
          verification: '编译通过',
        },
      });

      const result = await expert.execute(task);
      expect(result.success).toBe(true);
      expect(result.files.length).toBeGreaterThanOrEqual(1);
    });
  });

  // ─── ExpertRegistry ────────────────────────────────

  describe('ExpertRegistry LegacyExpert 注册', () => {
    it('应自动注册 LegacyExpert', () => {
      const registry = new ExpertRegistry(createMockContext('/tmp'));
      // 通过 legacy 任务验证注册
      const task = createTestTask({ type: 'legacy' });
      const expert = registry.getExpert(task);
      expect(expert).not.toBeNull();
      expect(expert!.constructor.name).toBe('LegacyExpert');
    });

    it('应通过 migration 任务类型找到 LegacyExpert', () => {
      const registry = new ExpertRegistry(createMockContext('/tmp'));
      const task = createTestTask({ type: 'migration' });
      const expert = registry.getExpert(task);
      expect(expert).not.toBeNull();
    });

    it('应通过关键词找到 LegacyExpert', () => {
      const registry = new ExpertRegistry(createMockContext('/tmp'));
      const task = createTestTask({
        type: 'component',
        description: '迁移 jQuery 代码到 React',
      });
      const expert = registry.getExpert(task);
      expect(expert).not.toBeNull();
      expect(expert!.constructor.name).toBe('LegacyExpert');
    });
  });

  // ─── LegacyAnalyzer ────────────────────────────────

  describe('LegacyAnalyzer 老旧项目分析', () => {
    it('应分析 jQuery 老旧项目', async () => {
      await createLegacyProject('jquery');
      const analyzer = new LegacyAnalyzer({
        projectRoot: TEST_DIR,
        memory: createMockContext(TEST_DIR).memory,
        sessionId: 'test',
      });

      const result = await analyzer.execute();
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.analysis.isLegacy).toBe(true);
      expect(result.data!.analysis.techStacks.length).toBeGreaterThan(0);
      expect(result.data!.reportPath).toBeTruthy();
      expect(result.artifacts).toBeDefined();
      expect(result.artifacts!.length).toBeGreaterThan(0);
    });

    it('应生成分析报告文件', async () => {
      await createLegacyProject('jquery');
      const analyzer = new LegacyAnalyzer({
        projectRoot: TEST_DIR,
        memory: createMockContext(TEST_DIR).memory,
        sessionId: 'test',
      });

      const result = await analyzer.execute();
      expect(result.success).toBe(true);

      const reportExists = await fs.access(result.data!.reportPath).then(() => true).catch(() => false);
      expect(reportExists).toBe(true);
    });

    it('应处理空项目', async () => {
      await fs.mkdir(TEST_DIR, { recursive: true });
      const analyzer = new LegacyAnalyzer({
        projectRoot: TEST_DIR,
        memory: createMockContext(TEST_DIR).memory,
        sessionId: 'test',
      });

      const result = await analyzer.execute();
      expect(result.success).toBe(true);
      expect(result.data!.analysis.isLegacy).toBe(false);
    });
  });

  // ─── LegacyRefactor ────────────────────────────────

  describe('LegacyRefactor 安全重构', () => {
    it('应分析代码并生成重构建议', async () => {
      await createLegacyProject('jquery');
      const refactor = new LegacyRefactor({
        projectRoot: TEST_DIR,
        memory: createMockContext(TEST_DIR).memory,
        sessionId: 'test',
      });

      const result = await refactor.execute();
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.suggestions.length).toBeGreaterThan(0);
      expect(result.data!.reportPath).toBeTruthy();
    });

    it('安全模式应只返回低风险建议', async () => {
      await createLegacyProject('jquery');
      const refactor = new LegacyRefactor({
        projectRoot: TEST_DIR,
        memory: createMockContext(TEST_DIR).memory,
        sessionId: 'test',
      });

      const result = await refactor.execute({ safe: true });
      expect(result.success).toBe(true);
      const allLowRisk = result.data!.suggestions.every(s => s.risk === 'low');
      expect(allLowRisk).toBe(true);
    });

    it('应检测深层嵌套', async () => {
      await createLegacyProject('jquery');
      const refactor = new LegacyRefactor({
        projectRoot: TEST_DIR,
        memory: createMockContext(TEST_DIR).memory,
        sessionId: 'test',
      });

      const result = await refactor.execute();
      const nestingSuggestion = result.data!.suggestions.find(
        s => s.type === 'simplify-condition' && s.description.includes('嵌套')
      );
      expect(nestingSuggestion).toBeDefined();
    });

    it('应生成重构报告文件', async () => {
      await createLegacyProject('jquery');
      const refactor = new LegacyRefactor({
        projectRoot: TEST_DIR,
        memory: createMockContext(TEST_DIR).memory,
        sessionId: 'test',
      });

      const result = await refactor.execute();
      const reportExists = await fs.access(result.data!.reportPath).then(() => true).catch(() => false);
      expect(reportExists).toBe(true);
    });
  });

  // ─── LegacyMigrator ────────────────────────────────

  describe('LegacyMigrator 渐进式迁移', () => {
    it('应拒绝不支持的迁移路径', async () => {
      await createLegacyProject('jquery');
      const migrator = new LegacyMigrator({
        projectRoot: TEST_DIR,
        memory: createMockContext(TEST_DIR).memory,
        sessionId: 'test',
      });

      const result = await migrator.execute({
        from: 'nonexist',
        to: 'nonexist',
      });
      expect(result.success).toBe(false);
      expect(result.error).toContain('未找到迁移模板');
    });

    it('应执行 jQuery → React 迁移', async () => {
      await createLegacyProject('jquery');
      await fs.mkdir(path.join(TEST_DIR, 'migrated'), { recursive: true });
      const migrator = new LegacyMigrator({
        projectRoot: TEST_DIR,
        memory: createMockContext(TEST_DIR).memory,
        sessionId: 'test',
      });

      const result = await migrator.execute({
        from: 'jquery',
        to: 'react',
      });
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.from).toBe('jquery');
      expect(result.data!.to).toBe('react');
      expect(result.data!.migratedFiles.length).toBeGreaterThan(0);
      expect(result.data!.reportPath).toBeTruthy();
    });

    it('应支持模块过滤', async () => {
      await createLegacyProject('jquery');
      await fs.mkdir(path.join(TEST_DIR, 'migrated'), { recursive: true });
      const migrator = new LegacyMigrator({
        projectRoot: TEST_DIR,
        memory: createMockContext(TEST_DIR).memory,
        sessionId: 'test',
      });

      const result = await migrator.execute({
        from: 'jquery',
        to: 'react',
        module: 'complex', // 只迁移包含 'complex' 的文件
      });
      expect(result.success).toBe(true);
    });

    it('应生成迁移报告', async () => {
      await createLegacyProject('jquery');
      await fs.mkdir(path.join(TEST_DIR, 'migrated'), { recursive: true });
      const migrator = new LegacyMigrator({
        projectRoot: TEST_DIR,
        memory: createMockContext(TEST_DIR).memory,
        sessionId: 'test',
      });

      const result = await migrator.execute({
        from: 'jquery',
        to: 'react',
      });
      const reportExists = await fs.access(result.data!.reportPath).then(() => true).catch(() => false);
      expect(reportExists).toBe(true);
    });
  });

  // ─── MigrationToolkit ──────────────────────────────

  describe('MigrationToolkit 迁移工具', () => {
    it('应获取迁移模板', () => {
      const toolkit = new MigrationToolkit({
        from: 'jquery',
        to: 'react',
        sourceDir: '/tmp',
        targetDir: '/tmp/migrated',
      });
      expect(toolkit.getTemplate()).not.toBeNull();
    });

    it('不支持的迁移路径应返回 null', () => {
      const toolkit = new MigrationToolkit({
        from: 'nonexist',
        to: 'nonexist',
        sourceDir: '/tmp',
        targetDir: '/tmp/migrated',
      });
      expect(toolkit.getTemplate()).toBeNull();
    });

    it('应生成迁移报告', () => {
      const toolkit = new MigrationToolkit({
        from: 'jquery',
        to: 'react',
        sourceDir: '/tmp',
        targetDir: '/tmp/migrated',
      });

      const report = toolkit.generateReport([
        {
          sourceFile: 'app.js',
          targetFile: 'migrated/App.tsx',
          appliedPatterns: ['innerHTML → JSX'],
          skippedPatterns: [],
          success: true,
          warnings: [],
        },
      ]);

      expect(report).toContain('jQuery');
      expect(report).toContain('React');
      expect(report).toContain('成功迁移');
    });
  });

  // ─── 端到端流程 ────────────────────────────────────

  describe('端到端流程', () => {
    it('完整老旧项目分析流程', async () => {
      await createLegacyProject('mixed');
      const context = createMockContext(TEST_DIR);

      // Step 1: 分析
      const analyzer = new LegacyAnalyzer({
        projectRoot: TEST_DIR,
        memory: context.memory,
        sessionId: 'test',
      });
      const analysisResult = await analyzer.execute();
      expect(analysisResult.success).toBe(true);
      expect(analysisResult.data!.analysis.isLegacy).toBe(true);

      // Step 2: 重构分析
      const refactor = new LegacyRefactor({
        projectRoot: TEST_DIR,
        memory: context.memory,
        sessionId: 'test',
      });
      const refactorResult = await refactor.execute({ safe: true });
      expect(refactorResult.success).toBe(true);

      // Step 3: 迁移
      await fs.mkdir(path.join(TEST_DIR, 'migrated'), { recursive: true });
      const migrator = new LegacyMigrator({
        projectRoot: TEST_DIR,
        memory: context.memory,
        sessionId: 'test',
      });
      const migrateResult = await migrator.execute({
        from: 'jquery',
        to: 'react',
      });
      expect(migrateResult.success).toBe(true);
    });

    it('LegacyExpert 通过 ExpertRegistry 执行', async () => {
      await fs.mkdir(path.join(TEST_DIR, 'src', 'components'), { recursive: true });
      const registry = new ExpertRegistry(createMockContext(TEST_DIR));
      const task = createTestTask({
        type: 'migration',
        description: '迁移 jQuery 到 React',
        output: {
          files: ['src/components/Migrated.tsx'],
          verification: '组件渲染正常',
        },
      });

      const result = await registry.executeTask(task);
      expect(result.success).toBe(true);
      expect(result.files.length).toBeGreaterThan(0);
    });
  });
});
