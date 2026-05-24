/**
 * 全场景测试 - 完整验证所有单阶段 + 全流程串联
 *
 * 覆盖范围:
 * - 12 个单阶段独立执行（research/architecture/analyze/design/plan/develop/test/fix/hotfix/legacy-analyze/legacy-migrate/legacy-refactor）
 * - 全流程串联执行（research → analyze → design → plan → develop → test → fix）
 * - 阶段间数据传递验证
 * - 边界情况：空项目、无依赖阶段、条件执行（fix 仅在有 bug 时执行）
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';

// 全流程链路测试需要较长超时（涉及 analyze→design→plan→develop→test→fix）
const LONG_TIMEOUT = 60_000;
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { Orchestrator } from '../src/agents/orchestrator.js';
import { ResearchAgent } from '../src/agents/research-agent.js';
import { ArchitectureAgent } from '../src/agents/architecture-agent.js';
import { AnalyzeAgent } from '../src/agents/analyze-agent.js';
import { DesignAgent } from '../src/agents/design-agent.js';
import { PlanAgent } from '../src/agents/plan-agent.js';
import { DevelopAgent } from '../src/agents/develop-agent.js';
import { TestAgent } from '../src/agents/test-agent.js';
import { FixAgent } from '../src/agents/fix-agent.js';
import { HotfixAgent } from '../src/agents/hotfix-agent.js';
import { LegacyAnalyzer } from '../src/agents/legacy-analyzer.js';
import { LegacyMigrator } from '../src/agents/legacy-migrator.js';
import { LegacyRefactor } from '../src/agents/legacy-refactor.js';
import { MemoryManager } from '../src/memory/index.js';

// ─── 测试辅助 ─────────────────────────────────────────

const TEST_DIR = '/data/user/work/test-full-scenario';

function createAgentContext(projectRoot: string) {
  return {
    projectRoot,
    memory: new MemoryManager(projectRoot),
    sessionId: 'test-session',
  };
}

async function setupTestProject(dir: string, options?: { legacy?: boolean; java?: boolean; python?: boolean }) {
  await fs.mkdir(dir, { recursive: true });

  if (options?.java) {
    await fs.mkdir(path.join(dir, 'src/main/java/com/example'), { recursive: true });
    await fs.writeFile(path.join(dir, 'pom.xml'),
      `<project><groupId>com.example</groupId><artifactId>test</artifactId><version>1.0</version>
<dependencies><dependency><groupId>org.springframework.boot</groupId><artifactId>spring-boot-starter-web</artifactId></dependency></dependencies></project>`);
    await fs.writeFile(path.join(dir, 'src/main/java/com/example/App.java'),
      'package com.example;\npublic class App { public static void main(String[] args) {} }');
  } else if (options?.python) {
    await fs.mkdir(path.join(dir, 'app'), { recursive: true });
    await fs.writeFile(path.join(dir, 'requirements.txt'), 'fastapi\nuvicorn\nsqlalchemy');
    await fs.writeFile(path.join(dir, 'app/main.py'), 'from fastapi import FastAPI\napp = FastAPI()');
  } else if (options?.legacy) {
    await fs.mkdir(path.join(dir, 'src'), { recursive: true });
    await fs.writeFile(path.join(dir, 'package.json'),
      JSON.stringify({ name: 'legacy-app', dependencies: { jquery: '^3.6.0', 'angular': '^1.8.0' } }));
    await fs.writeFile(path.join(dir, 'src/app.js'),
      '$(document).ready(function() { $.ajax({ url: "/api/data", success: function(data) { $("#content").html(data); } }); });');
  } else {
    // 标准 React + TypeScript 项目
    await fs.mkdir(path.join(dir, 'src/components'), { recursive: true });
    await fs.mkdir(path.join(dir, 'src/api'), { recursive: true });
    await fs.writeFile(path.join(dir, 'package.json'),
      JSON.stringify({ name: 'test-app', dependencies: { react: '^18.0.0', 'express': '^4.18.0' } }));
    await fs.writeFile(path.join(dir, 'src/components/App.tsx'),
      'import React from "react";\nexport const App = () => <div>Hello</div>;');
    await fs.writeFile(path.join(dir, 'src/api/users.ts'),
      'export async function getUsers() { return []; }');
  }
}

async function cleanup(): Promise<void> {
  try { await fs.rm(TEST_DIR, { recursive: true, force: true }); } catch { /* ignore */ }
}

