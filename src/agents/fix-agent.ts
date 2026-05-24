// src/agents/fix-agent.ts
import { BaseAgent, type AgentContext, type AgentResult } from './base-agent.js';
import { ExpertRegistry } from '../experts/index.js';
import { logger } from '../utils/logger.js';
import { readText, writeText } from '../utils/fs-utils.js';
import path from 'node:path';

export interface Bug {
  id: string;
  description: string;
  file: string;
  line?: number;
  type: 'syntax' | 'runtime' | 'logic' | 'type' | 'dependency' | 'config';
}

export interface TestAgentResult {
  bugs: Bug[];
  testReport: any;
  // 便捷字段
  testCases?: any[];
  reportPath?: string;
}

export interface FixResult {
  fixedBugs: string[];
  remainingBugs: string[];
  files: string[];
}

export class FixAgent extends BaseAgent {
  private registry: ExpertRegistry;

  constructor(context: AgentContext) {
    super('FixAgent', context);
    this.registry = new ExpertRegistry(context);
  }

  async execute(testResult: TestAgentResult): Promise<AgentResult<FixResult>> {
    try {
      logger.title('Bug修复');

      const bugs = testResult.bugs;
      const fixedBugs: string[] = [];
      const remainingBugs: string[] = [];
      const files: string[] = [];

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
        } else {
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
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  private async fixBug(bug: Bug): Promise<{ success: boolean; files: string[] }> {
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
        case 'dependency':
          fixedContent = await this.fixDependencyError(content, bug, projectRoot);
          break;
        case 'config':
          fixedContent = this.fixConfigError(content, bug);
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
    } catch {
      return { success: false, files: [] };
    }
  }

  private fixSyntaxError(content: string, bug: Bug): string {
    // 修复常见的语法错误
    let fixed = content;

    // 修复未闭合的括号
    fixed = this.fixUnclosedBrackets(fixed);

    // 修复缺少的分号（TypeScript中通常不需要，但在某些情况下需要）
    fixed = this.fixMissingSemicolons(fixed);

    return fixed;
  }

  /**
   * 修复运行时错误 - 只在 bug 相关行附近添加空值检查，而非全局替换
   */
  private fixRuntimeError(content: string, bug: Bug): string {
    let fixed = content;

    // 添加空值检查 - 只在 bug 行附近操作
    if (bug.description.includes('undefined') || bug.description.includes('null')) {
      fixed = this.addNullChecksNearLine(fixed, bug);
    }

    // 修复可能的数组越界 - 只在 bug 行附近操作
    if (bug.description.includes('index') || bug.description.includes('数组')) {
      fixed = this.addBoundsChecksNearLine(fixed, bug);
    }

    return fixed;
  }

  /**
   * 修复逻辑错误 - 只替换 == 为 === 当两边不是 null/undefined 检查时
   */
  private fixLogicError(content: string, bug: Bug): string {
    let fixed = content;

    // 修复常见的逻辑错误：将 == 替换为 ===
    // 但排除合理的 null/undefined 检查（如 == null, != null, == undefined, != undefined）
    fixed = fixed.replace(
      /(?<![=!])==(?!=)/g,
      (match, _offset, fullStr) => {
        // 获取匹配位置前后的上下文，检查是否是 null/undefined 检查
        const matchIndex = fullStr.indexOf(match, _offset > 50 ? _offset - 50 : 0);
        const actualIndex = matchIndex === -1 ? _offset : matchIndex;

        // 向后查找，获取 == 右侧的值
        const afterMatch = fullStr.slice(actualIndex + match.length).trimStart();
        // 向前查找，获取 == 左侧的值
        const beforeMatch = fullStr.slice(Math.max(0, actualIndex - 50), actualIndex).trimEnd();

        // 检查是否是 null/undefined 检查
        const rightSide = afterMatch.split(/[;\n\r,)\]}]/)[0]?.trim() || '';
        const isNullCheck =
          rightSide === 'null' ||
          rightSide === 'undefined' ||
          rightSide === 'void 0';

        if (isNullCheck) {
          return match; // 保留原来的 ==
        }

        return '===';
      },
    );

    // 修复 != 为 !== ，同样排除 null/undefined 检查
    fixed = fixed.replace(
      /!=(?!=)/g,
      (match, _offset, fullStr) => {
        const afterMatch = fullStr.slice(_offset + match.length).trimStart();
        const rightSide = afterMatch.split(/[;\n\r,)\]}]/)[0]?.trim() || '';
        const isNullCheck =
          rightSide === 'null' ||
          rightSide === 'undefined' ||
          rightSide === 'void 0';

        if (isNullCheck) {
          return match; // 保留原来的 !=
        }

        return '!==';
      },
    );

    return fixed;
  }

  private fixTypeError(content: string, bug: Bug): string {
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

  /**
   * 修复依赖缺失问题
   */
  private async fixDependencyError(content: string, bug: Bug, projectRoot: string): Promise<string> {
    // 从 bug.description 中提取缺失的模块名
    // 常见格式: "Cannot find module 'xxx'" 或 "Module not found: xxx"
    const modulePatterns = [
      /Cannot find module ['"]([^'"]+)['"]/,
      /Module not found:\s*(\S+)/,
      /Cannot resolve ['"]([^'"]+)['"]/,
      /unresolved import ['"]([^'"]+)['"]/,
    ];

    let missingModule: string | null = null;
    for (const pattern of modulePatterns) {
      const match = bug.description.match(pattern);
      if (match) {
        missingModule = match[1];
        break;
      }
    }

    if (!missingModule) {
      logger.info(`无法从描述中提取缺失模块名: ${bug.description}`);
      return content;
    }

    // 检查是否是相对路径导入（项目内文件）
    if (missingModule.startsWith('.') || missingModule.startsWith('/')) {
      logger.info(`缺失的是项目内文件: ${missingModule}，需要创建文件而非安装依赖`);
      return content;
    }

    // 检查文件中是否已有该模块的导入
    const importPatterns = [
      new RegExp(`require\\s*\\(\\s*['"]${escapeRegExp(missingModule)}['"]\\s*\\)`),
      new RegExp(`from\\s+['"]${escapeRegExp(missingModule)}['"]`),
      new RegExp(`import\\s+['"]${escapeRegExp(missingModule)}['"]`),
    ];

    for (const pattern of importPatterns) {
      if (pattern.test(content)) {
        // 已有导入语句，说明是依赖未安装
        logger.info(`检测到缺失依赖: ${missingModule}，建议执行 npm install ${missingModule}`);
        // 在文件顶部添加注释提示
        const comment = `// TODO: 需要安装依赖: npm install ${missingModule}\n`;
        if (!content.includes(comment)) {
          return comment + content;
        }
        return content;
      }
    }

    return content;
  }

  /**
   * 修复配置错误
   */
  private fixConfigError(content: string, bug: Bug): string {
    let fixed = content;

    // 处理 JSON 配置文件中的常见错误
    if (bug.file.endsWith('.json')) {
      fixed = this.fixJsonConfigError(content, bug);
      return fixed;
    }

    // 处理环境变量配置错误
    if (bug.description.includes('env') || bug.description.includes('环境变量')) {
      fixed = this.fixEnvConfigError(content, bug);
      return fixed;
    }

    // 处理路径配置错误
    if (bug.description.includes('path') || bug.description.includes('路径')) {
      fixed = this.fixPathConfigError(content, bug);
      return fixed;
    }

    return fixed;
  }

  /**
   * 修复 JSON 配置文件错误
   */
  private fixJsonConfigError(content: string, bug: Bug): string {
    try {
      // 尝试解析 JSON，如果失败则尝试修复
      JSON.parse(content);
      return content; // JSON 有效，无需修复
    } catch {
      // 尝试常见的 JSON 修复
      let fixed = content;

      // 移除尾随逗号
      fixed = fixed.replace(/,\s*([}\]])/g, '$1');

      // 修复单引号为双引号（简单替换，不处理嵌套）
      fixed = fixed.replace(/'/g, '"');

      // 移除注释（JSON 不支持注释）
      fixed = fixed.replace(/\/\/.*$/gm, '');
      fixed = fixed.replace(/\/\*[\s\S]*?\*\//g, '');

      // 验证修复后的 JSON
      try {
        JSON.parse(fixed);
        logger.info('JSON 配置文件已修复');
        return fixed;
      } catch {
        logger.info('JSON 配置文件修复失败，需要人工介入');
        return content;
      }
    }
  }

  /**
   * 修复环境变量配置错误
   */
  private fixEnvConfigError(content: string, bug: Bug): string {
    // 查找 process.env.XXX 的使用，在附近添加默认值保护
    const envUsagePattern = /process\.env\.(\w+)/g;
    const lines = content.split('\n');
    const modifiedLines = [...lines];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line.includes('process.env')) continue;

      // 只在 bug 行附近处理
      if (bug.line !== undefined && Math.abs(i + 1 - bug.line) > 3) continue;

      let match: RegExpExecArray | null;
      envUsagePattern.lastIndex = 0;
      while ((match = envUsagePattern.exec(line)) !== null) {
        const varName = match[1];
        const fullMatch = match[0];

        // 如果已经有默认值保护（|| 或 ??），跳过
        const afterEnv = line.slice(match.index + fullMatch.length);
        if (afterEnv.match(/^\s*(\|\||\?\?)/)) continue;

        // 如果在模板字符串中或字符串拼接中，跳过
        if (line.slice(0, match.index).endsWith('$') || line.slice(0, match.index).endsWith('+')) continue;

        // 替换为带默认值的形式
        const replacement = `process.env.${varName} ?? ''`;
        modifiedLines[i] = modifiedLines[i].replace(fullMatch, replacement);
      }
    }

    return modifiedLines.join('\n');
  }

  /**
   * 修复路径配置错误
   */
  private fixPathConfigError(content: string, bug: Bug): string {
    // 查找可能的路径字符串，确保使用 path.join 或正确的分隔符
    const lines = content.split('\n');
    const modifiedLines = [...lines];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // 只在 bug 行附近处理
      if (bug.line !== undefined && Math.abs(i + 1 - bug.line) > 3) continue;

      // 检测硬编码的路径拼接（使用字符串拼接而非 path.join）
      const hardcodedPathPattern = /['"](\.\.?\/[^'"]*(?:\/[^'"]*)*)['"]\s*\+\s*['"]([^'"]+)['"]/;
      const pathMatch = line.match(hardcodedPathPattern);
      if (pathMatch) {
        // 检查文件是否已导入 path 模块
        const hasPathImport = content.includes("require('path')") ||
          content.includes('require("path")') ||
          content.includes("from 'path'") ||
          content.includes('from "path"');

        if (hasPathImport) {
          const suggestion = `path.join('${pathMatch[1]}', '${pathMatch[2]}')`;
          modifiedLines[i] = modifiedLines[i].replace(
            hardcodedPathPattern,
            suggestion,
          );
        }
      }
    }

    return modifiedLines.join('\n');
  }

  private applyGenericFix(content: string, bug: Bug): string {
    let fixed = content;

    // 未定义变量问题 - 只在 bug 行附近操作
    if (bug.description.includes('undefined') || bug.description.includes('未定义')) {
      fixed = this.addNullChecksNearLine(fixed, bug);
    }

    // 类型错误
    if (bug.description.includes('type') || bug.description.includes('类型')) {
      fixed = this.addTypeAnnotations(fixed);
    }

    return fixed;
  }

  private fixUnclosedBrackets(content: string): string {
    const lines = content.split('\n');
    const stack: { char: string; line: number }[] = [];
    const pairs: Record<string, string> = { '(': ')', '[': ']', '{': '}' };
    const closes: Record<string, string> = { ')': '(', ']': '[', '}': '{' };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // 跳过字符串和注释中的括号
      const cleaned = this.removeStringsAndComments(line);
      for (const char of cleaned) {
        if (pairs[char]) {
          stack.push({ char, line: i });
        } else if (closes[char]) {
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

  /**
   * 移除字符串和注释中的内容，避免误判括号
   */
  private removeStringsAndComments(line: string): string {
    let result = '';
    let inString: string | null = null;
    let i = 0;

    while (i < line.length) {
      const char = line[i];

      if (inString) {
        if (char === '\\') {
          i += 2; // 跳过转义字符
          continue;
        }
        if (char === inString) {
          inString = null;
        }
        i++;
        continue;
      }

      if (char === '"' || char === "'" || char === '`') {
        inString = char;
        i++;
        continue;
      }

      // 跳过单行注释
      if (char === '/' && i + 1 < line.length && line[i + 1] === '/') {
        break;
      }

      result += char;
      i++;
    }

    return result;
  }

  private fixMissingSemicolons(content: string): string {
    // TypeScript 通常不需要分号，但在某些情况下需要
    // 这里简化处理，不做复杂修改
    return content;
  }

  /**
   * 只在 bug 行附近添加可选链，而非全局替换
   */
  private addNullChecksNearLine(content: string, bug: Bug): string {
    const lines = content.split('\n');
    const targetLine = bug.line || this.findRelevantLine(lines, bug.description);
    const contextRange = 3; // 上下各扩展3行

    const modifiedLines = lines.map((line, index) => {
      // 只处理目标行附近的代码
      if (targetLine !== undefined) {
        const lineNum = index + 1;
        if (Math.abs(lineNum - targetLine) > contextRange) {
          return line;
        }
      }

      // 对属性访问添加可选链
      return line.replace(/(\w+)\.(\w+)/g, (match, obj, prop) => {
        // 如果已经是可选链，跳过
        if (match.includes('?.')) return match;
        // 避免在类型注解、import 语句、字符串中替换
        if (this.isInsideTypeAnnotation(line, match)) return match;
        if (line.trimStart().startsWith('import ') || line.trimStart().startsWith('from ')) return match;
        return `${obj}?.${prop}`;
      });
    });

    return modifiedLines.join('\n');
  }

  /**
   * 只在 bug 行附近添加数组边界检查
   */
  private addBoundsChecksNearLine(content: string, bug: Bug): string {
    const lines = content.split('\n');
    const targetLine = bug.line || this.findRelevantLine(lines, bug.description);
    const contextRange = 3;

    const modifiedLines = lines.map((line, index) => {
      if (targetLine !== undefined) {
        const lineNum = index + 1;
        if (Math.abs(lineNum - targetLine) > contextRange) {
          return line;
        }
      }

      return line.replace(/(\w+)\[(\w+)\]/g, (match, arr, index) => {
        if (match.includes('?.[')) return match;
        return `${arr}?.[${index}]`;
      });
    });

    return modifiedLines.join('\n');
  }

  /**
   * 在文件内容中查找与 bug 描述相关的行号
   */
  private findRelevantLine(lines: string[], description: string): number | undefined {
    // 从描述中提取关键标识符
    const identifiers = description.match(/['"]?(\w+)['"]?/g)?.map(s => s.replace(/['"]/g, '')) || [];

    for (const identifier of identifiers) {
      // 跳过常见无意义词
      if (['is', 'the', 'of', 'a', 'an', 'or', 'and', 'not', 'in', 'to', 'for', 'undefined', 'null', 'cannot', 'error'].includes(identifier.toLowerCase())) {
        continue;
      }

      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes(identifier)) {
          return i + 1; // 返回1-based行号
        }
      }
    }

    return undefined;
  }

  /**
   * 检查匹配项是否在类型注解中
   */
  private isInsideTypeAnnotation(line: string, match: string): boolean {
    const matchIndex = line.indexOf(match);
    if (matchIndex === -1) return false;

    // 检查是否在 : 后面（类型注解）
    const beforeMatch = line.slice(0, matchIndex).trimEnd();
    if (beforeMatch.endsWith(':')) return true;
    if (beforeMatch.endsWith(': ')) return true;

    // 检查是否在 as 后面（类型断言）
    if (beforeMatch.endsWith('as ')) return true;

    return false;
  }

  /**
   * 全局添加空值检查（保留作为内部方法，但主要逻辑使用 addNullChecksNearLine）
   */
  private addNullChecks(content: string): string {
    return this.addNullChecksNearLine(content, { id: '', description: '', file: '', type: 'runtime' });
  }

  /**
   * 全局添加边界检查（保留作为内部方法）
   */
  private addBoundsChecks(content: string): string {
    return this.addBoundsChecksNearLine(content, { id: '', description: '', file: '', type: 'runtime' });
  }

  /**
   * 为未标注类型的函数参数添加类型注解，保留已有类型注解
   */
  private addTypeAnnotations(content: string): string {
    // 匹配函数声明和箭头函数，只为没有类型注解的参数添加类型
    // 处理 function 声明
    let fixed = content.replace(
      /function\s+(\w+)\s*\(([^)]*)\)/g,
      (match, name, params) => {
        if (!params.trim()) return match;
        const typedParams = this.annotateParams(params);
        return `function ${name}(${typedParams})`;
      },
    );

    // 处理箭头函数和函数表达式: (params) => 和 (params) {
    fixed = fixed.replace(
      /(?:const|let|var)\s+(\w+)\s*=\s*\(([^)]*)\)\s*(?:=>|{)/g,
      (match, varName, params) => {
        if (!params.trim()) return match;
        const typedParams = this.annotateParams(params);
        const rest = match.slice(match.indexOf(')') + 1);
        return `${match.slice(0, match.indexOf('('))}(${typedParams})${rest}`;
      },
    );

    // 处理方法声明: methodName(params) {
    fixed = fixed.replace(
      /(?<!function\s)(?<!\w)(\w+)\s*\(([^)]*)\)\s*\{/g,
      (match, methodName, params) => {
        // 跳过控制流关键字
        const controlFlow = ['if', 'for', 'while', 'switch', 'catch', 'with'];
        if (controlFlow.includes(methodName)) return match;
        if (!params.trim()) return match;

        // 检查是否已经有类型注解
        const typedParams = this.annotateParams(params);
        return `${methodName}(${typedParams}) {`;
      },
    );

    return fixed;
  }

  /**
   * 为参数列表中的每个未标注类型的参数添加类型注解
   */
  private annotateParams(params: string): string {
    return params
      .split(',')
      .map((p: string) => {
        const trimmed = p.trim();
        if (!trimmed) return trimmed;

        // 已有类型注解，保留原样
        if (trimmed.includes(':')) return trimmed;

        // 有默认值：param = value -> param: unknown = value
        const defaultValueMatch = trimmed.match(/^(\w+)\s*=\s*(.+)$/);
        if (defaultValueMatch) {
          return `${defaultValueMatch[1]}: unknown = ${defaultValueMatch[2]}`;
        }

        // 有解构：{ a, b } -> { a, b }: Record<string, unknown>
        if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
          return `${trimmed}: ${trimmed.startsWith('{') ? 'Record<string, unknown>' : 'unknown[]'}`;
        }

        // 有剩余参数：...args -> ...args: unknown[]
        if (trimmed.startsWith('...')) {
          return `${trimmed}: unknown[]`;
        }

        // 普通参数
        return `${trimmed}: unknown`;
      })
      .join(', ');
  }

  private fixAnyTypes(content: string): string {
    // 将一些 any 替换为更具体的类型
    // 但保留 any[] 中的 any 为 unknown[]
    let fixed = content.replace(/:\s*any\b/g, ': unknown');
    fixed = fixed.replace(/:\s*any\[\]/g, ': unknown[]');
    return fixed;
  }
}

/**
 * 转义正则表达式中的特殊字符
 */
function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
