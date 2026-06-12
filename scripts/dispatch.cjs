/**
 * dev-flow 平台调度引擎 (v3.2)
 *
 * 从 task-dag.yaml 读取任务依赖图，根据当前平台选择最优调度策略，
 * 自动派发 subagent 并收集结果。
 * v3.0: 集成 prepare-context.cjs（上下文注入）和 validate-result.cjs（产出校验）
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

// 平台并发上限（防止大批次同时启动过多 subagent 导致系统卡顿）
const MAX_CONCURRENT = {

// v3.7.0: 按项目类型调整并发数（Java编译较重，适当降低）
const TYPE_CONCURRENT_ADJUST = {
  frontend: 0,
  backend: 0,
  'java-microservice': -1,
  fullstack: 0,
  'java-fullstack': -1,
};
  cursor: 3,
  trae: 5,
  claude: 4,
  codex: 3,
  qoder: 2,
};

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
  // YAML-like 解析（零外部依赖）
  // 支持一级和简单二级字段解析
  const tasks = [];
  const lines = dagContent.split('\n');
  let currentTask = null;
  let currentIndent = -1;

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    // 计算缩进层级
    const indent = rawLine.search(/\S/);
    if (indent < 0) continue;

    // 一级字段：任务开始
    if (indent === 0 && trimmed.match(/^- /)) {
      const idMatch = trimmed.match(/^-\s*id:\s*["']?(.+?)["']?\s*$/);
      if (idMatch) {
        currentTask = {
          id: idMatch[1],
          dependencies: [],
          agent: '',
          type: '',
          parallel_group: '',
          target_files: [],    // 🔴 v2.1 新增：任务操作的目标文件
          read_files: [],      // 🔴 v2.1 新增：任务需要读取的文件
          batch: -1,
        };
        tasks.push(currentTask);
        currentIndent = indent;
        continue;
      }
    }

    if (!currentTask) continue;

    // 二级字段（缩进 > 0）
    const depMatch = trimmed.match(/^dependencies:\s*\[(.+?)\]\s*$/);
    if (depMatch) {
      currentTask.dependencies = depMatch[1].split(',').map(s => s.trim()).filter(Boolean);
      continue;
    }

    // 支持 YAML 列表格式的 dependencies
    if (trimmed === 'dependencies:') {
      currentTask._collecting = 'dependencies';
      currentIndent = indent;
      continue;
    }
    if (indent > currentIndent && currentTask._collecting === 'dependencies' && trimmed.startsWith('- ')) {
      currentTask.dependencies.push(trimmed.slice(2).trim());
      continue;
    }

    // 收集 target_files 列表
    if (trimmed === 'target_files:') {
      currentTask._collecting = 'target_files';
      currentIndent = indent;
      continue;
    }
    if (indent > currentIndent && currentTask._collecting === 'target_files' && trimmed.startsWith('- ')) {
      currentTask.target_files.push(trimmed.slice(2).trim().replace(/["']/g, ''));
      continue;
    }

    // 收集 read_files 列表
    if (trimmed === 'read_files:') {
      currentTask._collecting = 'read_files';
      currentIndent = indent;
      continue;
    }
    if (indent > currentIndent && currentTask._collecting === 'read_files' && trimmed.startsWith('- ')) {
      currentTask.read_files.push(trimmed.slice(2).trim().replace(/["']/g, ''));
      continue;
    }

    // 普通字符串字段
    currentTask._collecting = null;
    const agentMatch = trimmed.match(/^agent:\s*["']?(.+?)["']?\s*$/);
    if (agentMatch) { currentTask.agent = agentMatch[1]; continue; }

    const typeMatch = trimmed.match(/^type:\s*["']?(.+?)["']?\s*$/);
    if (typeMatch) { currentTask.type = typeMatch[1]; continue; }

    const pgMatch = trimmed.match(/^parallel_group:\s*["']?(.+?)["']?\s*$/);
    if (pgMatch) { currentTask.parallel_group = pgMatch[1]; continue; }

    const nameMatch = trimmed.match(/^name:\s*["']?(.+?)["']?\s*$/);
    if (nameMatch) { currentTask.name = nameMatch[1]; continue; }

    const taskMatch = trimmed.match(/^task:\s*["']?(.+?)["']?\s*$/);
    if (taskMatch) { currentTask.task = taskMatch[1]; continue; }

    const ctxInjMatch = trimmed.match(/^context_injection:\s*(true|false|yes|no)\s*$/i);
    if (ctxInjMatch) { currentTask.context_injection = ctxInjMatch[1].toLowerCase() === 'true' || ctxInjMatch[1].toLowerCase() === 'yes'; continue; }
  }

  // 清理内部字段
  for (const task of tasks) {
    delete task._collecting;
  }

  return tasks;
}

function topologicalSort(tasks) {
  // Kahn 算法 + 循环依赖检测
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
      // 🔴 v2.1: 依赖指向不存在的任务时发出警告
      if (!taskMap.has(dep) && !tasks.some(t => t.id === dep)) {
        console.warn(`[WARN] 任务 ${task.id} 的依赖 "${dep}" 不存在，已忽略`);
      }
    }
  }

  const queue = [];
  for (const [id, degree] of inDegree) {
    if (degree === 0) queue.push(id);
  }

  const batches = [];
  const processed = new Set();

  while (queue.length > 0) {
    const batch = [...queue];
    batches.push(batch);
    for (const id of batch) processed.add(id);

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

  // 🔴 v2.1: 循环依赖检测
  const unprocessed = tasks.filter(t => !processed.has(t.id));
  if (unprocessed.length > 0) {
    console.error(`[ERROR] 检测到循环依赖！以下任务无法完成拓扑排序：`);
    for (const t of unprocessed) {
      console.error(`  - ${t.id} (依赖: ${t.dependencies.join(', ')})`);
    }
    console.error('');
    console.error('请检查 task-dag.yaml 中的依赖关系，移除循环依赖后重新运行。');
    process.exit(1);
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

/**
 * 将大批次按 max_concurrent 拆分为多个子批次（Chunks）
 * 子批次之间采用滑动窗口调度：前一批完成 N 个任务后启动下一批的 N 个任务
 * 这样任何时刻活跃 subagent 总数 <= max_concurrent
 */