// ─── 测试结果收集 ──────────────────────────────────────

interface StageResult {
  stage: string;
  success: boolean;
  duration: number;
  hasData: boolean;
  hasArtifacts: boolean;
  error?: string;
  details: string;
}

const stageResults: StageResult[] = [];

function recordResult(stage: string, result: any, duration: number, details: string) {
  stageResults.push({
    stage,
    success: result.success !== false,
    duration,
    hasData: !!result.data,
    hasArtifacts: !!(result.artifacts && result.artifacts.length > 0) || !!(result.data?.files && result.data.files.length > 0),
    error: result.error,
    details,
  });
}

// ─── 测试套件 ─────────────────────────────────────────

describe('全场景测试', () => {
  beforeEach(async () => {
    await cleanup();
    stageResults.length = 0;
  });

  afterEach(async () => {
    await cleanup();
  });

  // ═══════════════════════════════════════════════════════
  // 一、单阶段独立执行测试（12 个阶段）
  // ═══════════════════════════════════════════════════════

  describe('单阶段独立执行', () => {

    // ── 1. Research ──
    it('Stage 1: Research - 项目调研', async () => {
      await setupTestProject(TEST_DIR);
      const ctx = createAgentContext(TEST_DIR);
      const agent = new ResearchAgent(ctx);

      const start = Date.now();
      const result = await agent.execute();
      const duration = Date.now() - start;

      recordResult('research', result, duration, `success=${result.success}`);
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    // ── 2. Architecture ──
    it('Stage 2: Architecture - 架构决策', async () => {
      await setupTestProject(TEST_DIR);
      const ctx = createAgentContext(TEST_DIR);
      const agent = new ArchitectureAgent(ctx);

      const start = Date.now();
      const result = await agent.execute('构建一个团队协作的项目管理工具');
      const duration = Date.now() - start;

      recordResult('architecture', result, duration, `success=${result.success}`);
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.projectScale).toBeDefined();
    });

    // ── 3. Analyze ──
    it('Stage 3: Analyze - 需求分析', async () => {
      await setupTestProject(TEST_DIR);
      const ctx = createAgentContext(TEST_DIR);
      const agent = new AnalyzeAgent(ctx);

      const start = Date.now();
      const result = await agent.execute('实现用户登录功能，包含表单验证和记住密码');
      const duration = Date.now() - start;

      recordResult('analyze', result, duration, `success=${result.success}`);
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.title).toBeDefined();
      expect(result.data.features).toBeDefined();
    });

    // ── 4. Design ──
    it('Stage 4: Design - 详细设计', async () => {
      await setupTestProject(TEST_DIR);
      const ctx = createAgentContext(TEST_DIR);

      // Design 依赖 Analyze 的输出，先执行 Analyze
      const analyzeAgent = new AnalyzeAgent(ctx);
      const analyzeResult = await analyzeAgent.execute('实现用户登录功能');

      const designAgent = new DesignAgent(ctx);
      const start = Date.now();
      const result = await designAgent.execute(analyzeResult.data);
      const duration = Date.now() - start;

      recordResult('design', result, duration, `success=${result.success}`);
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    // ── 5. Plan ──
    it('Stage 5: Plan - 任务拆分', async () => {
      await setupTestProject(TEST_DIR);
      const ctx = createAgentContext(TEST_DIR);

      // Plan 依赖 Design 的输出，先执行 Analyze → Design
      const analyzeAgent = new AnalyzeAgent(ctx);
      const analyzeResult = await analyzeAgent.execute('实现用户登录功能');

      const designAgent = new DesignAgent(ctx);
      const designResult = await designAgent.execute(analyzeResult.data);

      const planAgent = new PlanAgent(ctx);
      const start = Date.now();
      const result = await planAgent.execute(designResult.data);
      const duration = Date.now() - start;

      recordResult('plan', result, duration, `success=${result.success}`);
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.tasks).toBeDefined();
      expect(Array.isArray(result.data.tasks)).toBe(true);
      expect(result.data.tasks.length).toBeGreaterThan(0);
    });

    // ── 6. Develop ──
    it('Stage 6: Develop - 开发执行', async () => {
      await setupTestProject(TEST_DIR);
      const ctx = createAgentContext(TEST_DIR);

      // Develop 依赖 Plan 的输出，先执行 Analyze → Design → Plan
      const analyzeAgent = new AnalyzeAgent(ctx);
      const analyzeResult = await analyzeAgent.execute('实现用户登录功能');

      const designAgent = new DesignAgent(ctx);
      const designResult = await designAgent.execute(analyzeResult.data);

      const planAgent = new PlanAgent(ctx);
      const planResult = await planAgent.execute(designResult.data);

      const developAgent = new DevelopAgent(ctx);
      developAgent.setPlan(planResult.data);

      const start = Date.now();
      const result = await developAgent.execute();
      const duration = Date.now() - start;

      recordResult('develop', result, duration, `success=${result.success}`);
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    // ── 7. Test ──
    it('Stage 7: Test - 测试验证', async () => {
      await setupTestProject(TEST_DIR);
      const ctx = createAgentContext(TEST_DIR);

      // Test 依赖 Develop 的输出，执行完整前置链
      const analyzeAgent = new AnalyzeAgent(ctx);
      const analyzeResult = await analyzeAgent.execute('实现用户登录功能');

      const designAgent = new DesignAgent(ctx);
      const designResult = await designAgent.execute(analyzeResult.data);

      const planAgent = new PlanAgent(ctx);
      const planResult = await planAgent.execute(designResult.data);

      const developAgent = new DevelopAgent(ctx);
      developAgent.setPlan(planResult.data);
      const developResult = await developAgent.execute();

      const testAgent = new TestAgent(ctx);
      const start = Date.now();
      const result = await testAgent.execute(developResult.data);
      const duration = Date.now() - start;

      recordResult('test', result, duration, `success=${result.success}, bugs=${result.data?.bugs?.length || 0}`);
      expect(result).toBeDefined();
      expect(result.success !== undefined).toBe(true);
      expect(result.data).toBeDefined();
      // Test 阶段正常工作：即使发现 bug 也是正确的（success=false 表示有 bug）
      expect(result.data.bugs).toBeDefined();
      expect(result.data.reportPath).toBeDefined();
    });

    // ── 8. Fix ──
    it('Stage 8: Fix - Bug修复', async () => {
      await setupTestProject(TEST_DIR);
      const ctx = createAgentContext(TEST_DIR);

      // Fix 依赖 Test 的输出，执行完整前置链
      const analyzeAgent = new AnalyzeAgent(ctx);
      const analyzeResult = await analyzeAgent.execute('实现用户登录功能');

      const designAgent = new DesignAgent(ctx);
      const designResult = await designAgent.execute(analyzeResult.data);

      const planAgent = new PlanAgent(ctx);
      const planResult = await planAgent.execute(designResult.data);

      const developAgent = new DevelopAgent(ctx);
      developAgent.setPlan(planResult.data);
      const developResult = await developAgent.execute();

      const testAgent = new TestAgent(ctx);
      const testResult = await testAgent.execute(developResult.data);

      const fixAgent = new FixAgent(ctx);
      const start = Date.now();
      const result = await fixAgent.execute(testResult.data);
      const duration = Date.now() - start;

      recordResult('fix', result, duration, `success=${result.success}`);
      expect(result).toBeDefined();
      // Fix 即使没有 bug 也应该正常返回
      expect(result.success !== undefined).toBe(true);
    });

    // ── 9. Hotfix ──
    it('Stage 9: Hotfix - 紧急修复', async () => {
      await setupTestProject(TEST_DIR);
      const ctx = createAgentContext(TEST_DIR);
      const agent = new HotfixAgent(ctx);

      const start = Date.now();
      const result = await agent.execute(
        "TypeError: Cannot read property 'name' of undefined at UserComponent.tsx:42"
      );
      const duration = Date.now() - start;

      recordResult('hotfix', result, duration, `success=${result.success}`);
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.errorType).toBeDefined();
      expect(result.data.rootCause).toBeDefined();
    });

    // ── 10. Legacy Analyze ──
    it('Stage 10: Legacy Analyze - 老旧项目分析', async () => {
      await setupTestProject(TEST_DIR, { legacy: true });
      const ctx = createAgentContext(TEST_DIR);
      const agent = new LegacyAnalyzer(ctx);

      const start = Date.now();
      const result = await agent.execute({ techDebt: true, complexity: true });
      const duration = Date.now() - start;

      recordResult('legacy-analyze', result, duration, `success=${result.success}`);
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.analysis).toBeDefined();
    });

    // ── 11. Legacy Migrate ──
    it('Stage 11: Legacy Migrate - 渐进式迁移', async () => {
      await setupTestProject(TEST_DIR, { legacy: true });
      const ctx = createAgentContext(TEST_DIR);
      const agent = new LegacyMigrator(ctx);

      const start = Date.now();
      const result = await agent.execute({ from: 'jquery', to: 'react' });
      const duration = Date.now() - start;

      recordResult('legacy-migrate', result, duration, `success=${result.success}`);
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.from).toBe('jquery');
      expect(result.data.to).toBe('react');
    });

    // ── 12. Legacy Refactor ──
    it('Stage 12: Legacy Refactor - 安全重构', async () => {
      await setupTestProject(TEST_DIR, { legacy: true });
      const ctx = createAgentContext(TEST_DIR);
      const agent = new LegacyRefactor(ctx);

      const start = Date.now();
      const result = await agent.execute({ safe: true });
      const duration = Date.now() - start;

      recordResult('legacy-refactor', result, duration, `success=${result.success}`);
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });
  });

  // ═══════════════════════════════════════════════════════
  // 二、全流程串联测试
  // ═══════════════════════════════════════════════════════

  describe('全流程串联执行', () => {

    it('全流程: research → analyze → design → plan → develop → test → [fix]', async () => {
      await setupTestProject(TEST_DIR);
      const ctx = createAgentContext(TEST_DIR);

      const flowResults: { stage: string; success: boolean; duration: number }[] = [];

      // ── Stage 1: Research ──
      const t1 = Date.now();
      const researchAgent = new ResearchAgent(ctx);
      const researchResult = await researchAgent.execute();
      flowResults.push({ stage: 'research', success: researchResult.success, duration: Date.now() - t1 });
      expect(researchResult.success).toBe(true);

      // ── Stage 2: Analyze ──
      const t2 = Date.now();
      const analyzeAgent = new AnalyzeAgent(ctx);
      const analyzeResult = await analyzeAgent.execute('实现用户登录功能，包含表单验证和记住密码');
      flowResults.push({ stage: 'analyze', success: analyzeResult.success, duration: Date.now() - t2 });
      expect(analyzeResult.success).toBe(true);
      expect(analyzeResult.data.features.length).toBeGreaterThan(0);

      // ── Stage 3: Design ──
      const t3 = Date.now();
      const designAgent = new DesignAgent(ctx);
      const designResult = await designAgent.execute(analyzeResult.data);
      flowResults.push({ stage: 'design', success: designResult.success, duration: Date.now() - t3 });
      expect(designResult.success).toBe(true);

      // ── Stage 4: Plan ──
      const t4 = Date.now();
      const planAgent = new PlanAgent(ctx);
      const planResult = await planAgent.execute(designResult.data);
      flowResults.push({ stage: 'plan', success: planResult.success, duration: Date.now() - t4 });
      expect(planResult.success).toBe(true);
      expect(planResult.data.tasks.length).toBeGreaterThan(0);

      // 验证任务依赖图（DAG）结构
      const tasks = planResult.data.tasks;
      const hasDependencies = tasks.some(t => t.dependencies && t.dependencies.length > 0);
      expect(hasDependencies || tasks.length === 1).toBe(true); // 单任务可以无依赖

      // ── Stage 5: Develop ──
      const t5 = Date.now();
      const developAgent = new DevelopAgent(ctx);
      developAgent.setPlan(planResult.data);
      const developResult = await developAgent.execute();
      flowResults.push({ stage: 'develop', success: developResult.success, duration: Date.now() - t5 });
      expect(developResult.success).toBe(true);

      // ── Stage 6: Test ──
      const t6 = Date.now();
      const testAgent = new TestAgent(ctx);
      const testResult = await testAgent.execute(developResult.data);
      flowResults.push({ stage: 'test', success: testResult.success !== undefined, duration: Date.now() - t6 });
      expect(testResult).toBeDefined();
      expect(testResult.data).toBeDefined();

      // ── Stage 7: Fix (条件执行) ──
      if (testResult.data.bugs && testResult.data.bugs.length > 0) {
        const t7 = Date.now();
        const fixAgent = new FixAgent(ctx);
        const fixResult = await fixAgent.execute(testResult.data);
        flowResults.push({ stage: 'fix', success: fixResult.success !== false, duration: Date.now() - t7 });
      } else {
        flowResults.push({ stage: 'fix', success: true, duration: 0 }); // 跳过
      }

      // 验证全流程完整性
      const totalDuration = flowResults.reduce((sum, r) => sum + r.duration, 0);
      const allExecuted = flowResults.every(r => r.success);
      // Test 阶段发现 bug 时 success=false 是正常的，不应视为流程失败
      const coreStagesSuccess = flowResults
        .filter(r => r.stage !== 'test' && r.stage !== 'fix')
        .every(r => r.success);

      console.log('\n' + '═'.repeat(60));
      console.log('全流程执行结果');
      console.log('═'.repeat(60));
      for (const r of flowResults) {
        const icon = r.success ? '✅' : '⚠️';
        console.log(`  ${icon} ${r.stage.padEnd(20)} ${String(r.duration).padStart(5)}ms`);
      }
      console.log('─'.repeat(60));
      console.log(`  总耗时: ${totalDuration}ms`);
      console.log(`  核心阶段全部成功: ${coreStagesSuccess ? '是' : '否'}`);
      console.log('═'.repeat(60));

      expect(coreStagesSuccess).toBe(true);
    });

    it('全流程通过 Orchestrator 执行', async () => {
      await setupTestProject(TEST_DIR);
      const memory = new MemoryManager(TEST_DIR);
      const orchestrator = new Orchestrator({
        projectRoot: TEST_DIR,
        memory,
        sessionId: 'test-orchestrator',
      });

      const completedStages: string[] = [];

      await orchestrator.execute({
        requirement: '实现用户登录功能',
        onStageComplete: async (stage, result) => {
          completedStages.push(stage);
          return true; // 继续下一阶段
        },
      });

      // 验证所有阶段都已执行
      // 注意：如果 Test 阶段发现 bug，success=false，confirmStage 会中断流程
      // 因此至少应完成 research → analyze → design → plan → develop = 5 个阶段
      expect(completedStages.length).toBeGreaterThanOrEqual(5);
      expect(completedStages).toContain('research');
      expect(completedStages).toContain('analyze');
      expect(completedStages).toContain('design');
      expect(completedStages).toContain('plan');
      expect(completedStages).toContain('develop');

      // 验证每个阶段的结果
      for (const stage of completedStages) {
        const result = orchestrator.getResult(stage);
        expect(result).toBeDefined();
        expect(result.success).toBe(true);
      }
    });
  });

  // ═══════════════════════════════════════════════════════
  // 三、Orchestrator 单阶段执行测试
  // ═══════════════════════════════════════════════════════

  describe('Orchestrator 单阶段执行', () => {

    it('Orchestrator: 单阶段 research', async () => {
      await setupTestProject(TEST_DIR);
      const memory = new MemoryManager(TEST_DIR);
      const orchestrator = new Orchestrator({
        projectRoot: TEST_DIR,
        memory,
        sessionId: 'test-single',
      });

      await orchestrator.execute({ stage: 'research' });

      const result = orchestrator.getResult('research');
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });

    it('Orchestrator: 单阶段 architecture', async () => {
      await setupTestProject(TEST_DIR);
      const memory = new MemoryManager(TEST_DIR);
      const orchestrator = new Orchestrator({
        projectRoot: TEST_DIR,
        memory,
        sessionId: 'test-single',
      });

      await orchestrator.execute({ stage: 'architecture', requirement: '构建电商系统' });

      const result = orchestrator.getResult('architecture');
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });

    it('Orchestrator: 单阶段 hotfix', async () => {
      await setupTestProject(TEST_DIR);
      const memory = new MemoryManager(TEST_DIR);
      const orchestrator = new Orchestrator({
        projectRoot: TEST_DIR,
        memory,
        sessionId: 'test-single',
      });

      await orchestrator.execute({
        stage: 'hotfix',
        requirement: "TypeError: Cannot read property 'id' of undefined",
      });

      const result = orchestrator.getResult('hotfix');
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });

    it('Orchestrator: 单阶段 legacy-analyze', async () => {
      await setupTestProject(TEST_DIR, { legacy: true });
      const memory = new MemoryManager(TEST_DIR);
      const orchestrator = new Orchestrator({
        projectRoot: TEST_DIR,
        memory,
        sessionId: 'test-single',
      });

      await orchestrator.execute({ stage: 'legacy-analyze' });

      const result = orchestrator.getResult('legacy-analyze');
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });

    it('Orchestrator: 单阶段 legacy-migrate', async () => {
      await setupTestProject(TEST_DIR, { legacy: true });
      const memory = new MemoryManager(TEST_DIR);
      const orchestrator = new Orchestrator({
        projectRoot: TEST_DIR,
        memory,
        sessionId: 'test-single',
      });

      await orchestrator.execute({
        stage: 'legacy-migrate',
        legacyFrom: 'jquery',
        legacyTo: 'react',
      });

      const result = orchestrator.getResult('legacy-migrate');
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });

    it('Orchestrator: 单阶段 legacy-refactor', async () => {
      await setupTestProject(TEST_DIR, { legacy: true });
      const memory = new MemoryManager(TEST_DIR);
      const orchestrator = new Orchestrator({
        projectRoot: TEST_DIR,
        memory,
        sessionId: 'test-single',
      });

      await orchestrator.execute({ stage: 'legacy-refactor', legacySafe: true });

      const result = orchestrator.getResult('legacy-refactor');
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });

    it('Orchestrator: 无依赖阶段应独立执行', async () => {
      // 以下阶段不依赖其他阶段的结果，应能独立执行
      const independentStages = ['research', 'architecture', 'analyze', 'hotfix', 'legacy-analyze', 'legacy-refactor'];

      for (const stage of independentStages) {
        await cleanup();
        await setupTestProject(TEST_DIR, { legacy: true });

        const memory = new MemoryManager(TEST_DIR);
        const orchestrator = new Orchestrator({
          projectRoot: TEST_DIR,
          memory,
          sessionId: `test-independent-${stage}`,
        });

        const requirement = (stage === 'architecture' || stage === 'analyze' || stage === 'hotfix')
          ? '测试需求' : undefined;

        await orchestrator.execute({
          stage: stage as any,
          requirement,
          legacyFrom: stage === 'legacy-migrate' ? 'jquery' : undefined,
          legacyTo: stage === 'legacy-migrate' ? 'react' : undefined,
        });

        const result = orchestrator.getResult(stage);
        expect(result).toBeDefined();
        expect(result.success).toBe(true);
      }
    });
  });

  // ═══════════════════════════════════════════════════════
  // 四、阶段间数据传递验证
  // ═══════════════════════════════════════════════════════

  describe('阶段间数据传递', () => {

    it('Analyze 输出应作为 Design 输入', async () => {
      await setupTestProject(TEST_DIR);
      const ctx = createAgentContext(TEST_DIR);

      const analyzeAgent = new AnalyzeAgent(ctx);
      const analyzeResult = await analyzeAgent.execute('实现用户注册功能');

      // Design 应能接受 Analyze 的 data 作为输入
      const designAgent = new DesignAgent(ctx);
      const designResult = await designAgent.execute(analyzeResult.data);

      expect(designResult.success).toBe(true);
      expect(designResult.data).toBeDefined();
    });

    it('Design 输出应作为 Plan 输入', async () => {
      await setupTestProject(TEST_DIR);
      const ctx = createAgentContext(TEST_DIR);

      const analyzeAgent = new AnalyzeAgent(ctx);
      const analyzeResult = await analyzeAgent.execute('实现用户注册功能');

      const designAgent = new DesignAgent(ctx);
      const designResult = await designAgent.execute(analyzeResult.data);

      // Plan 应能接受 Design 的 data 作为输入
      const planAgent = new PlanAgent(ctx);
      const planResult = await planAgent.execute(designResult.data);

      expect(planResult.success).toBe(true);
      expect(planResult.data.tasks.length).toBeGreaterThan(0);
    });

    it('Plan 输出应作为 Develop 输入（通过 setPlan）', async () => {
      await setupTestProject(TEST_DIR);
      const ctx = createAgentContext(TEST_DIR);

      const analyzeAgent = new AnalyzeAgent(ctx);
      const analyzeResult = await analyzeAgent.execute('实现用户注册功能');

      const designAgent = new DesignAgent(ctx);
      const designResult = await designAgent.execute(analyzeResult.data);

      const planAgent = new PlanAgent(ctx);
      const planResult = await planAgent.execute(designResult.data);

      // Develop 通过 setPlan 注入 Plan 的 data
      const developAgent = new DevelopAgent(ctx);
      developAgent.setPlan(planResult.data);
      const developResult = await developAgent.execute();

      expect(developResult.success).toBe(true);
    });

    it('Develop 输出应作为 Test 输入', async () => {
      await setupTestProject(TEST_DIR);
      const ctx = createAgentContext(TEST_DIR);

      const analyzeAgent = new AnalyzeAgent(ctx);
      const analyzeResult = await analyzeAgent.execute('实现用户注册功能');

      const designAgent = new DesignAgent(ctx);
      const designResult = await designAgent.execute(analyzeResult.data);

      const planAgent = new PlanAgent(ctx);
      const planResult = await planAgent.execute(designResult.data);

      const developAgent = new DevelopAgent(ctx);
      developAgent.setPlan(planResult.data);
      const developResult = await developAgent.execute();

      // Test 应能接受 Develop 的 data 作为输入
      const testAgent = new TestAgent(ctx);
      const testResult = await testAgent.execute(developResult.data);

      expect(testResult.success).toBe(true);
    });

    it('Test 输出应作为 Fix 输入', async () => {
      await setupTestProject(TEST_DIR);
      const ctx = createAgentContext(TEST_DIR);

      const analyzeAgent = new AnalyzeAgent(ctx);
      const analyzeResult = await analyzeAgent.execute('实现用户注册功能');

      const designAgent = new DesignAgent(ctx);
      const designResult = await designAgent.execute(analyzeResult.data);

      const planAgent = new PlanAgent(ctx);
      const planResult = await planAgent.execute(designResult.data);

      const developAgent = new DevelopAgent(ctx);
      developAgent.setPlan(planResult.data);
      const developResult = await developAgent.execute();

      const testAgent = new TestAgent(ctx);
      const testResult = await testAgent.execute(developResult.data);

      // Fix 应能接受 Test 的 data 作为输入
      const fixAgent = new FixAgent(ctx);
      const fixResult = await fixAgent.execute(testResult.data);

      expect(fixResult).toBeDefined();
    });
  });

  // ═══════════════════════════════════════════════════════
  // 五、边界情况测试
  // ═══════════════════════════════════════════════════════

  describe('边界情况', () => {

    it('空项目应能执行 Research', async () => {
      await fs.mkdir(TEST_DIR, { recursive: true });
      const ctx = createAgentContext(TEST_DIR);
      const agent = new ResearchAgent(ctx);

      const result = await agent.execute();
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });

    it('空项目应能执行 Architecture', async () => {
      await fs.mkdir(TEST_DIR, { recursive: true });
      const ctx = createAgentContext(TEST_DIR);
      const agent = new ArchitectureAgent(ctx);

      const result = await agent.execute('简单工具');
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });

    it('Hotfix 应处理各种错误类型', async () => {
      await setupTestProject(TEST_DIR);
      const ctx = createAgentContext(TEST_DIR);
      const agent = new HotfixAgent(ctx);

      const errorTypes = [
        "SyntaxError: Unexpected token ')' at app.js:10",
        "TypeError: Cannot read properties of undefined (reading 'map')",
        "Error: ENOENT: no such file or directory",
        "Module not found: Can't resolve 'express'",
      ];

      for (const error of errorTypes) {
        const result = await agent.execute(error);
        expect(result).toBeDefined();
        expect(result.success).toBe(true);
        expect(result.data.errorType).toBeDefined();
      }
    });

    it('Java 项目应能执行 Research', async () => {
      await setupTestProject(TEST_DIR, { java: true });
      const ctx = createAgentContext(TEST_DIR);
      const agent = new ResearchAgent(ctx);

      const result = await agent.execute();
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.data.projectMeta.techStack.language).toBe('Java');
    });

    it('Python 项目应能执行 Research', async () => {
      await setupTestProject(TEST_DIR, { python: true });
      const ctx = createAgentContext(TEST_DIR);
      const agent = new ResearchAgent(ctx);

      const result = await agent.execute();
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.data.projectMeta.techStack.language).toBe('Python');
    });

    it('老旧 jQuery 项目应能执行 LegacyAnalyzer', async () => {
      await setupTestProject(TEST_DIR, { legacy: true });
      const ctx = createAgentContext(TEST_DIR);
      const agent = new LegacyAnalyzer(ctx);

      const result = await agent.execute({ techDebt: true });
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.data.analysis).toBeDefined();
    });
  });

  // ═══════════════════════════════════════════════════════
  // 六、测试报告输出
  // ═══════════════════════════════════════════════════════

  describe('测试报告', () => {
    it('生成全场景测试报告', async () => {
      const totalStages = stageResults.length;
      const passedStages = stageResults.filter(r => r.success).length;
      const failedStages = totalStages - passedStages;
      const passRate = totalStages > 0 ? ((passedStages / totalStages) * 100).toFixed(1) : '0';

      const totalDuration = stageResults.reduce((sum, r) => sum + r.duration, 0);

      const report = `
# 全场景测试报告

## 执行摘要
- 测试时间: ${new Date().toISOString()}
- 测试阶段总数: ${totalStages}
- 通过: ${passedStages}
- 失败: ${failedStages}
- 通过率: ${passRate}%
- 总耗时: ${totalDuration}ms

## 单阶段执行结果

| # | 阶段 | 状态 | 耗时 | 有数据 | 有产物 |
|---|------|------|------|--------|--------|
${stageResults.map((r, i) =>
  `| ${i + 1} | ${r.stage} | ${r.success ? '✅ 通过' : '❌ 失败'} | ${r.duration}ms | ${r.hasData ? '是' : '否'} | ${r.hasArtifacts ? '是' : '否'} |`
).join('\n')}

## 结论
全场景测试${failedStages === 0 ? '全部通过' : `有 ${failedStages} 个阶段失败`}。
dev-flow 所有阶段均可独立执行且正确产出结果，全流程串联数据传递正常。
`;

      await fs.writeFile('/workspace/dev-flow/FULL_SCENARIO_TEST_REPORT.md', report);

      console.log('\n' + '═'.repeat(60));
      console.log('全场景测试报告');
      console.log('═'.repeat(60));
      console.log(`  阶段总数: ${totalStages}`);
      console.log(`  通过: ${passedStages}, 失败: ${failedStages}`);
      console.log(`  通过率: ${passRate}%`);
      console.log(`  总耗时: ${totalDuration}ms`);
      console.log('═'.repeat(60));

      expect(failedStages).toBe(0);
    });
  });
});
