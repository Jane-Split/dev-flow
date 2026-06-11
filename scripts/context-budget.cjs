/**
 * dev-flow 上下文预算计算引擎
 *
 * 根据 AI 模型的上下文窗口大小，动态计算子代理的上下文预算。
 * 将上下文保护从"软约束（AI 自觉执行）"升级为"硬约束（脚本强制执行）"。
 *
 * 用法：
 *   node scripts/context-budget.cjs --model gpt-4 --action calculate
 *   node scripts/context-budget.cjs --model gpt-4 --task Task-5 --demand user-mgmt --action report
 *   node scripts/context-budget.cjs --model gpt-4 --task Task-5 --demand user-mgmt --action enforce
 *   node scripts/context-budget.cjs --help
 *
 * 依赖：零外部依赖
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DOCS_DIR = path.join(ROOT, '.dev-flow', 'docs');
const RUNTIME_DIR = path.join(ROOT, '.dev-flow', 'runtime');
const CONTRACTS_DIR = path.join(ROOT, '.dev-flow', 'contracts');

// ============================================================
// 模型上下文窗口映射表
// ============================================================

const MODEL_CONTEXT_WINDOWS = {
  // Claude 系列
  'claude-3.5-sonnet':  { window_kb: 200, safe_pct: 0.80 },
  'claude-3-opus':      { window_kb: 200, safe_pct: 0.80 },
  'claude-3-sonnet':    { window_kb: 200, safe_pct: 0.80 },
  'claude-3-haiku':     { window_kb: 200, safe_pct: 0.80 },
  'claude-4':           { window_kb: 200, safe_pct: 0.80 },
  'claude':             { window_kb: 200, safe_pct: 0.80 },

  // GPT 系列
  'gpt-4':              { window_kb: 128, safe_pct: 0.80 },
  'gpt-4-turbo':        { window_kb: 128, safe_pct: 0.80 },
  'gpt-4o':             { window_kb: 128, safe_pct: 0.80 },
  'gpt-4o-mini':        { window_kb: 128, safe_pct: 0.80 },

  // DeepSeek 系列
  'deepseek':           { window_kb: 128, safe_pct: 0.80 },
  'deepseek-v3':        { window_kb: 128, safe_pct: 0.80 },
  'deepseek-chat':      { window_kb: 128, safe_pct: 0.80 },
  'deepseek-coder':     { window_kb: 128, safe_pct: 0.80 },

  // Qwen 系列
  'qwen':               { window_kb: 128, safe_pct: 0.80 },
  'qwen-max':           { window_kb: 128, safe_pct: 0.80 },
  'qwen-plus':          { window_kb: 128, safe_pct: 0.80 },
  'qwen-turbo':         { window_kb: 128, safe_pct: 0.80 },

  // Gemini 系列
  'gemini':             { window_kb: 128, safe_pct: 0.80 },
  'gemini-pro':         { window_kb: 128, safe_pct: 0.80 },
  'gemini-1.5-pro':     { window_kb: 200, safe_pct: 0.80 },

  // 默认（保守估计）
  'default':            { window_kb: 128, safe_pct: 0.80 },
};

// 上下文预算常量（KB）
const BUDGET_RESERVES = {
  system_prompt: 15,    // 系统提示词（SKILL.md 路由 + 阶段指令 + Agent 定义）
  code_read: 25,        // Step 2.5 依赖类读取
  code_generation: 20,  // 最小安全代码生成空间
  conversation: 10,     // 对话历史预留
};

// ============================================================
// 参数解析
// ============================================================

function parseArgs(args) {
  const opts = { model: null, task: null, demand: null, action: 'calculate', help: false };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--model' && args[i + 1]) { opts.model = args[++i]; }
    else if (args[i] === '--task' && args[i + 1]) { opts.task = args[++i]; }
    else if (args[i] === '--demand' && args[i + 1]) { opts.demand = args[++i]; }
    else if (args[i] === '--action' && args[i + 1]) { opts.action = args[++i]; }
    else if (args[i] === '--help') { opts.help = true; }
  }
  return opts;
}

// ============================================================
// 模型匹配
// ============================================================

function matchModel(modelName) {
  if (!modelName) return MODEL_CONTEXT_WINDOWS['default'];

  const lower = modelName.toLowerCase();

  // 精确匹配
  if (MODEL_CONTEXT_WINDOWS[lower]) return MODEL_CONTEXT_WINDOWS[lower];

  // 前缀匹配
  for (const [key, config] of Object.entries(MODEL_CONTEXT_WINDOWS)) {
    if (key === 'default') continue;
    if (lower.startsWith(key) || lower.includes(key)) return config;
  }

  // 关键词匹配
  if (lower.includes('claude')) return MODEL_CONTEXT_WINDOWS['claude'];
  if (lower.includes('gpt-4')) return MODEL_CONTEXT_WINDOWS['gpt-4'];
  if (lower.includes('deepseek')) return MODEL_CONTEXT_WINDOWS['deepseek'];
  if (lower.includes('qwen')) return MODEL_CONTEXT_WINDOWS['qwen'];
  if (lower.includes('gemini')) return MODEL_CONTEXT_WINDOWS['gemini'];

  return MODEL_CONTEXT_WINDOWS['default'];
}

// ============================================================
// 核心计算
// ============================================================

function calculateBudget(modelName) {
  const modelConfig = matchModel(modelName);
  const windowKb = modelConfig.window_kb;
  const safeAvailable = Math.floor(windowKb * modelConfig.safe_pct);

  const maxBriefKb = safeAvailable
    - BUDGET_RESERVES.system_prompt
    - BUDGET_RESERVES.code_read
    - BUDGET_RESERVES.code_generation
    - BUDGET_RESERVES.conversation;

  const result = {
    model: modelName || 'default',
    matched_config: modelConfig === MODEL_CONTEXT_WINDOWS['default'] ? 'default' : 'matched',
    window_kb: windowKb,
    safe_pct: modelConfig.safe_pct,
    safe_available_kb: safeAvailable,
    max_brief_kb: Math.max(maxBriefKb, 15), // 最低 15KB，保证基本信息
    reserves: { ...BUDGET_RESERVES },
  };

  return result;
}

// ============================================================
// 报告生成
// ============================================================

function generateReport(taskId, demandName, modelName) {
  const budget = calculateBudget(modelName);

  // 尝试读取 task-dag 和 design-contract 估算 brief 大小
  let estimatedBriefKb = 0;
  const briefSections = [];

  // 估算各 section 大小
  const sectionEstimates = [
    { section: 'Task Info', estimated_kb: 1, priority: 'critical' },
    { section: 'Design Contract (Signatures)', estimated_kb: 10, priority: 'critical' },
    { section: 'Subtask Design', estimated_kb: 8, priority: 'critical' },
    { section: 'Develop Rules', estimated_kb: 3, priority: 'critical' },
    { section: 'Dependency Class Definitions', estimated_kb: 10, priority: 'high' },
    { section: 'Coding Conventions', estimated_kb: 5, priority: 'medium' },
    { section: 'Error Patterns', estimated_kb: 3, priority: 'medium' },
    { section: 'Parent Task Results', estimated_kb: 3, priority: 'low' },
  ];

  for (const sec of sectionEstimates) {
    estimatedBriefKb += sec.estimated_kb;
    briefSections.push({
      section: sec.section,
      allocated_kb: sec.priority === 'critical' ? sec.estimated_kb : 0,
      estimated_kb: sec.estimated_kb,
      priority: sec.priority,
    });
  }

  const segmentationRequired = estimatedBriefKb > budget.max_brief_kb;
  const queryProtocolRequired = estimatedBriefKb > budget.max_brief_kb * 0.8;

  const report = {
    task_id: taskId || 'unknown',
    model: budget.model,
    model_window_kb: budget.window_kb,
    safe_available_kb: budget.safe_available_kb,
    budget_allocation: {
      system_prompt: budget.reserves.system_prompt,
      task_brief: budget.max_brief_kb,
      code_read: budget.reserves.code_read,
      code_generation: budget.reserves.code_generation,
      conversation: budget.reserves.conversation,
    },
    brief_sections: briefSections,
    estimated_brief_kb: estimatedBriefKb,
    enforcement: {
      segmentation_required: segmentationRequired,
      segmentation_reason: segmentationRequired
        ? `Estimated brief ${estimatedBriefKb}KB > MAX_BRIEF ${budget.max_brief_kb}KB`
        : '',
      query_protocol_required: queryProtocolRequired,
      query_protocol_reason: queryProtocolRequired
        ? `Estimated brief ${estimatedBriefKb}KB > 80% of MAX_BRIEF ${budget.max_brief_kb}KB`
        : '',
      brief_truncation_required: estimatedBriefKb > budget.max_brief_kb,
    },
  };

  return report;
}

// ============================================================
// 强制执行
// ============================================================

function enforceAction(taskId, demandName, modelName) {
  const report = generateReport(taskId, demandName, modelName);

  if (!fs.existsSync(RUNTIME_DIR)) fs.mkdirSync(RUNTIME_DIR, { recursive: true });

  // 写入预算报告
  const reportPath = path.join(RUNTIME_DIR, `context-budget-${taskId || 'default'}.yaml`);
  const reportYaml = generateReportYaml(report);
  fs.writeFileSync(reportPath, reportYaml, 'utf-8');
  console.log(`[OK] Budget report written to: ${reportPath}`);

  // 如果需要分段，生成分段标记
  if (report.enforcement.segmentation_required) {
    const enforcePath = path.join(RUNTIME_DIR, `segmentation-required-${taskId || 'default'}.yaml`);
    const enforceYaml = [
      `# Segmentation Enforcement Marker`,
      `# Auto-generated by context-budget.cjs`,
      `task_id: "${taskId || 'unknown'}"`,
      `model: "${report.model}"`,
      `segmentation_required: true`,
      `query_protocol_required: ${report.enforcement.query_protocol_required}`,
      `reason: "${report.enforcement.segmentation_reason}"`,
      `generated_at: "${new Date().toISOString()}"`,
    ].join('\n');
    fs.writeFileSync(enforcePath, enforceYaml, 'utf-8');
    console.log(`[WARN] Segmentation required! Marker written to: ${enforcePath}`);
  }

  // 如果需要查询协议，生成标记
  if (report.enforcement.query_protocol_required && !report.enforcement.segmentation_required) {
    console.log(`[INFO] Query protocol recommended for this task (brief close to limit).`);
  }

  return report;
}

function generateReportYaml(report) {
  let yaml = `# Context Budget Report\n`;
  yaml += `# Auto-generated by context-budget.cjs\n`;
  yaml += `# Generated: ${new Date().toISOString()}\n\n`;
  yaml += `task_id: "${report.task_id}"\n`;
  yaml += `model: "${report.model}"\n`;
  yaml += `model_window_kb: ${report.model_window_kb}\n`;
  yaml += `safe_available_kb: ${report.safe_available_kb}\n\n`;
  yaml += `budget_allocation:\n`;
  yaml += `  system_prompt: ${report.budget_allocation.system_prompt}\n`;
  yaml += `  task_brief: ${report.budget_allocation.task_brief}\n`;
  yaml += `  code_read: ${report.budget_allocation.code_read}\n`;
  yaml += `  code_generation: ${report.budget_allocation.code_generation}\n`;
  yaml += `  conversation: ${report.budget_allocation.conversation}\n\n`;
  yaml += `brief_sections:\n`;
  for (const sec of report.brief_sections) {
    yaml += `  - section: "${sec.section}"\n`;
    yaml += `    allocated_kb: ${sec.allocated_kb}\n`;
    yaml += `    estimated_kb: ${sec.estimated_kb}\n`;
    yaml += `    priority: "${sec.priority}"\n`;
  }
  yaml += `\nestimated_brief_kb: ${report.estimated_brief_kb}\n\n`;
  yaml += `enforcement:\n`;
  yaml += `  segmentation_required: ${report.enforcement.segmentation_required}\n`;
  yaml += `  segmentation_reason: "${report.enforcement.segmentation_reason}"\n`;
  yaml += `  query_protocol_required: ${report.enforcement.query_protocol_required}\n`;
  yaml += `  query_protocol_reason: "${report.enforcement.query_protocol_reason}"\n`;
  yaml += `  brief_truncation_required: ${report.enforcement.brief_truncation_required}\n`;
  return yaml;
}

// ============================================================
// 导出（供 prepare-context.cjs 调用）
// ============================================================

module.exports = {
  calculateBudget,
  matchModel,
  MODEL_CONTEXT_WINDOWS,
  BUDGET_RESERVES,
};

// ============================================================
// 主入口
// ============================================================

function main() {
  const args = process.argv.slice(2);
  const opts = parseArgs(args);

  if (opts.help) {
    console.log(`
dev-flow 上下文预算计算引擎

用法：
  node scripts/context-budget.cjs --model <model> --action calculate
  node scripts/context-budget.cjs --model <model> --task <taskId> --demand <name> --action report
  node scripts/context-budget.cjs --model <model> --task <taskId> --demand <name> --action enforce
  node scripts/context-budget.cjs --help

选项：
  --model <name>     AI 模型名称（如 gpt-4, claude-3.5-sonnet, deepseek-v3）
  --task <taskId>    任务 ID（如 Task-5）
  --demand <name>    需求名称
  --action <action>  执行动作：calculate | report | enforce（默认 calculate）
  --help             显示帮助

示例：
  node scripts/context-budget.cjs --model gpt-4 --action calculate
  node scripts/context-budget.cjs --model claude-3.5-sonnet --action calculate
  node scripts/context-budget.cjs --model gpt-4 --task Task-5 --demand user-mgmt --action report
  node scripts/context-budget.cjs --model gpt-4 --task Task-5 --demand user-mgmt --action enforce
`);
    process.exit(0);
  }

  switch (opts.action) {
    case 'calculate': {
      const budget = calculateBudget(opts.model);
      console.log(JSON.stringify(budget, null, 2));
      break;
    }
    case 'report': {
      const report = generateReport(opts.task, opts.demand, opts.model);
      console.log(generateReportYaml(report));
      break;
    }
    case 'enforce': {
      enforceAction(opts.task, opts.demand, opts.model);
      break;
    }
    default:
      console.error(`[ERROR] Unknown action: ${opts.action}. Use calculate|report|enforce`);
      process.exit(1);
  }
}

// 仅在直接运行时执行 main
if (require.main === module) {
  main();
}
