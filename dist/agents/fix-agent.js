// src/agents/fix-agent.ts
import { BaseAgent } from './base-agent.js';
import { ExpertRegistry } from '../experts/index.js';
import { logger } from '../utils/logger.js';
import { readText, writeText } from '../utils/fs-utils.js';
import path from 'node:path';
export class FixAgent extends BaseAgent {
    registry;
    constructor(context) {
        super('FixAgent', context);
        this.registry = new ExpertRegistry(context);
    }
    async execute(testResult) {
        try {
            logger.title('Bug修复');
            const bugs = testResult.bugs;
            const fixedBugs = [];
            const remainingBugs = [];
            const files = [];
            if (bugs.length === 0) {
                logger.success('没有发现Bug，无需修复');
                return {
                    success: true,
                    data: {
                        fixedBugs,
                        remainingBugs,
                        files,
                    },
                };
            }
            logger.info(`发现 ${bugs.length} 个Bug需要修复`);
            for (let i = 0; i < bugs.length; i++) {
                const bug = bugs[i];
                logger.step(i + 1, bugs.length, `修复: ${bug.description.slice(0, 50)}...`);
                const fixResult = await this.fixBug(bug);
                if (fixResult.success) {
                    fixedBugs.push(bug.id);
                    files.push(...fixResult.files);
                    logger.success(`已修复: ${bug.id}`);
                }
                else {
                    remainingBugs.push(bug.id);
                    logger.error(`修复失败: ${bug.id}`);
                }
            }
            logger.title('修复完成');
            logger.info(`成功: ${fixedBugs.length}, 失败: ${remainingBugs.length}`);
            return {
                success: remainingBugs.length === 0,
                data: {
                    fixedBugs,
                    remainingBugs,
                    files: [...new Set(files)],
                },
            };
        }
        catch (error) {
            return { success: false, error: String(error) };
        }
    }
    async fixBug(bug) {
        const projectRoot = this.getProjectRoot();
        if (!bug.file) {
            return { success: false, files: [] };
        }
        try {
            const filePath = path.join(projectRoot, bug.file);
            const content = await readText(filePath);
            // 根据Bug类型选择修复策略
            let fixedContent = content;
            switch (bug.type) {
                case 'syntax':
                    fixedContent = this.fixSyntaxError(content, bug);
                    break;
                case 'runtime':
                    fixedContent = this.fixRuntimeError(content, bug);
                    break;
                case 'logic':
                    fixedContent = this.fixLogicError(content, bug);
                    break;
                case 'type':
                    fixedContent = this.fixTypeError(content, bug);
                    break;
                default:
                    fixedContent = this.applyGenericFix(content, bug);
            }
            // 如果内容有变化，写入文件
            if (fixedContent !== content) {
                await writeText(filePath, fixedContent);
                return { success: true, files: [bug.file] };
            }
            return { success: false, files: [] };
        }
        catch {
            return { success: false, files: [] };
        }
    }
    fixSyntaxError(content, bug) {
        // 修复常见的语法错误
        let fixed = content;
        // 修复未闭合的括号
        fixed = this.fixUnclosedBrackets(fixed);
        // 修复缺少的分号（TypeScript中通常不需要，但在某些情况下需要）
        fixed = this.fixMissingSemicolons(fixed);
        return fixed;
    }
    fixRuntimeError(content, bug) {
        let fixed = content;
        // 添加空值检查
        if (bug.description.includes('undefined') || bug.description.includes('null')) {
            fixed = this.addNullChecks(fixed);
        }
        // 修复可能的数组越界
        if (bug.description.includes('index') || bug.description.includes('数组')) {
            fixed = this.addBoundsChecks(fixed);
        }
        return fixed;
    }
    fixLogicError(content, bug) {
        // 逻辑错误通常需要人工介入，这里做一些简单的修复
        let fixed = content;
        // 修复常见的逻辑错误，如 == 改为 ===
        fixed = fixed.replace(/(?<![=!])=(?!=)/g, '===');
        return fixed;
    }
    fixTypeError(content, bug) {
        let fixed = content;
        // 添加类型注解
        if (bug.description.includes('implicitly has an') || bug.description.includes('类型')) {
            fixed = this.addTypeAnnotations(fixed);
        }
        // 修复 any 类型问题
        if (bug.description.includes('any')) {
            fixed = this.fixAnyTypes(fixed);
        }
        return fixed;
    }
    applyGenericFix(content, bug) {
        let fixed = content;
        // 未定义变量问题
        if (bug.description.includes('undefined') || bug.description.includes('未定义')) {
            fixed = this.addNullChecks(fixed);
        }
        // 类型错误
        if (bug.description.includes('type') || bug.description.includes('类型')) {
            fixed = this.addTypeAnnotations(fixed);
        }
        return fixed;
    }
    fixUnclosedBrackets(content) {
        const lines = content.split('\n');
        const stack = [];
        const pairs = { '(': ')', '[': ']', '{': '}' };
        const closes = { ')': '(', ']': '[', '}': '{' };
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            for (const char of line) {
                if (pairs[char]) {
                    stack.push({ char, line: i });
                }
                else if (closes[char]) {
                    if (stack.length > 0 && stack[stack.length - 1].char === closes[char]) {
                        stack.pop();
                    }
                }
            }
        }
        // 如果有未闭合的括号，在文件末尾添加
        if (stack.length > 0) {
            const toClose = stack.reverse().map(item => pairs[item.char]).join('');
            return content + '\n' + toClose;
        }
        return content;
    }
    fixMissingSemicolons(content) {
        // TypeScript 通常不需要分号，但在某些情况下需要
        // 这里简化处理，不做复杂修改
        return content;
    }
    addNullChecks(content) {
        // 简化版：添加可选链操作符
        return content.replace(/(\w+)\.(\w+)/g, (match, obj, prop) => {
            // 如果已经是可选链，跳过
            if (match.includes('?.'))
                return match;
            // 避免在类型注解中替换
            if (content.slice(0, content.indexOf(match)).split('{').length !==
                content.slice(0, content.indexOf(match)).split('}').length) {
                return match;
            }
            return `${obj}?.${prop}`;
        });
    }
    addBoundsChecks(content) {
        // 简化版：为数组访问添加边界检查
        return content.replace(/(\w+)\[(\w+)\]/g, (match, arr, index) => {
            if (match.includes('?.['))
                return match;
            return `${arr}?.[${index}]`;
        });
    }
    addTypeAnnotations(content) {
        // 简化版：为函数参数添加类型
        return content.replace(/function\s+(\w+)\s*\(([^)]*)\)/g, (match, name, params) => {
            if (params.includes(':'))
                return match;
            const typedParams = params
                .split(',')
                .map((p) => p.trim() + ': unknown')
                .join(', ');
            return `function ${name}(${typedParams})`;
        });
    }
    fixAnyTypes(content) {
        // 将一些 any 替换为更具体的类型
        return content.replace(/:\s*any\b/g, ': unknown');
    }
}
//# sourceMappingURL=fix-agent.js.map