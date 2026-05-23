// src/agents/hotfix-agent.ts
import { BaseAgent, type AgentContext, type AgentResult } from './base-agent.js';
import { logger } from '../utils/logger.js';
import {
  parseErrorType,
  findAffectedFiles,
  generateFix,
  generateVerification,
  type ErrorType,
  type Fix,
} from './hotfix-analyzer.js';

export interface HotfixResult {
  rootCause: string;
  errorType: ErrorType;
  affectedFiles: string[];
  fixes: Fix[];
  verification: {
    steps: string[];
    expectedBehavior: string;
  };
}

export class HotfixAgent extends BaseAgent {
  constructor(context: AgentContext) {
    super('HotfixAgent', context);
  }

  async execute(errorDescription: string, errorLog?: string): Promise<AgentResult<HotfixResult>> {
    try {
      logger.title('Hotfix 快速修复');

      const projectRoot = this.getProjectRoot();

      // Step 1: 解析错误描述和日志
      logger.step(1, 5, '解析错误信息...');
      const fullDescription = errorLog
        ? `${errorDescription}\n${errorLog}`
        : errorDescription;
      const errorType = parseErrorType(fullDescription);
      logger.info(`错误类型: ${errorType}`);
      logger.success('错误信息解析完成');

      // Step 2: 搜索项目中相关文件
      logger.step(2, 5, '搜索相关文件...');
      const affectedFiles = await findAffectedFiles(projectRoot, fullDescription);
      logger.info(`发现 ${affectedFiles.length} 个可能受影响的文件`);

      if (affectedFiles.length === 0) {
        logger.warn('未找到直接相关的文件，将基于错误类型生成通用修复建议');
      }

      // Step 3: 分析错误类型并生成根因分析
      logger.step(3, 5, '分析错误根因...');
      const rootCause = this.analyzeRootCause(errorType, fullDescription);
      logger.info(`根因: ${rootCause.slice(0, 80)}...`);

      // Step 4: 生成修复方案
      logger.step(4, 5, '生成修复方案...');
      const fixes: Fix[] = [];

      if (affectedFiles.length > 0) {
        // 为每个受影响的文件生成修复建议（最多 5 个）
        const targetFiles = affectedFiles.slice(0, 5);
        for (const file of targetFiles) {
          const fix = generateFix(errorType, file, fullDescription);
          fixes.push(fix);
        }
      } else {
        // 无相关文件时，生成通用修复建议
        const fix = generateFix(errorType, 'unknown-file.ts', fullDescription);
        fixes.push(fix);
      }

      logger.success(`生成 ${fixes.length} 条修复建议`);

      // Step 5: 生成验证步骤
      logger.step(5, 5, '生成验证步骤...');
      const verification = generateVerification(errorType, fullDescription);
      logger.success('验证步骤已生成');

      logger.title('修复分析完成');
      logger.info(`错误类型: ${errorType}`);
      logger.info(`受影响文件: ${affectedFiles.length} 个`);
      logger.info(`修复建议: ${fixes.length} 条`);

      const result: HotfixResult = {
        rootCause,
        errorType,
        affectedFiles,
        fixes,
        verification,
      };

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.log(`Error: ${message}`);
      return {
        success: false,
        error: message,
      };
    }
  }

  /**
   * 根据错误类型和描述生成根因分析
   */
  private analyzeRootCause(errorType: ErrorType, description: string): string {
    const rootCauses: Record<ErrorType, string[]> = {
      syntax: [
        '代码中存在语法错误，可能是括号、引号未正确闭合，或使用了无效的语法结构',
        '源文件包含不符合语言规范的代码结构，需要检查括号匹配和语句完整性',
      ],
      type: [
        '变量或表达式的类型与预期不符，可能是类型声明错误或类型推断失败',
        'TypeScript 类型系统检测到类型不匹配，需要检查类型注解和类型转换',
      ],
      dependency: [
        '项目依赖未正确安装或版本不兼容，导致模块无法正确加载',
        '导入路径指向了不存在的模块，可能是依赖缺失或路径配置错误',
      ],
      config: [
        '项目配置文件设置不正确，导致构建或运行时行为异常',
        '环境变量或配置参数缺失，需要检查配置文件和环境设置',
      ],
      runtime: [
        '运行时尝试访问不存在的属性或调用非函数值，通常由空值引用引起',
        '代码在执行过程中遇到未处理的异常，需要添加错误处理和空值检查',
      ],
      logic: [
        '算法或业务逻辑实现有误，导致输出结果不符合预期',
        '条件判断或循环逻辑存在缺陷，需要重新审视算法正确性',
      ],
    };

    const candidates = rootCauses[errorType];
    // 根据描述内容选择更匹配的根因
    const lower = description.toLowerCase();

    if (lower.includes('module') || lower.includes('import') || lower.includes('require')) {
      return candidates[1];
    }

    if (lower.includes('null') || lower.includes('undefined') || lower.includes('property')) {
      return candidates[0];
    }

    return candidates[0];
  }
}
