const fs = require('fs');
const path = require('path');
const { ValidationWorker } = require('./validation-worker.cjs');
const { submitValidation, readValidationResult } = require('./validate-result.cjs');

async function test() {
  const tmpDir = path.join(process.cwd(), 'tmp-test');
  const resultsDir = path.join(tmpDir, 'validation-results');

  // 清理并创建测试目录
  if (fs.existsSync(tmpDir)) {
    fs.rmSync(tmpDir, { recursive: true });
  }
  fs.mkdirSync(resultsDir, { recursive: true });

  // 创建测试文件
  const testFile = path.join(tmpDir, 'TestValid.java');
  fs.writeFileSync(testFile, 'public class TestValid { public String hello() { return "world"; } }');

  // 测试 Layer 1 验证
  const worker = new ValidationWorker({ resultsDir });
  const result = await worker.validate('test-task', testFile, null);

  console.assert(result.status === 'PASSED', 'Valid file should pass');
  console.assert(result.layer_1.passed === true, 'Layer 1 should pass');

  // 测试读取摘要
  const summary = readValidationResult('test-task', { resultsDir });
  console.assert(summary.passed === true, 'Summary should indicate passed');
  console.assert(summary.blockingCount === 0, 'Should have no blocking issues');

  // 测试异步提交
  const submitResult = await submitValidation('async-task', testFile, null, { resultsDir });
  console.assert(submitResult.status === 'SUBMITTED', 'Should return SUBMITTED');
  console.assert(submitResult.taskId === 'async-task', 'Should return correct taskId');

  // 等待异步验证完成
  await new Promise(resolve => setTimeout(resolve, 2000));

  const asyncSummary = readValidationResult('async-task', { resultsDir });
  console.assert(asyncSummary.passed === true, 'Async summary should indicate passed');

  // 清理
  fs.rmSync(tmpDir, { recursive: true });

  console.log('All validation decoupling tests passed!');
}

test().catch(console.error);
