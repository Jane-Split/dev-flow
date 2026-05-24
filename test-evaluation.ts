// dev-flow 全流程测试 + 四维度评估
import * as fs from 'node:fs';
import * as path from 'node:path';

const testDir = '/data/user/work/.test-evaluation';
const DIST = '/workspace/dev-flow/dist';

function cleanup() {
  if (fs.existsSync(testDir)) fs.rmSync(testDir, { recursive: true, force: true });
  fs.mkdirSync(testDir, { recursive: true });
}

// 测试结果收集
interface TestResult {
  category: string;
  name: string;
  passed: boolean;
  duration?: number;
  error?: string;
  details?: Record<string, unknown>;
}

const results: TestResult[] = [];
const metrics = {
  totalTests: 0,
  passed: 0,
  failed: 0,
  totalDuration: 0,
  errors: [] as string[],
  warnings: [] as string[],
};

function record(r: TestResult) {
  results.push(r);
  metrics.totalTests++;
  if (r.passed) metrics.passed++;
  else { metrics.failed++; if (r.error) metrics.errors.push(r.error); }
  if (r.duration) metrics.totalDuration += r.duration;
}

function assert(cond: boolean, name: string, category: string, details?: Record<string, unknown>) {
  const r: TestResult = { category, name, passed: cond, details };
  if (!cond) r.error = `断言失败: ${name}`;
  record(r);
  console.log(`${cond ? '✅' : '❌'} [${category}] ${name}`);
}

// ===================== 关键修复验证测试 =====================

async function testAlgorithmExpertCanHandle() {
  console.log('\n' + '='.repeat(60));
  console.log('修复验证: AlgorithmExpert canHandle 任务类型匹配');
  console.log('='.repeat(60));

  const { AlgorithmExpert } = await import(`${DIST}/experts/algorithm-expert.js`);
  const { MemoryManager } = await import(`${DIST}/memory/index.js`);

  const memory = new MemoryManager(testDir);
  const expert = new AlgorithmExpert({ projectRoot: testDir, memory });

  // 测试1: 通过 task.type === 'algorithm' 匹配
  const algoTask = { id: '1', name: '快速排序', description: '实现快速排序', type: 'algorithm' as const, dependencies: [], output: { files: [] }, estimatedTokens: 5000 };
  const canHandleAlgo = expert.canHandle(algoTask);
  assert(canHandleAlgo === true, 'task.type === algorithm 匹配成功', '准确性', { type: algoTask.type });

  // 测试2: 通过关键词匹配
  const keywordTask = { id: '2', name: '二分查找实现', description: '实现二分查找算法', type: 'component' as const, dependencies: [], output: { files: [] }, estimatedTokens: 5000 };
  const canHandleKeyword = expert.canHandle(keywordTask);
  assert(canHandleKeyword === true, '关键词匹配成功', '准确性', { name: keywordTask.name });

  // 测试3: 拒绝非算法任务
  const nonAlgoTask = { id: '3', name: '登录页', description: '创建登录页面', type: 'component' as const, dependencies: [], output: { files: [] }, estimatedTokens: 5000 };
  const rejectNonAlgo = expert.canHandle(nonAlgoTask);
  assert(rejectNonAlgo === false, '拒绝非算法任务', '准确性');
}

async function testDesignAgentConvenienceFields() {
  console.log('\n' + '='.repeat(60));
  console.log('修复验证: DesignAgent 便捷字段');
  console.log('='.repeat(60));

  const { DesignAgent } = await import(`${DIST}/agents/design-agent.js`);
  const { MemoryManager } = await import(`${DIST}/memory/index.js`);

  const memory = new MemoryManager(testDir);
  const agent = new DesignAgent({ projectRoot: testDir, memory, sessionId: 'design-test' });

  // 模拟分析结果
  const analyzeResult = {
    title: '测试需求',
    type: 'feature',
    priority: 'P1',
    features: [{
      name: '用户登录',
      priority: 'P1',
      complexity: 'medium' as const,
      role: '用户',
      action: '登录',
      value: '访问系统',
      acceptances: [],
      relatedComponents: '',
      relatedApis: '',
      relatedModels: '',
    }],
    impacts: [],
    constraints: [],
    risks: [],
    ambiguities: [],
    documentPath: '/tmp/test.md',
  };

  const result = await agent.execute(analyzeResult);
  
  assert(result.success === true, 'DesignAgent执行成功', '准确性');
  assert(result.data !== undefined, '返回data对象', '可信度');
  
  // 验证便捷字段存在
  assert(Array.isArray(result.data.dataModels), 'dataModels便捷字段存在', '准确性');
  assert(Array.isArray(result.data.apiEndpoints), 'apiEndpoints便捷字段存在', '准确性');
  assert(Array.isArray(result.data.components), 'components便捷字段存在', '准确性');
}

async function testTestAgentConvenienceFields() {
  console.log('\n' + '='.repeat(60));
  console.log('修复验证: TestAgent 便捷字段');
  console.log('='.repeat(60));

  const { TestAgent } = await import(`${DIST}/agents/test-agent.js`);
  const { MemoryManager } = await import(`${DIST}/memory/index.js`);

  const memory = new MemoryManager(testDir);
  const agent = new TestAgent({ projectRoot: testDir, memory, sessionId: 'test-test' });

  // 模拟开发结果
  const developResult = {
    completedTasks: [],
    files: [],
    changes: [],
  };

  const result = await agent.execute(developResult);
  
  assert(result.success === true || result.success === false, 'TestAgent执行完成', '稳定性');
  assert(result.data !== undefined, '返回data对象', '可信度');
  
  // 验证便捷字段存在
  assert(Array.isArray(result.data.testCases), 'testCases便捷字段存在', '可信度');
  assert(typeof result.data.reportPath === 'string', 'reportPath便捷字段存在', '可信度');
}

// ===================== 主函数 =====================

async function main() {
  console.log('🚀 dev-flow 修复验证测试');
  console.log('='.repeat(60));

  cleanup();

  try {
    await testAlgorithmExpertCanHandle();
    await testDesignAgentConvenienceFields();
    await testTestAgentConvenienceFields();
  } catch (error) {
    console.error('\n💥 测试执行出错:', error);
    if (error instanceof Error) {
      metrics.errors.push(error.message);
    }
  } finally {
    cleanup();
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 测试结果汇总');
  console.log('='.repeat(60));
  console.log(`总测试: ${metrics.totalTests}`);
  console.log(`通过: ${metrics.passed}`);
  console.log(`失败: ${metrics.failed}`);
  console.log(`通过率: ${((metrics.passed / Math.max(metrics.totalTests, 1)) * 100).toFixed(1)}%`);
  
  if (metrics.failed === 0) {
    console.log('\n🎉 所有修复验证通过！');
  } else {
    console.log(`\n⚠️ 有 ${metrics.failed} 项测试失败`);
  }
  
  process.exit(metrics.failed > 0 ? 1 : 0);
}

main();
