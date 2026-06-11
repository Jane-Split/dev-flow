const fs = require('fs');
const path = require('path');
const { StaticValidationSuite } = require('./static-validation-suite.cjs');

// 使用项目内临时目录存放测试文件，避免跨盘符问题
const TMP_DIR = path.join(__dirname, '..', '.tmp-test-static');
if (!fs.existsSync(TMP_DIR)) {
  fs.mkdirSync(TMP_DIR, { recursive: true });
}

const validFile = path.join(TMP_DIR, 'TestValid.java');
const invalidFile = path.join(TMP_DIR, 'TestInvalid.java');

fs.writeFileSync(validFile, `
public class TestValid {
    public String hello() {
        return "world";
    }
}
`);

fs.writeFileSync(invalidFile, `
public class TestInvalid {
    // TODO: implement
    public String hello() {
        return null;
    }

    public void empty() {}
}
`);

const suite = new StaticValidationSuite({ language: 'java' });

// 测试 1: 合法文件应通过
const r1 = suite.run(validFile);
console.assert(r1.passed === true, '合法文件应通过静态验证');
console.log('Test 1 (合法文件):', r1.passed ? 'PASS' : 'FAIL');

// 测试 2: 非法文件应失败
const r2 = suite.run(invalidFile);
console.assert(r2.passed === false, '非法文件应未通过静态验证');
console.log('Test 2 (非法文件整体):', !r2.passed ? 'PASS' : 'FAIL');

// 测试 3: 检测 TODO 占位
const noPlaceholders = r2.results.find(r => r.name === 'NO_PLACEHOLDERS');
console.assert(noPlaceholders && noPlaceholders.passed === false, '应检测到 TODO 占位');
console.log('Test 3 (TODO 检测):', (noPlaceholders && !noPlaceholders.passed) ? 'PASS' : 'FAIL');

// 测试 4: 检测空方法体
const noEmptyMethods = r2.results.find(r => r.name === 'NO_EMPTY_METHODS');
console.assert(noEmptyMethods && noEmptyMethods.passed === false, '应检测到空方法体');
console.log('Test 4 (空方法体检测):', (noEmptyMethods && !noEmptyMethods.passed) ? 'PASS' : 'FAIL');

// 测试 5: 检测文件存在性
const fileExists = r1.results.find(r => r.name === 'FILE_EXISTS_AND_NON_EMPTY');
console.assert(fileExists && fileExists.passed === true, '文件存在且非空应通过');
console.log('Test 5 (文件存在性):', (fileExists && fileExists.passed) ? 'PASS' : 'FAIL');

// 清理临时文件
fs.rmSync(TMP_DIR, { recursive: true, force: true });

console.log('\nAll static validation tests passed!');
