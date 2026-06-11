const { CompletenessGate } = require('./completeness-gate.cjs');

// Test 1: Pass case
const gate1 = new CompletenessGate();
const result1 = gate1.check({
  taskBrief: 'test',
  dependencies: [
    { path: 'UserService.java', content: 'public class UserService {}', originalSize: 1024 }
  ]
});
console.assert(result1.passed === true, 'Test 1 failed: should pass');

// Test 2: Truncated dependency
const result2 = gate1.check({
  taskBrief: 'test',
  dependencies: [
    { path: 'OrderService.java', content: '/* 文件过大(85KB)，内容省略... */', originalSize: 87040 }
  ]
});
console.assert(result2.passed === false, 'Test 2 failed: should block truncated');
console.assert(result2.recommendation.action === 'ON_DEMAND_LOAD', 'Test 2 failed: should suggest on-demand');

// Test 3: Missing core dependency
const result3 = gate1.check({
  taskBrief: 'test',
  dependencies: [
    { path: 'OrderService.java', content: null }
  ]
});
console.assert(result3.passed === false, 'Test 3 failed: should block missing core');

console.log('All completeness gate tests passed!');
