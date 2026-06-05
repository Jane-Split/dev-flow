/**
 * dev-flow 平台调度引擎
 *
 * 从 task-dag.yaml 读取任务依赖图，根据当前平台选择最优调度策略，
 * 自动派发 subagent 并收集结果。
 *
 * 用法：
 *   node scripts/dispatch.cjs                    # 交互式：自动检测平台
 *   node scripts/dispatch.cjs --platform cursor  # 指定平台
 *   node scripts/dispatch.cjs --dry-run           # 仅输出调度计划，不实际执行
 *   node scripts/dispatch.cjs --help             # 显示帮助
 *
 * 依赖：零外部依赖，仅需 Node.js 和各平台 CLI 工具（如已安装）。
 */

const fs = require('fs');
const path = require('path');

// ============================================================
// 配置
// ============================================================

const ROOT = path.resolve(__dirname, '..');
const RUNTIME_DIR = path.join(ROOT, '.dev-flow', 'runtime');
const DOCS_DIR = path.join(ROOT, '.dev-flow', 'docs');

// ============================================================
// 平台检测
// ============================================================

function detectPlatform(projectRoot) {
  const checks = [
    { name: 'cursor', dirs: ['.cursor/agents', '.cursor/rules'] },
    { name: 'claude', dirs: ['.claude/agents'], files: ['CLAUDE.md'] },
    { name: 'qoder', dirs: ['.qoder'] },
    { name: 'codex', dirs: ['.codex/agents'], files: ['AGENTS.md'] },
    { name: 'trae', dirs: ['.trae/skills'] },
  ];

  for (const platform of checks) {
    for (const dir of platform.dirs || []) {
      if (fs.existsSync(path.join(projectRoot, dir))) return platform.name;
    }
    for (const file of platform.files || []) {
      if (fs.existsSync(path.join(projectRoot, file))) return platform.name;
    }
  }

  return 'trae'; // 默认使用最通用的 Trae 模式
}

// ============================================================
// DAG 解析与拓扑排序
// ============================================================

