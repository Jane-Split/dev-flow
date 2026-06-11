/**
 * dev-flow 主 Agent 状态持久化工具
 *
 * 将主 Agent 的调度状态持久化到文件，使主 Agent 从"对话累积型"变为"文件恢复型"。
 * 每个阶段入口从文件恢复状态，出口更新状态文件，对话历史可安全压缩。
 *
 * 用法：
 *   node scripts/orchestrator-state.cjs --action save --session sess-001 --demand 订单管理 --stage research
 *   node scripts/orchestrator-state.cjs --action restore --session sess-001
 *   node scripts/orchestrator-state.cjs --action update --session sess-001 --stage develop --data 'develop_progress.mode=parallel'
 *   node scripts/orchestrator-state.cjs --action summary --session sess-001
 *   node scripts/orchestrator-state.cjs --help
 *
 * 依赖：零外部依赖
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SESSIONS_DIR = path.join(ROOT, '.dev-flow', 'sessions');
const CONFIRMATIONS_DIR = path.join(ROOT, '.dev-flow', 'stage-confirmations');
const DELIVERABLES_DIR = path.join(ROOT, '.dev-flow', 'deliverables');
const SUMMARIES_DIR_SUFFIX = 'stage-summaries';

// ============================================================
// 参数解析
// ============================================================

function parseArgs(args) {
  const opts = {
    action: null,
    session: null,
    demand: null,
    demandShort: null,
    stage: null,
    data: null,
    help: false,
  };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--action' && args[i + 1]) { opts.action = args[++i]; }
    else if (args[i] === '--session' && args[i + 1]) { opts.session = args[++i]; }
    else if (args[i] === '--demand' && args[i + 1]) { opts.demand = args[++i]; }
    else if (args[i] === '--demand-short' && args[i + 1]) { opts.demandShort = args[++i]; }
    else if (args[i] === '--stage' && args[i + 1]) { opts.stage = args[++i]; }
    else if (args[i] === '--data' && args[i + 1]) { opts.data = args[++i]; }
    else if (args[i] === '--help') { opts.help = true; }
  }
  return opts;
}

// ============================================================
// 状态文件路径
// ============================================================

function getStatePath(sessionId) {
  const sessionDir = path.join(SESSIONS_DIR, sessionId);
  if (!fs.existsSync(sessionDir)) fs.mkdirSync(sessionDir, { recursive: true });
  return path.join(sessionDir, 'orchestrator-state.yaml');
}

// ============================================================
// YAML 简易操作
// ============================================================

function readState(statePath) {
  if (!fs.existsSync(statePath)) return null;
  const content = fs.readFileSync(statePath, 'utf-8');
  return parseSimpleYaml(content);
}

function writeState(statePath, state) {
  const dir = path.dirname(statePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const yaml = stateToYaml(state);
  fs.writeFileSync(statePath, yaml, 'utf-8');
}

function parseSimpleYaml(content) {
  const result = {};
  const lines = content.split('\n');
  let currentKey = null;
  let inList = false;
  let listKey = null;
  let currentObj = null;
  let inStages = false;
  let inDevelop = false;
  let inPrefs = false;

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    // 顶层 key: value
    const topMatch = trimmed.match(/^([a-z_]+):\s*(.*)$/i);
    if (topMatch && !rawLine.startsWith(' ')) {
      currentKey = topMatch[1];
      const val = topMatch[2].trim();

      if (currentKey === 'stages_completed') { inStages = true; inDevelop = false; inPrefs = false; continue; }
      if (currentKey === 'develop_progress') { inDevelop = true; inStages = false; inPrefs = false; continue; }
      if (currentKey === 'user_preferences') { inPrefs = true; inStages = false; inDevelop = false; continue; }

      inStages = false; inDevelop = false; inPrefs = false;

      if (val === '' || val === '|' || val === '>') {
        result[currentKey] = val === '' ? null : val;
      } else {
        result[currentKey] = parseValue(val);
      }
      continue;
    }

    // List items (stages_completed)
    if (inStages && trimmed.startsWith('- stage:')) {
      const stageMatch = trimmed.match(/^- stage:\s*["']?(.+?)["']?\s*$/);
      if (stageMatch) {
        if (!result.stages_completed) result.stages_completed = [];
        currentObj = { stage: stageMatch[1] };
        result.stages_completed.push(currentObj);
      }
      continue;
    }

    if (inStages && currentObj) {
      const kvMatch = trimmed.match(/^([a-z_]+):\s*(.*)$/i);
      if (kvMatch) {
        currentObj[kvMatch[1]] = parseValue(kvMatch[2].trim());
      }
      continue;
    }

    // develop_progress fields
    if (inDevelop) {
      const kvMatch = trimmed.match(/^([a-z_]+):\s*(.*)$/i);
      if (kvMatch) {
        if (!result.develop_progress) result.develop_progress = {};
        const val = kvMatch[2].trim();
        if (val.startsWith('[')) {
          result.develop_progress[kvMatch[1]] = val.replace(/[\[\]"']/g, '').split(',').map(s => s.trim()).filter(Boolean);
        } else {
          result.develop_progress[kvMatch[1]] = parseValue(val);
        }
      }
      continue;
    }

    // user_preferences
    if (inPrefs && trimmed.startsWith('- ')) {
      if (!result.user_preferences) result.user_preferences = [];
      result.user_preferences.push(trimmed.slice(2).replace(/^["']|["']$/g, ''));
      continue;
    }
  }

  return result;
}

function parseValue(val) {
  if (!val || val === 'null' || val === '~') return null;
  if (val === 'true') return true;
  if (val === 'false') return false;
  if (/^["'](.*)["']$/.test(val)) return val.slice(1, -1);
  if (/^-?\d+$/.test(val)) return parseInt(val, 10);
  if (/^-?\d+\.\d+$/.test(val)) return parseFloat(val);
  return val;
}

function stateToYaml(state) {
  let yaml = `# Orchestrator State\n`;
  yaml += `# Auto-generated by orchestrator-state.cjs\n`;
  yaml += `# Updated: ${new Date().toISOString()}\n\n`;

  yaml += `version: "1.0"\n`;
  yaml += `session_id: "${state.session_id || ''}"\n`;
  yaml += `demand_name: "${state.demand_name || ''}"\n`;
  yaml += `demand_short: "${state.demand_short || ''}"\n`;
  yaml += `created_at: "${state.created_at || new Date().toISOString()}"\n`;
  yaml += `updated_at: "${new Date().toISOString()}"\n\n`;

  yaml += `current_stage: "${state.current_stage || ''}"\n`;
  yaml += `stage_entered_at: "${state.stage_entered_at || new Date().toISOString()}"\n\n`;

  // stages_completed
  if (state.stages_completed && state.stages_completed.length > 0) {
    yaml += `stages_completed:\n`;
    for (const s of state.stages_completed) {
      yaml += `  - stage: "${s.stage || ''}"\n`;
      yaml += `    confirmed_at: "${s.confirmed_at || ''}"\n`;
      yaml += `    deliverable: "${s.deliverable || ''}"\n`;
      yaml += `    summary_file: "${s.summary_file || ''}"\n`;
      if (s.key_decisions && s.key_decisions.length > 0) {
        yaml += `    key_decisions:\n`;
        for (const d of s.key_decisions) {
          yaml += `      - "${d}"\n`;
        }
      }
    }
    yaml += `\n`;
  } else {
    yaml += `stages_completed: []\n\n`;
  }

  // develop_progress
  if (state.develop_progress) {
    yaml += `develop_progress:\n`;
    const dp = state.develop_progress;
    if (dp.mode) yaml += `  mode: "${dp.mode}"\n`;
    if (dp.completed_tasks) yaml += `  completed_tasks: [${dp.completed_tasks.map(t => `"${t}"`).join(', ')}]\n`;
    if (dp.current_batch) yaml += `  current_batch: [${dp.current_batch.map(t => `"${t}"`).join(', ')}]\n`;
    if (dp.pending_tasks) yaml += `  pending_tasks: [${dp.pending_tasks.map(t => `"${t}"`).join(', ')}]\n`;
    if (dp.failed_tasks) yaml += `  failed_tasks: [${dp.failed_tasks.map(t => `"${t}"`).join(', ')}]\n`;
    yaml += `\n`;
  }

  // next_action
  yaml += `next_action: "${(state.next_action || '').replace(/"/g, '\\"')}"\n\n`;

  // user_preferences
  if (state.user_preferences && state.user_preferences.length > 0) {
    yaml += `user_preferences:\n`;
    for (const p of state.user_preferences) {
      yaml += `  - "${p}"\n`;
    }
    yaml += `\n`;
  }

  // context_snapshot
  if (state.context_snapshot) {
    yaml += `context_snapshot:\n`;
    const cs = state.context_snapshot;
    if (cs.model) yaml += `  model: "${cs.model}"\n`;
    if (cs.estimated_main_agent_usage_kb) yaml += `  estimated_main_agent_usage_kb: ${cs.estimated_main_agent_usage_kb}\n`;
    yaml += `  last_budget_check: "${cs.last_budget_check || new Date().toISOString()}"\n`;
  }

  return yaml;
}

// ============================================================
// 动作实现
// ============================================================

function saveAction(sessionId, demandName, demandShort, stage) {
  const statePath = getStatePath(sessionId);
  const existing = readState(statePath) || {};

  const state = {
    ...existing,
    session_id: sessionId,
    demand_name: demandName || existing.demand_name || '',
    demand_short: demandShort || existing.demand_short || '',
    current_stage: stage || existing.current_stage || '',
    stage_entered_at: new Date().toISOString(),
    created_at: existing.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
    stages_completed: existing.stages_completed || [],
    develop_progress: existing.develop_progress || {},
    next_action: existing.next_action || '',
    user_preferences: existing.user_preferences || [],
    context_snapshot: existing.context_snapshot || {},
  };

  writeState(statePath, state);
  console.log(`[OK] State saved to: ${statePath}`);
  console.log(`[INFO] Session: ${sessionId}, Stage: ${state.current_stage}`);
  return state;
}

function restoreAction(sessionId) {
  const statePath = getStatePath(sessionId);
  const state = readState(statePath);

  if (!state) {
    console.error(`[ERROR] No state file found for session: ${sessionId}`);
    console.error(`  Path: ${statePath}`);
    process.exit(1);
  }

  console.log(`[OK] State restored from: ${statePath}`);
  console.log(`[INFO] Session: ${state.session_id}, Current Stage: ${state.current_stage}`);
  return state;
}

function updateAction(sessionId, stage, dataStr) {
  const statePath = getStatePath(sessionId);
  const state = readState(statePath);

  if (!state) {
    console.error(`[ERROR] No state file found for session: ${sessionId}`);
    process.exit(1);
  }

  // 更新阶段
  if (stage) {
    state.current_stage = stage;
    state.stage_entered_at = new Date().toISOString();
  }

  // 更新数据（简单 key=value 格式）
  if (dataStr) {
    const pairs = dataStr.split(',');
    for (const pair of pairs) {
      const [key, value] = pair.split('=').map(s => s.trim());
      if (key && value) {
        // 支持 develop_progress.xxx 格式
        if (key.startsWith('develop_progress.')) {
          const subKey = key.replace('develop_progress.', '');
          if (!state.develop_progress) state.develop_progress = {};
          if (value.startsWith('[')) {
            state.develop_progress[subKey] = value.replace(/[\[\]"']/g, '').split(',').map(s => s.trim()).filter(Boolean);
          } else {
            state.develop_progress[subKey] = value;
          }
        } else if (key === 'next_action') {
          state.next_action = value;
        } else {
          state[key] = value;
        }
      }
    }
  }

  state.updated_at = new Date().toISOString();
  writeState(statePath, state);
  console.log(`[OK] State updated: ${statePath}`);
  return state;
}

function summaryAction(sessionId) {
  const statePath = getStatePath(sessionId);
  const state = readState(statePath);

  if (!state) {
    console.error(`[ERROR] No state file found for session: ${sessionId}`);
    process.exit(1);
  }

  // 生成精简摘要（~2KB）
  const summary = {
    session_id: state.session_id,
    demand_name: state.demand_name,
    demand_short: state.demand_short,
    current_stage: state.current_stage,
    completed_stages: (state.stages_completed || []).map(s => s.stage),
    develop_progress: state.develop_progress || {},
    next_action: state.next_action || '',
    user_preferences: state.user_preferences || [],
  };

  const summaryYaml = [
    `# Orchestrator State Summary (~2KB)`,
    `# For main Agent to restore context at stage entry`,
    ``,
    `session_id: "${summary.session_id}"`,
    `demand: "${summary.demand_name}"`,
    `demand_short: "${summary.demand_short}"`,
    `current_stage: "${summary.current_stage}"`,
    `completed_stages: [${summary.completed_stages.map(s => `"${s}"`).join(', ')}]`,
    ``,
  ];

  if (summary.develop_progress && Object.keys(summary.develop_progress).length > 0) {
    summaryYaml.push(`develop_progress:`);
    const dp = summary.develop_progress;
    if (dp.mode) summaryYaml.push(`  mode: "${dp.mode}"`);
    if (dp.completed_tasks) summaryYaml.push(`  completed_tasks: [${dp.completed_tasks.map(t => `"${t}"`).join(', ')}]`);
    if (dp.current_batch) summaryYaml.push(`  current_batch: [${dp.current_batch.map(t => `"${t}"`).join(', ')}]`);
    if (dp.pending_tasks) summaryYaml.push(`  pending_tasks: [${dp.pending_tasks.map(t => `"${t}"`).join(', ')}]`);
    summaryYaml.push(``);
  }

  summaryYaml.push(`next_action: "${(summary.next_action || '').replace(/"/g, '\\"')}"`);

  if (summary.user_preferences && summary.user_preferences.length > 0) {
    summaryYaml.push(``);
    summaryYaml.push(`user_preferences:`);
    for (const p of summary.user_preferences) {
      summaryYaml.push(`  - "${p}"`);
    }
  }

  console.log(summaryYaml.join('\n'));
  return summary;
}

// ============================================================
// 主入口
// ============================================================

function main() {
  const args = process.argv.slice(2);
  const opts = parseArgs(args);

  if (opts.help) {
    console.log(`
dev-flow 主 Agent 状态持久化工具

用法：
  node scripts/orchestrator-state.cjs --action save --session <id> [--demand <name>] [--demand-short <name>] [--stage <stage>]
  node scripts/orchestrator-state.cjs --action restore --session <id>
  node scripts/orchestrator-state.cjs --action update --session <id> [--stage <stage>] [--data <key=value,...>]
  node scripts/orchestrator-state.cjs --action summary --session <id>
  node scripts/orchestrator-state.cjs --help

选项：
  --action <action>     save | restore | update | summary
  --session <id>        会话 ID
  --demand <name>       需求名称
  --demand-short <name> 需求简称
  --stage <stage>       当前阶段
  --data <key=value>    更新数据（逗号分隔的 key=value 对）
  --help                显示帮助

示例：
  node scripts/orchestrator-state.cjs --action save --session sess-001 --demand 订单管理 --stage research
  node scripts/orchestrator-state.cjs --action update --session sess-001 --stage develop --data "develop_progress.mode=parallel,next_action=dispatch Task-3"
  node scripts/orchestrator-state.cjs --action summary --session sess-001
`);
    process.exit(0);
  }

  if (!opts.action) {
    console.error('[ERROR] Must specify --action (save|restore|update|summary)');
    process.exit(1);
  }

  if (!opts.session && opts.action !== 'help') {
    console.error('[ERROR] Must specify --session');
    process.exit(1);
  }

  switch (opts.action) {
    case 'save':
      saveAction(opts.session, opts.demand, opts.demandShort, opts.stage);
      break;
    case 'restore':
      restoreAction(opts.session);
      break;
    case 'update':
      updateAction(opts.session, opts.stage, opts.data);
      break;
    case 'summary':
      summaryAction(opts.session);
      break;
    default:
      console.error(`[ERROR] Unknown action: ${opts.action}`);
      process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  saveAction,
  restoreAction,
  updateAction,
  summaryAction,
  readState,
  writeState,
  getStatePath,
};
