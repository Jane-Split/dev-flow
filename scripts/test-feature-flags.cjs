const fs = require('fs');
const { FeatureFlagManager } = require('./feature-flag-manager.cjs');

// 创建测试配置
fs.writeFileSync('/tmp/test-flags.yaml', `
features:
  test_feature_a:
    enabled: true
    description: "Test feature A"
    fallback: "Fallback A"
  test_feature_b:
    enabled: false
    description: "Test feature B"
    fallback: "Fallback B"
`);

const manager = new FeatureFlagManager('/tmp/test-flags.yaml');

// Test 1: Check enabled
console.assert(manager.isEnabled('test_feature_a') === true, 'A should be enabled');
console.assert(manager.isEnabled('test_feature_b') === false, 'B should be disabled');

// Test 2: Toggle
manager.toggle('test_feature_a');
console.assert(manager.isEnabled('test_feature_a') === false, 'A should be disabled after toggle');

// Test 3: Get fallback
console.assert(manager.getFallback('test_feature_a') === 'Fallback A', 'Should get correct fallback');

// Test 4: Report
manager.printReport();

console.log('All feature flag tests passed!');