function parseTaskDag(dagContent) {
  // 简单的 YAML-like 解析（不引入外部依赖）
  // 实际使用中，如果项目有 js-yaml 可以替换
  const tasks = [];
  const lines = dagContent.split('\n');
  let currentTask = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const idMatch = trimmed.match(/^- id:\s*["']?(.+?)["']?\s*$/);
    if (idMatch) {
      currentTask = { id: idMatch[1], dependencies: [], agent: '', type: '', parallel_group: '', batch: -1 };
      tasks.push(currentTask);
      continue;
    }

    if (!currentTask) continue;

    const depMatch = trimmed.match(/^dependencies:\s*\[(.+?)\]\s*$/);
    if (depMatch) {
      currentTask.dependencies = depMatch[1].split(',').map(s => s.trim()).filter(Boolean);
    }

    const agentMatch = trimmed.match(/^agent:\s*["']?(.+?)["']?\s*$/);
    if (agentMatch) currentTask.agent = agentMatch[1];

    const typeMatch = trimmed.match(/^type:\s*["']?(.+?)["']?\s*$/);
    if (typeMatch) currentTask.type = typeMatch[1];

    const pgMatch = trimmed.match(/^parallel_group:\s*["']?(.+?)["']?\s*$/);
    if (pgMatch) currentTask.parallel_group = pgMatch[1];
  }

  return tasks;
}

function topologicalSort(tasks) {
  // Kahn 算法
  const inDegree = new Map();
  const adjacency = new Map();
  const taskMap = new Map();

  for (const task of tasks) {
    taskMap.set(task.id, task);
    inDegree.set(task.id, 0);
    adjacency.set(task.id, []);
  }

  for (const task of tasks) {
    for (const dep of task.dependencies) {
      if (adjacency.has(dep)) {
        adjacency.get(dep).push(task.id);
        inDegree.set(task.id, (inDegree.get(task.id) || 0) + 1);
      }
    }
  }

  const queue = [];
  for (const [id, degree] of inDegree) {
    if (degree === 0) queue.push(id);
  }

  const batches = [];
  while (queue.length > 0) {
    const batch = [...queue];
    batches.push(batch);

    const nextQueue = [];
    for (const id of batch) {
      for (const neighbor of adjacency.get(id) || []) {
        const newDegree = inDegree.get(neighbor) - 1;
        inDegree.set(neighbor, newDegree);
        if (newDegree === 0) nextQueue.push(neighbor);
      }
    }
    queue.length = 0;
    queue.push(...nextQueue);
  }

  // 标记每个任务的批次
  batches.forEach((batch, batchIndex) => {
    for (const taskId of batch) {
      const task = taskMap.get(taskId);
      if (task) task.batch = batchIndex;
    }
  });

  return { batches, taskMap };
}

// ============================================================
// 冲突检测
// ============================================================

function detectConflicts(tasks) {
  // 按批次分组
  const batches = new Map();
  for (const task of tasks) {
    const b = task.batch || 0;
    if (!batches.has(b)) batches.set(b, []);
    batches.get(b).push(task);
  }

  const conflicts = [];

  for (const [batchIdx, batchTasks] of batches) {
    for (let i = 0; i < batchTasks.length; i++) {
      for (let j = i + 1; j < batchTasks.length; j++) {
        const a = batchTasks[i];
        const b = batchTasks[j];

        // 简化冲突检测：基于任务描述中的文件路径（实际需要更精确的解析）
        // 这里输出冲突检测指令供 AI subagent 执行
        if (a.parallel_group && a.parallel_group === b.parallel_group) {
          // 同 parallel_group 内的文件可能冲突
          conflicts.push({
            task_a: a.id,
            task_b: b.id,
            conflict_type: 'potential_write-write',
            file: `parallel_group: ${a.parallel_group}`,
            resolution: `检查 ${a.id} 和 ${b.id} 是否操作相同文件，如有则串行执行`,
          });
        }
      }
    }
  }

  return conflicts;
}

// ============================================================
// 平台调度策略
// ============================================================

function generateDispatchPlan(platform, batches, taskMap, demandName) {
  const plan = {
    platform,
    total_tasks: taskMap.size,
    total_batches: batches.length,
    batches: [],
  };

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i].map(id => taskMap.get(id)).filter(Boolean);
    const batchPlan = {
      batch_index: i,
      tasks: batch.map(t => ({ id: t.id, agent: t.agent, type: t.type })),
      dispatch_commands: [],
    };

    switch (platform) {
      case 'trae':
        batchPlan.dispatch_commands = batch.map(t =>
          `/develop-expert [task: ${t.id}, demand: ${demandName}]`
        );
        break;

      case 'cursor':
        // Cursor: 一条消息发送多个 Task 工具调用
        batchPlan.dispatch_commands = [`[并行派发 ${batch.length} 个 Task]`];
        batchPlan.task_calls = batch.map((t, idx) => ({
          call: `Task: /develop-expert`,
          task_id: t.id,
          agent: t.agent || 'develop-expert',
          is_background: idx > 0,
          model: 'inherit',
        }));
        break;

      case 'claude':
        // Claude Code: Dynamic Workflows JS 编排
        batchPlan.dispatch_commands = [`dispatchBatch([${batch.map(t => `"${t.id}"`).join(', ')}], concurrency=${Math.min(batch.length, 16)})`];
        batchPlan.workflow_snippet = generateClaudeWorkflow(batch, i);
        break;

      case 'qoder':
        // Qoder: Quest Mode 主从架构
        batchPlan.dispatch_commands = batch.map(t =>
          `Quest: /develop-expert [task: ${t.id}, direction: ${classifyDirection(t)}]`
        );
        break;

      case 'codex':
        // Codex: CSV 批量 + 6 线程限制
        batchPlan.dispatch_commands = [`run agent: develop-expert (batch ${i + 1}, ${batch.length} tasks, max 6 threads)`];
        batchPlan.csv_tasks = batch.map(t => ({
          task_id: t.id,
          agent: t.agent || 'develop-expert',
        }));
        break;
    }

    plan.batches.push(batchPlan);
  }

  return plan;
}

function generateClaudeWorkflow(batch, batchIndex) {
  const taskIds = batch.map(t => t.id);
  return `
// Claude Code Dynamic Workflow - Batch ${batchIndex + 1}
async function batch${batchIndex + 1}() {
  const tasks = [${taskIds.map(id => `'${id}'`).join(', ')}];
  const concurrency = Math.min(${batch.length}, 16);

  const results = await Promise.allSettled(
    tasks.map(id => spawnSubagent({ taskId: id, stage: 'develop' }))
  );

  // 对抗验证：自动检查产出质量
  for (const result of results) {
    if (result.status === 'rejected') {
      console.error(\`Task failed: \${result.reason}\`);
      // 自动重试或报告主 agent
    }
  }

  return results;
}`;
}

function classifyDirection(task) {
  const type = task.type || '';
  const id = task.id || '';

  if (type.includes('frontend') || id.includes('ui') || id.includes('page') || id.includes('component')) return 'frontend';
  if (type.includes('test') || id.includes('test')) return 'test';
  if (type.includes('deploy') || id.includes('deploy') || id.includes('config')) return 'deploy';
  return 'backend';
}

// ============================================================
// 结果收集
// ============================================================

function collectResults(batchIndex, taskIds) {
  const results = [];
  for (const taskId of taskIds) {
    const resultFile = path.join(RUNTIME_DIR, `task-result-${taskId}.yaml`);
    if (fs.existsSync(resultFile)) {
      const content = fs.readFileSync(resultFile, 'utf-8');
      results.push({ task_id: taskId, file: resultFile, content: content.substring(0, 500) });
    } else {
      results.push({ task_id: taskId, file: null, status: 'pending' });
    }
  }
  return results;
}

// ============================================================
// 主入口
// ============================================================

function main() {
  const args = process.argv.slice(2);

  if (args.includes('--help')) {
    console.log(`
dev-flow 平台调度引擎

用法：
  node scripts/dispatch.cjs [--platform <platform>] [--dry-run] [--help]

选项：
  --platform <platform>  指定平台 (cursor/claude/qoder/codex/trae)
  --dry-run             仅输出调度计划，不实际执行
  --help                显示帮助

示例：
  node scripts/dispatch.cjs                          # 自动检测平台并生成调度计划
  node scripts/dispatch.cjs --platform cursor --dry-run  # Cursor 平台，仅预览
`);
    process.exit(0);
  }

  const projectRoot = process.cwd();
  const isDryRun = args.includes('--dry-run');
  const platformArg = args.find(a => !a.startsWith('--') && a !== 'node' && a !== 'dispatch.cjs');
  const platform = platformArg || detectPlatform(projectRoot);

  // 查找 task-dag.yaml
  const dagFile = path.join(DOCS_DIR, findDagFile(DOCS_DIR));
  if (!fs.existsSync(dagFile)) {
    console.error(`[ERROR] 未找到 task-dag.yaml 文件`);
    console.error(`请确保 Task Split 阶段已输出 DAG 文件到 ${DOCS_DIR}/`);
    console.error(`查找路径：${dagFile}`);
    process.exit(1);
  }

  // 解析 DAG
  const dagContent = fs.readFileSync(dagFile, 'utf-8');
  const tasks = parseTaskDag(dagContent);

  if (tasks.length === 0) {
    console.error('[ERROR] task-dag.yaml 中未解析到任何任务');
    process.exit(1);
  }

  // 拓扑排序
  const { batches, taskMap } = topologicalSort(tasks);

  // 冲突检测
  const conflicts = detectConflicts(tasks);

  // 提取需求名称（从 DAG 文件名推断）
  const dagFileName = path.basename(dagFile);
  const demandName = dagFileName.replace('-task-dag.yaml', '').replace('task-dag.yaml', 'current');

  // 生成调度计划
  const plan = generateDispatchPlan(platform, batches, taskMap, demandName);

  // 输出
  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log(`  dev-flow 平台调度引擎`);
  console.log('═══════════════════════════════════════════════════');
  console.log('');
  console.log(`【平台检测】当前平台: ${platform.charAt(0).toUpperCase() + platform.slice(1)}`);
  console.log(`【任务统计】总任务数: ${plan.total_tasks}，批次数: ${plan.total_batches}`);

  if (conflicts.length > 0) {
    console.log(`【冲突检测】发现 ${conflicts.length} 个潜在冲突：`);
    for (const c of conflicts) {
      console.log(`  ⚠️ ${c.task_a} ↔ ${c.task_b}: ${c.resolution}`);
    }
  }

  console.log('');
  console.log('--- 调度计划 ---');
  for (const batch of plan.batches) {
    console.log(`\n📌 批次 ${batch.batch_index + 1}（${batch.tasks.length} 个任务）：`);
    for (const task of batch.tasks) {
      console.log(`   ├─ ${task.id} → ${task.agent || 'develop-expert'}`);
    }
    console.log(`   └─ 调度命令：`);
    for (const cmd of batch.dispatch_commands) {
      console.log(`      ${cmd}`);
    }
    if (batch.task_calls) {
      for (const call of batch.task_calls) {
        console.log(`      ${call.call} [task: ${call.task_id}, background: ${call.is_background}]`);
      }
    }
  }

  if (isDryRun) {
    console.log('');
    console.log('🔍 [DRY RUN] 仅预览调度计划，未实际执行');
    console.log('');
    console.log('如需实际执行，移除 --dry-run 参数');
    return;
  }

  // 写入调度计划文件
  const planFile = path.join(RUNTIME_DIR, 'dispatch-plan.yaml');
  fs.mkdirSync(RUNTIME_DIR, { recursive: true });

  const planYaml = [
    `# dev-flow 调度计划（自动生成）`,
    `# 平台: ${platform}`,
    `# 生成时间: ${new Date().toISOString()}`,
    `# 总任务: ${plan.total_tasks}`,
    `# 批次数: ${plan.total_batches}`,
    ``,
    `platform: "${platform}"`,
    `total_tasks: ${plan.total_tasks}`,
    `total_batches: ${plan.total_batches}`,
    `batches:`,
    ...plan.batches.map(b => [
      `  - batch: ${b.batch_index + 1}`,
      `    tasks: [${b.tasks.map(t => `"${t.id}"`).join(', ')}]`,
      `    parallel: ${b.tasks.length > 1}`,
      `    commands:`,
      ...b.dispatch_commands.map(c => `      - "${c}"`),
    ].join('\n')),
  ].join('\n');

  fs.writeFileSync(planFile, planYaml, 'utf-8');
  console.log('');
  console.log(`📄 调度计划已写入: ${planFile}`);
  console.log('');
  console.log('执行说明：');
  console.log('  1. 按批次顺序执行上述调度命令');
  console.log('  2. 每个批次完成后，检查 task-result-{taskId}.yaml 确认所有任务成功');
  console.log('  3. 如有任务失败，参考冲突检测结果调整后重新执行');
}

function findDagFile(docsDir) {
  if (!fs.existsSync(docsDir)) return 'task-dag.yaml';

  const files = fs.readdirSync(docsDir).filter(f => f.includes('task-dag'));
  if (files.length > 0) return files[0];
  return 'task-dag.yaml';
}

main();
