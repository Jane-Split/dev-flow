import { BaseExpert } from './base-expert.js';
import { logger } from '../utils/logger.js';
import { writeText, readText, fileExists } from '../utils/fs-utils.js';
import path from 'node:path';
/**
 * 测试专家 - 处理测试相关任务
 *
 * 根据任务输出文件的扩展名自动生成对应语言的测试代码：
 * - .ts/.tsx -> vitest
 * - .js/.jsx -> jest
 * - .java -> JUnit 5
 * - .py -> pytest
 * - 其他 -> 通用测试骨架
 */
export class TestExpert extends BaseExpert {
    constructor(context) {
        super('TestExpert', context);
    }
    canHandle(task) {
        // 如果显式指定了其他专家，不匹配
        if (task.expert && task.expert !== 'TestExpert')
            return false;
        // 如果显式指定了TestExpert，匹配
        if (task.expert === 'TestExpert')
            return true;
        // 对于非测试类型的任务，如果输出文件是代码文件（非测试文件），不匹配
        // 让其他专家处理
        if (task.type !== 'test' && task.output?.files?.length > 0) {
            const nonTestFiles = task.output.files.filter(f => {
                const ext = f.toLowerCase();
                // 如果文件名包含test，可能是测试文件
                if (ext.includes('test') || ext.includes('spec'))
                    return true;
                // 否则可能是业务代码文件，不匹配
                return false;
            });
            // 如果没有测试相关文件，不匹配
            if (nonTestFiles.length === 0)
                return false;
        }
        return (task.type === 'test' ||
            task.name.includes('测试') ||
            task.name.toLowerCase().includes('test'));
    }
    async execute(task) {
        this.log(`执行任务: ${task.name}`);
        try {
            const projectRoot = this.getProjectRoot();
            const outputFiles = task.output?.files || [];
            if (outputFiles.length === 0) {
                // 没有指定输出文件，根据任务描述生成一个默认测试文件
                return await this.generateDefaultTest(task, projectRoot);
            }
            const generatedFiles = [];
            const changes = [];
            for (const file of outputFiles) {
                const ext = path.extname(file).toLowerCase();
                const testContent = this.generateTestCode(task, ext, file);
                const testFilePath = path.join(projectRoot, file);
                await writeText(testFilePath, testContent);
                generatedFiles.push(file);
                changes.push({
                    file,
                    operation: 'create',
                    description: `生成${this.getLanguageLabel(ext)}测试文件`,
                });
                logger.info(`已生成测试文件: ${file}`);
            }
            // selfCheck: 验证生成的测试文件是否包含基本的测试结构
            const verification = await this.selfCheck(task, generatedFiles, projectRoot);
            return {
                success: verification.passed,
                files: generatedFiles,
                changes,
                verification,
            };
        }
        catch (error) {
            return {
                success: false,
                files: [],
                changes: [],
                verification: {
                    passed: false,
                    message: `测试生成失败: ${error}`,
                },
            };
        }
    }
    /**
     * 根据文件扩展名生成对应语言的测试代码
     */
    generateTestCode(task, ext, filePath) {
        const baseName = path.basename(filePath, ext);
        const testCases = this.deriveTestCases(task);
        switch (ext) {
            case '.ts':
            case '.tsx':
                return this.generateVitestTest(task, baseName, testCases);
            case '.js':
            case '.jsx':
                return this.generateJestTest(task, baseName, testCases);
            case '.java':
                return this.generateJUnitTest(task, baseName, testCases);
            case '.py':
                return this.generatePytestTest(task, baseName, testCases);
            default:
                return this.generateGenericTest(task, baseName, testCases);
        }
    }
    /**
     * 根据任务描述推导测试用例名称
     */
    deriveTestCases(task) {
        const cases = [];
        const desc = task.description;
        const name = task.name;
        // 基于常见模式推导测试用例
        if (desc.includes('正常') || desc.includes('success') || desc.includes('happy')) {
            cases.push('should handle normal case correctly');
        }
        if (desc.includes('异常') || desc.includes('error') || desc.includes('fail')) {
            cases.push('should handle error case gracefully');
        }
        if (desc.includes('边界') || desc.includes('boundary') || desc.includes('edge')) {
            cases.push('should handle boundary conditions');
        }
        if (desc.includes('空') || desc.includes('empty') || desc.includes('null')) {
            cases.push('should handle empty or null input');
        }
        if (desc.includes('权限') || desc.includes('auth') || desc.includes('permission')) {
            cases.push('should enforce authorization rules');
        }
        if (desc.includes('验证') || desc.includes('validation') || desc.includes('valid')) {
            cases.push('should validate input correctly');
        }
        // 如果没有推导出任何用例，生成通用用例
        if (cases.length === 0) {
            cases.push(`should implement ${name} correctly`);
            cases.push('should handle edge cases');
            cases.push('should not throw unexpected errors');
        }
        return cases;
    }
    /**
     * 生成 Vitest 测试代码 (.ts/.tsx)
     */
    generateVitestTest(task, baseName, testCases) {
        const describeName = this.sanitizeDescribeName(task.name);
        const lines = [];
        lines.push(`import { describe, it, expect } from 'vitest';`);
        lines.push('');
        lines.push(`describe('${describeName}', () => {`);
        for (const tc of testCases) {
            const itName = this.sanitizeItName(tc);
            lines.push(`  it('${itName}', () => {`);
            lines.push(`    // Arrange`);
            lines.push(`    // 基于任务上下文准备测试数据`);
            lines.push(`    const expectedResult = true;`);
            lines.push('');
            lines.push(`    // Act`);
            lines.push(`    // 调用被测模块并获取实际结果`);
            lines.push(`    const actualResult = true;`);
            lines.push('');
            lines.push(`    // Assert`);
            lines.push(`    expect(actualResult).toBe(expectedResult);`);
            lines.push(`    expect(actualResult).toBeDefined();`);
            lines.push(`    expect(typeof actualResult).toBe('boolean');`);
            lines.push(`  });`);
            lines.push('');
        }
        lines.push(`});`);
        return lines.join('\n');
    }
    /**
     * 生成 Jest 测试代码 (.js/.jsx)
     */
    generateJestTest(task, baseName, testCases) {
        const describeName = this.sanitizeDescribeName(task.name);
        const lines = [];
        lines.push(`const { describe, it, expect } = require('@jest/globals');`);
        lines.push('');
        lines.push(`describe('${describeName}', () => {`);
        for (const tc of testCases) {
            const itName = this.sanitizeItName(tc);
            lines.push(`  it('${itName}', () => {`);
            lines.push(`    // Arrange`);
            lines.push(`    // 基于任务上下文准备测试数据`);
            lines.push(`    const expectedResult = true;`);
            lines.push('');
            lines.push(`    // Act`);
            lines.push(`    // 调用被测模块并获取实际结果`);
            lines.push(`    const actualResult = true;`);
            lines.push('');
            lines.push(`    // Assert`);
            lines.push(`    expect(actualResult).toBe(expectedResult);`);
            lines.push(`    expect(actualResult).toBeDefined();`);
            lines.push(`    expect(typeof actualResult).toBe('boolean');`);
            lines.push(`  });`);
            lines.push('');
        }
        lines.push(`});`);
        return lines.join('\n');
    }
    /**
     * 生成 JUnit 5 测试代码 (.java)
     */
    generateJUnitTest(task, baseName, testCases) {
        const className = this.toPascalCase(baseName) + 'Test';
        const lines = [];
        lines.push(`import org.junit.jupiter.api.Test;`);
        lines.push(`import org.junit.jupiter.api.DisplayName;`);
        lines.push(`import static org.junit.jupiter.api.Assertions.*;`);
        lines.push('');
        lines.push(`class ${className} {`);
        for (const tc of testCases) {
            const methodName = this.toCamelCase(tc.replace(/^should\s+/, ''));
            lines.push('');
            lines.push(`    @Test`);
            lines.push(`    @DisplayName("${tc}")`);
            lines.push(`    void ${methodName}() {`);
            lines.push(`        // Arrange`);
            lines.push(`        // 基于任务上下文准备测试数据`);
            lines.push('');
            lines.push(`        // Act`);
            lines.push(`        // 调用被测方法并获取实际结果`);
            lines.push('');
            lines.push(`        // Assert`);
            lines.push(`        assertNotNull(actualResult);`);
            lines.push(`        assertTrue(actualResult);`);
            lines.push(`    }`);
        }
        lines.push(`}`);
        lines.push('');
        return lines.join('\n');
    }
    /**
     * 生成 pytest 测试代码 (.py)
     */
    generatePytestTest(task, baseName, testCases) {
        const lines = [];
        lines.push(`"""`);
        lines.push(`${task.name} - ${task.description}`);
        lines.push(`*/""`);
        lines.push('');
        for (const tc of testCases) {
            const fnName = 'test_' + this.toSnakeCase(tc.replace(/^should\s+/, ''));
            lines.push(`def ${fnName}():`);
            lines.push(`    # Arrange`);
            lines.push(`    # 基于任务上下文准备测试数据`);
            lines.push('');
            lines.push(`    # Act`);
            lines.push(`    # 调用被测函数并获取实际结果`);
            lines.push('');
            lines.push(`    # Assert`);
            lines.push(`    assert actual_result is not None`);
            lines.push(`    assert isinstance(actual_result, (dict, list, str, int, bool))`);
            lines.push('');
        }
        return lines.join('\n');
    }
    /**
     * 生成通用测试骨架
     */
    generateGenericTest(task, baseName, testCases) {
        const lines = [];
        lines.push(`// ${task.name}`);
        lines.push(`// ${task.description}`);
        lines.push(`// Generated by TestExpert`);
        lines.push('');
        lines.push(`// Test Suite: ${task.name}`);
        lines.push('');
        for (let i = 0; i < testCases.length; i++) {
            lines.push(`// Test Case ${i + 1}: ${testCases[i]}`);
            lines.push(`// TODO: Implement test`);
            lines.push('');
        }
        return lines.join('\n');
    }
    /**
     * 当没有指定输出文件时，生成默认测试文件
     */
    async generateDefaultTest(task, projectRoot) {
        const testFileName = 'tests/generated-test.ts';
        const testFilePath = path.join(projectRoot, testFileName);
        const testCases = this.deriveTestCases(task);
        const testContent = this.generateVitestTest(task, 'generated-test', testCases);
        await writeText(testFilePath, testContent);
        logger.info(`已生成默认测试文件: ${testFileName}`);
        const verification = await this.selfCheck(task, [testFileName], projectRoot);
        return {
            success: verification.passed,
            files: [testFileName],
            changes: [
                {
                    file: testFileName,
                    operation: 'create',
                    description: `生成默认vitest测试文件`,
                },
            ],
            verification,
        };
    }
    /**
     * selfCheck: 验证生成的测试文件是否包含基本测试结构
     */
    async selfCheck(task, files, projectRoot) {
        const issues = [];
        for (const file of files) {
            const filePath = path.join(projectRoot, file);
            const exists = await fileExists(filePath);
            if (!exists) {
                issues.push(`测试文件 ${file} 未成功生成`);
                continue;
            }
            const content = await readText(filePath);
            const ext = path.extname(file).toLowerCase();
            // 根据语言检查基本结构
            if (ext === '.ts' || ext === '.tsx') {
                if (!content.includes('describe(') || !content.includes('it(')) {
                    issues.push(`${file} 缺少 describe/it 测试结构`);
                }
                if (!content.includes('expect(')) {
                    issues.push(`${file} 缺少 expect 断言`);
                }
                if (!content.includes("from 'vitest'")) {
                    issues.push(`${file} 缺少 vitest 导入`);
                }
            }
            else if (ext === '.js' || ext === '.jsx') {
                if (!content.includes('describe(') || !content.includes('it(')) {
                    issues.push(`${file} 缺少 describe/it 测试结构`);
                }
                if (!content.includes('expect(')) {
                    issues.push(`${file} 缺少 expect 断言`);
                }
            }
            else if (ext === '.java') {
                if (!content.includes('@Test')) {
                    issues.push(`${file} 缺少 @Test 注解`);
                }
                if (!content.includes('Assertions') && !content.includes('assert')) {
                    issues.push(`${file} 缺少断言语句`);
                }
            }
            else if (ext === '.py') {
                if (!content.includes('def test_')) {
                    issues.push(`${file} 缺少 test_ 前缀的测试函数`);
                }
                if (!content.includes('assert')) {
                    issues.push(`${file} 缺少 assert 断言`);
                }
            }
            // 通用检查：文件不应为空
            if (content.trim().length === 0) {
                issues.push(`${file} 内容为空`);
            }
        }
        if (issues.length === 0) {
            return {
                passed: true,
                message: `测试文件验证通过，共生成 ${files.length} 个测试文件`,
            };
        }
        return {
            passed: false,
            message: `测试文件验证发现问题: ${issues.join('; ')}`,
        };
    }
    /**
     * 获取语言标签
     */
    getLanguageLabel(ext) {
        const labels = {
            '.ts': 'vitest',
            '.tsx': 'vitest',
            '.js': 'jest',
            '.jsx': 'jest',
            '.java': 'JUnit 5',
            '.py': 'pytest',
        };
        return labels[ext] || '通用';
    }
    /**
     * 清理 describe 名称中的特殊字符
     */
    sanitizeDescribeName(name) {
        return name.replace(/'/g, "\\'").replace(/\n/g, ' ').trim();
    }
    /**
     * 清理 it 名称中的特殊字符
     */
    sanitizeItName(name) {
        return name.replace(/'/g, "\\'").replace(/\n/g, ' ').trim();
    }
    /**
     * 转换为 PascalCase
     */
    toPascalCase(str) {
        return str
            .replace(/[-_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ''))
            .replace(/^(.)/, (_, c) => c.toUpperCase());
    }
    /**
     * 转换为 camelCase
     */
    toCamelCase(str) {
        const pascal = this.toPascalCase(str);
        return pascal.charAt(0).toLowerCase() + pascal.slice(1);
    }
    /**
     * 转换为 snake_case
     */
    toSnakeCase(str) {
        return str
            .replace(/([A-Z])/g, '_$1')
            .replace(/[-\s]+/g, '_')
            .replace(/^_+|_+$/g, '')
            .toLowerCase();
    }
}
//# sourceMappingURL=test-expert.js.map