function splitLargeBatch(batchTaskIds, maxConcurrent) {
  if (batchTaskIds.length <= maxConcurrent) {
    return [{ taskIds: batchTaskIds, chunkIndex: 0 }];
  }
  const chunks = [];
  let chunkIndex = 0;
  for (let i = 0; i < batchTaskIds.length; i += maxConcurrent) {
    chunks.push({
      taskIds: batchTaskIds.slice(i, i + maxConcurrent),
      chunkIndex: chunkIndex++,
    });
  }
  return chunks;
}

// ============================================================
// 冲突检测（v2.1 增强：文件级冲突检测 + DAG 重排）
// ============================================================

function detectConflicts(tasks) {
  const conflicts = [];
  const fileWriteMap = new Map(); // file -> [taskId, ...]
  const fileReadMap = new Map();  // file -> [taskId, ...]

  // 建立文件 → 任务映射
  for (const task of tasks) {
    for (const file of task.target_files || []) {
      if (!fileWriteMap.has(file)) fileWriteMap.set(file, []);
      fileWriteMap.get(file).push(task.id);
    }
    for (const file of task.read_files || []) {
      if (!fileReadMap.has(file)) fileReadMap.set(file, []);
      fileReadMap.get(file).push(task.id);
    }
  }

  // 按批次分组检测同批次内的冲突
  const batches = new Map();
  for (const task of tasks) {
    const b = task.batch || 0;
    if (!batches.has(b)) batches.set(b, []);
    batches.get(b).push(task);
  }

  for (const [batchIdx, batchTasks] of batches) {
    for (let i = 0; i < batchTasks.length; i++) {
      for (let j = i + 1; j < batchTasks.length; j++) {
        const a = batchTasks[i];
        const b = batchTasks[j];

        // 冲突类型 1: 写写冲突（两个任务写同一个文件）
        const writeFilesA = new Set(a.target_files || []);
        const writeFilesB = new Set(b.target_files || []);
        for (const f of writeFilesA) {
          if (writeFilesB.has(f)) {
            conflicts.push({
              task_a: a.id,
              task_b: b.id,
              conflict_type: 'write-write',
              file: f,
              resolution: `将 ${b.id} 串行化到 ${a.id} 的下一批次`,
              auto_fix: `add_dependency: ${b.id} → ${a.id}`,
            });
          }
        }

        // 冲突类型 2: 写读冲突（A 写 B 读）
        for (const f of writeFilesA) {
          if ((b.read_files || []).includes(f)) {
            // A 写的文件 B 需要读 → A 必须在 B 之前完成
            if (!b.dependencies.includes(a.id)) {
              conflicts.push({
                task_a: a.id,
                task_b: b.id,
                conflict_type: 'write-read',
                file: f,
                resolution: `${b.id} 需要读取 ${a.id} 产出的 ${f}，添加依赖关系`,
                auto_fix: `add_dependency: ${b.id} → ${a.id}`,
              });
            }
          }
        }

        // 冲突类型 3: 读写冲突（B 写 A 读）
        for (const f of writeFilesB) {
          if ((a.read_files || []).includes(f)) {
            if (!a.dependencies.includes(b.id)) {
              conflicts.push({
                task_a: a.id,
                task_b: b.id,
                conflict_type: 'read-write',
                file: f,
                resolution: `${a.id} 需要读取 ${b.id} 产出的 ${f}，添加依赖关系`,
                auto_fix: `add_dependency: ${a.id} → ${b.id}`,
              });
            }
          }
        }

        // 兜底：parallel_group 冲突检测（兼容无文件信息的任务）
        if (a.parallel_group && a.parallel_group === b.parallel_group && a.id !== b.id) {
          const hasFileConflict = conflicts.some(
            c => (c.task_a === a.id && c.task_b === b.id) || (c.task_a === b.id && c.task_b === a.id)
          );
          if (!hasFileConflict) {
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
  }

  return conflicts;
}

/**
 * 🔴 v2.1 新增：根据冲突检测结果自动修复 DAG 依赖
 * 返回修复后的任务列表和是否发生了修复
 */
function fixDagFromConflicts(tasks, conflicts) {
  let fixed = false;

  for (const conflict of conflicts) {
    const fix = conflict.auto_fix;
    if (!fix || !fix.startsWith('add_dependency:')) continue;

    // 解析: add_dependency: {taskB} → {taskA}
    const match = fix.match(/^add_dependency:\s*(\S+)\s*→\s*(\S+)\s*$/);
    if (!match) continue;

    const taskId = match[1];
    const depId = match[2];

    const task = tasks.find(t => t.id === taskId);
    if (task && !task.dependencies.includes(depId)) {
      task.dependencies.push(depId);
      fixed = true;
      console.log(`  🔧 自动修复: 添加依赖 ${taskId} → ${depId}（原因: ${conflict.conflict_type} 冲突于 ${conflict.file}）`);
    }
  }

  return { tasks, fixed };
}

// ============================================================
// 平台调度策略
// ============================================================

function generateDispatchPlan(platform, batches, taskMap, demandName, maxConcurrent) {
  const plan = {
    platform,
    total_tasks: taskMap.size,
    total_batches: batches.length,
    max_concurrent: maxConcurrent,
    chunks_enabled: batches.some(b => b.length > maxConcurrent),
    batches: [],
  };

  for (let i = 0; i < batches.length; i++) {
    const batchIds = batches[i];
    const batch = batchIds.map(id => taskMap.get(id)).filter(Boolean);
    const chunks = splitLargeBatch(batchIds, maxConcurrent);

    const batchPlan = {
      batch_index: i,
      tasks: batch.map(t => ({ id: t.id, agent: t.agent, type: t.type, name: t.name || '' })),
      chunks: chunks.map(c => ({
        chunk_index: c.chunkIndex,
        task_ids: c.taskIds,
        tasks: c.taskIds.map(id => taskMap.get(id)).filter(Boolean).map(t => ({ id: t.id, agent: t.agent, type: t.type, name: t.name || '' })),
      })),
      dispatch_commands: [],
    };

    // 使用第一个 chunk 生成初始调度命令（Orchestrator 按滑动窗口逐 chunk 派发）
    const firstChunk = chunks[0].taskIds.map(id => taskMap.get(id)).filter(Boolean);

    switch (platform) {
      case 'trae':
        batchPlan.dispatch_commands = firstChunk.map(t =>
          `/develop-expert [task: ${t.id}, demand: ${demandName}]`
        );
        if (chunks.length > 1) {
          batchPlan.dispatch_commands.push(`[滑动窗口: 共 ${chunks.length} 个子批次, max_concurrent=${maxConcurrent}]`);
        }
        break;

      case 'cursor':
        batchPlan.dispatch_commands = [`[子批次 1/${chunks.length}: 派发 ${firstChunk.length} 个 Task]`];
        batchPlan.task_calls = firstChunk.map((t, idx) => ({
          call: `Task: /develop-expert`,
          task_id: t.id,
          agent: t.agent || 'develop-expert',
          is_background: idx > 0,
          model: 'inherit',
        }));
        break;

      case 'claude':
        batchPlan.dispatch_commands = [`dispatchBatch([${firstChunk.map(t => `"${t.id}"`).join(', ')}], concurrency=${maxConcurrent})`];
        batchPlan.workflow_snippet = generateClaudeWorkflow(firstChunk, i, maxConcurrent);
        break;

      case 'qoder':
        batchPlan.dispatch_commands = firstChunk.map(t =>
          `Quest: /develop-expert [task: ${t.id}, direction: ${classifyDirection(t)}]`
        );
        break;

      case 'codex':
        batchPlan.dispatch_commands = [`run agent: develop-expert (batch ${i + 1}, ${firstChunk.length} tasks, max ${maxConcurrent} threads)`];
        batchPlan.csv_tasks = firstChunk.map(t => ({
          task_id: t.id,
          agent: t.agent || 'develop-expert',
        }));
        break;
    }

    plan.batches.push(batchPlan);
  }

  return plan;
}

function generateClaudeWorkflow(batch, batchIndex, maxConcurrent = 4) {
  const taskIds = batch.map(t => t.id);
  return `
// Claude Code Dynamic Workflow - Batch ${batchIndex + 1}
async function batch${batchIndex + 1}() {
  const tasks = [${taskIds.map(id => `'${id}'`).join(', ')}];
  const concurrency = Math.min(${batch.length}, ${maxConcurrent || 4});

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
  const name = task.name || '';

  if (type.includes('frontend') || id.includes('ui') || id.includes('page') || id.includes('component') || name.includes('component') || name.includes('page')) return 'frontend';
  if (type.includes('test') || id.includes('test') || name.includes('test')) return 'test';
  if (type.includes('deploy') || id.includes('deploy') || id.includes('config') || name.includes('config')) return 'deploy';
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
      // 🔴 v2.1: 解析 YAML 关键字段
      const statusMatch = content.match(/status:\s*(success|partial|failed)/);
      const status = statusMatch ? statusMatch[1] : 'unknown';
      results.push({ task_id: taskId, file: resultFile, status, content_length: content.length });
      // 🔴 v3.0: 检查是否存在验证报告
      const validationFile = path.join(RUNTIME_DIR, `validation-report-${taskId}.yaml`);
      const hasValidation = fs.existsSync(validationFile);
      results[results.length - 1].validation = hasValidation ? validationFile : null;
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
  node scripts/dispatch.cjs [--platform <platform>] [--dry-run] [--max-concurrent <N>] [--help]

选项：
  --platform <platform>  指定平台 (cursor/claude/qoder/codex/trae)
  --dry-run             仅输出调度计划，不实际执行
  --max-concurrent <N>  覆盖平台默认并发上限 (正整数)
  --help                显示帮助

示例：
  node scripts/dispatch.cjs                          # 自动检测平台并生成调度计划
  node scripts/dispatch.cjs --platform cursor --dry-run  # Cursor 平台，仅预览
`);
    process.exit(0);
  }

  const projectRoot = process.cwd();
  const isDryRun = args.includes('--dry-run');
  const maxConcurrentArg = args.findIndex(a => a === '--max-concurrent');
  let customMaxConcurrent = null;
  if (maxConcurrentArg !== -1 && args[maxConcurrentArg + 1]) {
    customMaxConcurrent = parseInt(args[maxConcurrentArg + 1], 10);
    if (isNaN(customMaxConcurrent) || customMaxConcurrent < 1) {
      console.error('[ERROR] --max-concurrent 必须是正整数');
      process.exit(1);
    }
  }
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
  let tasks = parseTaskDag(dagContent);

  // 🔴 v3.0: 为每个任务准备上下文注入文件
  const prepareContextScript = path.join(__dirname, 'prepare-context.cjs');
  if (fs.existsSync(prepareContextScript)) {
    console.log('');
    console.log('[INFO] 正在为每个任务生成上下文注入文件（prepare-context.cjs）...');
    for (const task of tasks) {
      try {
        const { execSync } = require('child_process');
        const demandName = dagFileName.replace('-task-dag.yaml', '').replace('task-dag.yaml', 'current');
        execSync(`node "${prepareContextScript}" --task ${task.id} --demand ${demandName}`, {
          cwd: projectRoot,
          stdio: 'pipe',
          timeout: 30000
        });
        console.log(`  ✅ ${task.id} 上下文注入文件已生成`);
      } catch (e) {
        console.warn(`  ⚠️ ${task.id} 上下文注入生成失败: ${e.message}`);
      }
    }
  }

  if (tasks.length === 0) {
    console.error('[ERROR] task-dag.yaml 中未解析到任何任务');
    process.exit(1);
  }

  console.log(`[INFO] 成功解析 ${tasks.length} 个任务`);

  // 拓扑排序
  const { batches, taskMap } = topologicalSort(tasks);

  // 计算有效并发上限
  const effectiveMaxConcurrent = customMaxConcurrent || MAX_CONCURRENT[platform] || 3;

  // 冲突检测
  let conflicts = detectConflicts(tasks);

  // 🔴 v2.1: 如果有可自动修复的冲突，修复 DAG 并重新排序
  if (conflicts.length > 0) {
    const autoFixable = conflicts.filter(c => c.auto_fix);
    if (autoFixable.length > 0) {
      console.log('');
      console.log(`【冲突自动修复】发现 ${autoFixable.length} 个可自动修复的冲突：`);
      const { tasks: fixedTasks, fixed } = fixDagFromConflicts(tasks, conflicts);
      if (fixed) {
        console.log('');
        console.log('[INFO] DAG 已自动修复，重新执行拓扑排序...');
        const newResult = topologicalSort(fixedTasks);
        tasks = fixedTasks;
        // 重新检测冲突（应该只剩 parallel_group 级别的警告）
        conflicts = detectConflicts(tasks);
        // 使用新的 batches
        return generateAndOutputPlan(platform, newResult.batches, newResult.taskMap, dagFile, conflicts, isDryRun, effectiveMaxConcurrent, !!customMaxConcurrent);
      }
    }
  }

  generateAndOutputPlan(platform, batches, taskMap, dagFile, conflicts, isDryRun, effectiveMaxConcurrent, !!customMaxConcurrent);
}

function generateAndOutputPlan(platform, batches, taskMap, dagFile, conflicts, isDryRun, maxConcurrent, isCustomMaxConcurrent = false) {
  // 提取需求名称（从 DAG 文件名推断）
  const dagFileName = path.basename(dagFile);
  const demandName = dagFileName.replace('-task-dag.yaml', '').replace('task-dag.yaml', 'current');

  // 生成调度计划
  const plan = generateDispatchPlan(platform, batches, taskMap, demandName, maxConcurrent);

  // 统计冲突严重程度
  const criticalConflicts = conflicts.filter(c => c.conflict_type !== 'potential_write-write');
  const warnings = conflicts.filter(c => c.conflict_type === 'potential_write-write');

  // 输出
  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log(`  dev-flow 平台调度引擎`);
  console.log('═══════════════════════════════════════════════════');
  console.log('');
  console.log(`【平台检测】当前平台: ${platform.charAt(0).toUpperCase() + platform.slice(1)}`);
  console.log(`【任务统计】总任务数: ${plan.total_tasks}，批次数: ${plan.total_batches}`);

  if (criticalConflicts.length > 0) {
    console.log(``);
    console.log(`🔴【严重冲突】发现 ${criticalConflicts.length} 个文件级冲突：`);
    for (const c of criticalConflicts) {
      console.log(`  🔴 ${c.task_a} ↔ ${c.task_b}: [${c.conflict_type}] ${c.file}`);
      console.log(`     修复建议: ${c.resolution}`);
    }
    console.log('');
    console.log('⚠️ 存在文件级冲突，建议先修复 task-dag.yaml 中的依赖关系再执行调度。');
  }

  if (warnings.length > 0) {
    console.log(``);
    console.log(`⚠️ 【潜在冲突】发现 ${warnings.length} 个 parallel_group 冲突（需人工确认）：`);
    for (const c of warnings) {
      console.log(`  ⚠️ ${c.task_a} ↔ ${c.task_b}: ${c.resolution}`);
    }
  }

  console.log('');
  console.log('--- 调度计划 ---');
  console.log(`【并发控制】max_concurrent: ${maxConcurrent}${isCustomMaxConcurrent ? ' (用户自定义)' : ' (平台默认)'}`);
  if (plan.chunks_enabled) {
    console.log(`【子批次分割】已启用：${plan.batches.filter(b => b.chunks && b.chunks.length > 1).length} 个批次被拆分为子批次`);
  }
  for (const batch of plan.batches) {
    console.log(`\n📌 批次 ${batch.batch_index + 1}（${batch.tasks.length} 个任务）：`);
    if (batch.chunks && batch.chunks.length > 1) {
      for (const chunk of batch.chunks) {
        console.log(`   ├─ 子批次 ${chunk.chunkIndex + 1}: [${chunk.task_ids.join(', ')}]`);
      }
      console.log(`   └─ 滑动窗口调度: 前一子批次完成 ${maxConcurrent} 个任务后启动下一子批次`);
    }
    for (const task of batch.tasks) {
      const nameInfo = task.name ? ` (${task.name})` : '';
      console.log(`   ├─ ${task.id}${nameInfo} → ${task.agent || 'develop-expert'}`);
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
    `conflicts_detected: ${conflicts.length}`,
    `conflicts_auto_fixed: ${conflicts.filter(c => c.auto_fix).length}`,
    `max_concurrent: ${maxConcurrent}`,
    `chunks_enabled: ${plan.chunks_enabled}`,
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
  console.log('  3. 每个任务完成后，运行 validate-result.cjs 自动校验产出质量：');
  console.log('     node scripts/validate-result.cjs --task <taskId> --demand <需求名>');
  console.log('  4. 全部完成后，运行批量校验：');
  console.log('     node scripts/validate-result.cjs --all --demand <需求名> --compile');
  console.log('  5. 如有任务失败，参考冲突检测结果调整后重新执行');
}

function findDagFile(docsDir) {
  if (!fs.existsSync(docsDir)) return 'task-dag.yaml';

  const files = fs.readdirSync(docsDir).filter(f => f.includes('task-dag') && f.endsWith('.yaml') || f.includes('task-dag') && f.endsWith('.yml'));
  if (files.length > 0) return files[0];
  return 'task-dag.yaml';
}

main();
