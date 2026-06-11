/**
 * DynamicBudget — 动态上下文预算计算
 * 
 * 根据 AI 模型的上下文窗口大小，动态计算：
 * - task-brief 总预算
 * - 单文件读取上限
 * - 最大依赖文件数
 */

const MODEL_CONFIG = {
  // Anthropic
  'claude-3-5-sonnet': { totalTokens: 200000, codeRatio: 0.75, budgetRatio: 0.60 },
  'claude-3-opus': { totalTokens: 200000, codeRatio: 0.75, budgetRatio: 0.60 },
  'claude-3-haiku': { totalTokens: 200000, codeRatio: 0.75, budgetRatio: 0.55 },
  
  // OpenAI
  'gpt-4-turbo': { totalTokens: 128000, codeRatio: 0.78, budgetRatio: 0.60 },
  'gpt-4o': { totalTokens: 128000, codeRatio: 0.78, budgetRatio: 0.60 },
  'gpt-4o-mini': { totalTokens: 128000, codeRatio: 0.78, budgetRatio: 0.55 },
  'gpt-4': { totalTokens: 8192, codeRatio: 0.75, budgetRatio: 0.50 },
  
  // Local / Other
  'ollama-default': { totalTokens: 32768, codeRatio: 0.70, budgetRatio: 0.50 },
  'default': { totalTokens: 128000, codeRatio: 0.75, budgetRatio: 0.60 }
};

/**
 * 计算预算
 * @param {string} modelName — 模型名称
 * @param {Object} options
 * @param {number} options.systemPromptSizeKB — 系统提示大小（KB）
 * @param {number} options.responseReserveKB — 响应预留空间（KB）
 * @param {number} options.safetyMarginKB — 安全边距（KB）
 * @returns {Object} { briefSizeKB, fileReadKB, maxDependencyFiles, modelInfo }
 */
function calculateBudget(modelName, options = {}) {
  const config = MODEL_CONFIG[modelName] || MODEL_CONFIG['default'];
  
  // 计算总代码容量（tokens → 字符 → KB）
  // 1 token ≈ 4 字符（英文代码），1 KB = 1024 字节
  const totalCodeKB = (config.totalTokens * config.codeRatio) / 4 / 1024;
  
  // 预留空间
  const systemPromptSizeKB = options.systemPromptSizeKB || 15;
  const responseReserveKB = options.responseReserveKB || 20;
  const safetyMarginKB = options.safetyMarginKB || 10;
  const reservedKB = systemPromptSizeKB + responseReserveKB + safetyMarginKB;
  
  // 可用预算
  const availableKB = Math.floor(totalCodeKB * config.budgetRatio - reservedKB);
  const briefSizeKB = Math.max(availableKB, 30); // 最低 30KB
  
  // 单文件上限：预算的 1/3，但不超过 50KB
  const fileReadKB = Math.min(Math.floor(briefSizeKB / 3), 50);
  
  // 最大依赖文件数：预算可支持多少个 10KB 文件
  const maxDependencyFiles = Math.min(Math.floor(briefSizeKB / 10), 15);
  
  return {
    briefSizeKB,
    fileReadKB,
    maxDependencyFiles,
    modelInfo: {
      name: modelName,
      totalTokens: config.totalTokens,
      totalCodeKB: Math.round(totalCodeKB),
      reservedKB,
      budgetRatio: config.budgetRatio
    }
  };
}

/**
 * 从环境或配置检测当前模型
 * @returns {string} 模型名称
 */
function detectModel() {
  // 优先级：环境变量 > 配置文件 > 默认值
  if (process.env.DEV_FLOW_MODEL) {
    return process.env.DEV_FLOW_MODEL;
  }
  
  // 尝试读取配置文件
  try {
    const fs = require('fs');
    const configPath = '.dev-flow/model-config.yaml';
    if (fs.existsSync(configPath)) {
      const yaml = require('js-yaml');
      const config = yaml.load(fs.readFileSync(configPath, 'utf8'));
      if (config.model) return config.model;
    }
  } catch (e) {
    // ignore
  }
  
  return 'default';
}

/**
 * 获取预算的文本说明（用于日志）
 * @param {Object} budget
 * @returns {string}
 */
function formatBudgetReport(budget) {
  const { modelInfo, briefSizeKB, fileReadKB, maxDependencyFiles } = budget;
  return `
[Dynamic Budget Report]
  Model: ${modelInfo.name}
  Total Context: ${modelInfo.totalTokens.toLocaleString()} tokens (~${modelInfo.totalCodeKB}KB code)
  Budget Ratio: ${(modelInfo.budgetRatio * 100).toFixed(0)}%
  Reserved: ${modelInfo.reservedKB}KB (system + response + safety)
  
  Available Budget:
    Task Brief: ${briefSizeKB}KB
    Per File: ${fileReadKB}KB
    Max Dependencies: ${maxDependencyFiles} files
`;
}

module.exports = {
  calculateBudget,
  detectModel,
  formatBudgetReport,
  MODEL_CONFIG
};

// CLI
if (require.main === module) {
  const model = process.argv[2] || detectModel();
  const budget = calculateBudget(model);
  console.log(formatBudgetReport(budget));
}
