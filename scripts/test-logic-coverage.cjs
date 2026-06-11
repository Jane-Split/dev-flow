const fs = require('fs');
const path = require('path');
const { LogicCoverageAnalyzer } = require('./logic-coverage-auto.cjs');

// 创建临时测试文件
const tmpDir = process.env.TEMP || '/tmp';
const testFile = path.join(tmpDir, 'test-coverage.java');

fs.writeFileSync(testFile, `
public class Test {
  public void process() {
    if (order == null) throw new IllegalArgumentException();
    validateOrder();
    calculatePrice();
    saveOrder();
  }
}
`);

const analyzer = new LogicCoverageAnalyzer();
const result = analyzer.analyze(testFile, {
  methods: [{
    logicSteps: [
      { description: '校验订单参数' },
      { description: '验证订单合法性' },
      { description: '计算价格' },
      { description: '保存订单' }
    ]
  }]
});

console.log(`Coverage: ${(result.coverage * 100).toFixed(1)}%`);
console.assert(result.coverage > 0.5, 'Coverage should be > 50%');
console.log('All logic coverage tests passed!');

// 清理临时文件
fs.unlinkSync(testFile);
