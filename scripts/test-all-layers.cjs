/**
 * 全链路集成测试 — 覆盖所有 5 层上下文可靠性优化功能
 */
const fs = require('fs');
const path = require('path');

// 引入所有新模块
const { CompletenessGate } = require('./completeness-gate.cjs');
const { StaticValidationSuite } = require('./static-validation-suite.cjs');
const { calculateBudget } = require('./dynamic-budget.cjs');
const { CheckpointManager } = require('./checkpoint-manager.cjs');
const { MethodDependencyGraph } = require('./method-dependency-graph.cjs');
const { LogicCoverageAnalyzer } = require('./logic-coverage-auto.cjs');
const { DependencyResolver } = require('./dependency-resolver.cjs');
const { PartialDelivery } = require('./partial-delivery.cjs');
const { CompileLoopManager } = require('./compile-loop-manager.cjs');
const { FeatureFlagManager } = require('./feature-flag-manager.cjs');

async function runAllTests() {
  console.log('=== Dev-Flow Context Reliability Optimization Tests ===\n');

  let passed = 0;
  let failed = 0;

  function test(name, fn) {
    try {
      fn();
      console.log(`  ✓ ${name}`);
      passed++;
    } catch (e) {
      console.error(`  ✗ ${name}: ${e.message}`);
      failed++;
    }
  }

  // Test 1: Layer 1 - Completeness Gate
  console.log('[Layer 1] Testing Completeness Gate...');
  test('Pass with valid deps', () => {
    const gate = new CompletenessGate();
    const r = gate.check({
      taskBrief: 'test',
      dependencies: [{ path: 'Test.java', content: 'class Test {}', originalSize: 100 }]
    });
    if (r.passed !== true) throw new Error('Should pass');
  });

  test('Block truncated deps', () => {
    const gate = new CompletenessGate();
    const r = gate.check({
      taskBrief: 'test',
      dependencies: [{ path: 'Test.java', content: '/* 文件过大... */', originalSize: 100000 }]
    });
    if (r.passed !== false) throw new Error('Should block');
    if (r.recommendation.action !== 'ON_DEMAND_LOAD') throw new Error('Should suggest on-demand');
  });

  // Test 2: Layer 1 - Static Validation
  console.log('\n[Layer 1] Testing Static Validation Suite...');
  fs.writeFileSync('/tmp/TestValid.java', 'public class TestValid { public String hello() { return "world"; } }');
  fs.writeFileSync('/tmp/test-invalid.java', 'public class test_invalid { // TODO public String hello() { return null; } public void empty() {} }');

  test('Valid file passes', () => {
    const suite = new StaticValidationSuite({ language: 'java' });
    const r = suite.run('/tmp/TestValid.java');
    if (r.passed !== true) throw new Error('Should pass');
  });

  test('Invalid file fails', () => {
    const suite = new StaticValidationSuite({ language: 'java' });
    const r = suite.run('/tmp/test-invalid.java');
    if (r.passed !== false) throw new Error('Should fail');
  });

  // Test 3: Layer 1 - Dynamic Budget
  console.log('\n[Layer 1] Testing Dynamic Budget...');
  test('Claude budget > mini budget', () => {
    const b1 = calculateBudget('claude-3-5-sonnet');
    const b2 = calculateBudget('gpt-4o-mini');
    if (b1.briefSizeKB < b2.briefSizeKB) throw new Error('Claude should have larger budget');
    if (b1.briefSizeKB < 30) throw new Error('Budget should be >= 30KB');
  });

  // Test 4: Layer 2 - Checkpoint Manager
  console.log('\n[Layer 2] Testing Checkpoint Manager...');
  test('Create and restore checkpoint', () => {
    const taskId = 'test-task-' + Date.now();
    const mgr = new CheckpointManager(taskId, { checkpointDir: '/tmp/checkpoints' });
    const seq = mgr.create('TEST', { filePath: '/tmp/test.java', content: 'class Test {}' }, { totalMethods: 1 }, { tokensUsed: 100 });
    if (seq !== 1) throw new Error('First checkpoint should be #1');

    const restored = mgr.restore(1);
    if (restored.state !== 'TEST') throw new Error('Should restore correct state');
  });

  // Test 5: Layer 2 - Method Dependency Graph
  console.log('\n[Layer 2] Testing Method Dependency Graph...');
  test('Topological sort order', () => {
    const graph = new MethodDependencyGraph();
    const plan = graph.generateFillPlan({
      methods: [
        { name: 'createOrder', logicSteps: [{ description: '调用 validateOrder' }] },
        { name: 'validateOrder', logicSteps: [] },
        { name: 'saveOrder', logicSteps: [{ description: '调用 createOrder' }] }
      ]
    });
    if (plan.order[0] !== 'validateOrder') throw new Error('validateOrder should be first');
    if (plan.order.indexOf('createOrder') >= plan.order.indexOf('saveOrder')) {
      throw new Error('createOrder should be before saveOrder');
    }
  });

  // Test 6: Layer 4 - Logic Coverage Auto
  console.log('\n[Layer 4] Testing Logic Coverage Analyzer...');
  fs.writeFileSync('/tmp/test-coverage.java', `
    public class Test {
      public void process() {
        if (order == null) throw new IllegalArgumentException();
        validateOrder();
        calculatePrice();
        saveOrder();
      }
    }
  `);

  test('Coverage analysis', () => {
    const analyzer = new LogicCoverageAnalyzer();
    const result = analyzer.analyze('/tmp/test-coverage.java', {
      methods: [{
        logicSteps: [
          { description: '校验订单参数' },
          { description: '验证订单合法性' },
          { description: '计算价格' },
          { description: '保存订单' }
        ]
      }]
    });
    if (result.coverage <= 0.5) throw new Error('Coverage should be > 50%');
  });

  // Test 7: Layer 3 - Dependency Resolver
  console.log('\n[Layer 3] Testing Dependency Resolver...');
  test('Resolver returns valid status', () => {
    const resolver = new DependencyResolver({ projectRoot: '/tmp' });
    const result = resolver.resolve('Test');
    if (!['NOT_FOUND', 'UNIQUE', 'AMBIGUOUS'].includes(result.status)) {
      throw new Error('Should return valid status');
    }
  });

  // Test 8: Layer 5 - Partial Delivery
  console.log('\n[Layer 5] Testing Partial Delivery...');
  test('Generate partial report', () => {
    const pd = new PartialDelivery({ outputDir: '/tmp/pending' });
    const report = pd.generateReport([
      { id: 'T1', name: 'Task 1', classification: 'CORE', outputPath: '/tmp/T1.java' },
      { id: 'T2', name: 'Task 2', classification: 'EDGE', outputPath: '/tmp/T2.java' }
    ], {
      T1: { status: 'SUCCESS' },
      T2: { status: 'FAILED', reason: 'Context insufficient' }
    });
    if (report.report.summary.completed !== 1) throw new Error('Should have 1 completed');
    if (report.report.summary.failed !== 1) throw new Error('Should have 1 failed');
  });

  // Test 9: Layer 4 - Compile Loop Manager
  console.log('\n[Layer 4] Testing Compile Loop Manager...');
  test('Compile loop rounds', () => {
    const manager = new CompileLoopManager({ taskId: 'test-task', logsDir: '/tmp/compile-logs' });

    const r1 = manager.startRound('Error 1');
    if (!r1.canContinue) throw new Error('Round 1 should continue');
    if (r1.strategy !== 'KEEP_FULL') throw new Error('Round 1 should keep full');

    const r2 = manager.startRound('Error 2');
    if (!r2.canContinue) throw new Error('Round 2 should continue');
    if (r2.strategy !== 'COMPRESS_HISTORY') throw new Error('Round 2 should compress');

    const r3 = manager.startRound('Error 3');
    if (!r3.canContinue) throw new Error('Round 3 should continue');
    if (r3.strategy !== 'PURGE_HISTORY') throw new Error('Round 3 should purge');

    const r4 = manager.startRound('Error 4');
    if (r4.canContinue) throw new Error('Round 4 should not continue');
  });

  // Test 10: Feature Flags
  console.log('\n[Global] Testing Feature Flags...');
  fs.writeFileSync('/tmp/test-flags.yaml', `
features:
  test_feature:
    enabled: true
    description: "Test"
    fallback: "Fallback"
`);

  test('Feature flag manager', () => {
    const manager = new FeatureFlagManager('/tmp/test-flags.yaml');
    if (!manager.isEnabled('test_feature')) throw new Error('Should be enabled');
    manager.toggle('test_feature');
    if (manager.isEnabled('test_feature')) throw new Error('Should be disabled after toggle');
  });

  // Summary
  console.log('\n=== Test Summary ===');
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Total: ${passed + failed}`);

  process.exit(failed > 0 ? 1 : 0);
}

runAllTests().catch(e => {
  console.error('Test runner failed:', e);
  process.exit(1);
});
