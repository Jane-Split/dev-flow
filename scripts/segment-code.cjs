/**
 * dev-flow 结构化代码分段生成脚本 (v3.0)
 *
 * 解决核心问题：AI 模型单次生成超过 20KB 代码时质量急剧下降（从 90% 降至 30%）。
 * 采用"骨架 + 逐方法填充"策略，将大代码文件拆分为多次安全的小输出。
 *
 * 四阶段协议：
 *   Phase 0: 代码架构规划 — 分析目标代码结构，生成 code-generation-plan.yaml
 *   Phase 1: 骨架生成 — 生成 imports + class + fields + 方法签名（空体 TODO）
 *   Phase 2: 逐方法填充 — 每次只实现一个方法体，Edit 替换 TODO 占位符
 *   Phase 3: 全量验证 — 读取完整文件，编译 + 契约校验 + 完整性验证
 *
 * 用法：
 *   node scripts/segment-code.cjs --plan --task Task-5 --demand user-management
 *   node scripts/segment-code.cjs --skeleton --task Task-5 --demand user-management
 *   node scripts/segment-code.cjs --fill --task Task-5 --method createUser --demand user-management
 *   node scripts/segment-code.cjs --fill-all --task Task-5 --demand user-management
 *   node scripts/segment-code.cjs --verify --task Task-5 --demand user-management --compile
 *   node scripts/segment-code.cjs --help
 *
 * 依赖：零外部依赖
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DOCS_DIR = path.join(ROOT, '.dev-flow', 'docs');
const RUNTIME_DIR = path.join(ROOT, '.dev-flow', 'runtime');

// ============================================================
// 配置
// ============================================================

// 单次代码生成的安全输出上限（KB）
const SAFE_OUTPUT_LIMIT_KB = 15;
// 骨架生成安全上限（KB）
const SKELETON_LIMIT_KB = 12;
// 触发分段生成的阈值（KB）— 预估输出超过此值时自动启用分段模式
const SEGMENT_THRESHOLD_KB = 20;

// ============================================================
// 参数解析
// ============================================================

function parseArgs(args) {
  const opts = {
    plan: false,
    skeleton: false,
    fill: false,
    fillAll: false,
    verify: false,
    compile: false,
    complete: false,
    lockStatus: false,
    task: null,
    method: null,
    demand: null,
    segment: null,
    help: false
  };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--plan') { opts.plan = true; }
    else if (args[i] === '--skeleton') { opts.skeleton = true; }
    else if (args[i] === '--fill' && args[i + 1]) { opts.fill = true; opts.method = args[++i]; }
    else if (args[i] === '--fill-all') { opts.fillAll = true; }
    else if (args[i] === '--verify') { opts.verify = true; }
    else if (args[i] === '--compile') { opts.compile = true; }
    else if (args[i] === '--complete') { opts.complete = true; }
    else if (args[i] === '--lock-status') { opts.lockStatus = true; }
    else if (args[i] === '--task' && args[i + 1]) { opts.task = args[++i]; }
    else if (args[i] === '--demand' && args[i + 1]) { opts.demand = args[++i]; }
    else if (args[i] === '--segment' && args[i + 1]) { opts.segment = args[++i]; }
    else if (args[i] === '--help') { opts.help = true; }
  }
  return opts;
}

// ============================================================
// YAML 简易解析器
// ============================================================

function parseYaml(content) {
  const lines = content.split('\n');
  const result = {};
  let currentKey = null;
  let currentList = null;
  let inBlock = false;

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    // List item
    const listMatch = trimmed.match(/^-\s+(.+)/);
    if (listMatch) {
      if (currentKey) {
        if (!Array.isArray(result[currentKey])) result[currentKey] = [];
        result[currentKey].push(parseYamlValue(listMatch[1]));
      }
      continue;
    }

    // Key-value
    const kvMatch = trimmed.match(/^([a-zA-Z_][a-zA-Z0-9_]*):\s*(.*)/);
    if (kvMatch) {
      currentKey = kvMatch[1];
      const val = kvMatch[2].trim();
      if (val === '' || val === '|' || val === '>') {
        inBlock = true;
        result[currentKey] = val;
      } else {
        inBlock = false;
        result[currentKey] = parseYamlValue(val);
      }
      continue;
    }
  }
  return result;
}

function parseYamlValue(val) {
  if (val === 'true' || val === 'yes') return true;
  if (val === 'false' || val === 'no') return false;
  if (val === 'null' || val === '~') return null;
  if (/^-?\d+$/.test(val)) return parseInt(val, 10);
  if (/^-?\d+\.\d+$/.test(val)) return parseFloat(val);
  // Strip quotes
  if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
    return val.slice(1, -1);
  }
  return val;
}

// ============================================================
// 工具函数
// ============================================================

function safeRead(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      return content;
    }
  } catch (e) { /* ignore */ }
  return null;
}

function safeWrite(filePath, content) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, content, 'utf-8');
}

function ensureRuntimeDir() {
  if (!fs.existsSync(RUNTIME_DIR)) fs.mkdirSync(RUNTIME_DIR, { recursive: true });
}

function findDemandFile(pattern) {
  // Search in DOCS_DIR
  if (!fs.existsSync(DOCS_DIR)) return null;
  const files = fs.readdirSync(DOCS_DIR);
  // Exact match
  for (const f of files) {
    if (f === pattern + '-task-dag.yaml' || f === pattern + '-design-contract.yaml') {
      return path.join(DOCS_DIR, f);
    }
  }
  // Partial match
  for (const f of files) {
    if (f.includes(pattern)) return path.join(DOCS_DIR, f);
  }
  // Fallback: first task-dag
  for (const f of files) {
    if (f.endsWith('-task-dag.yaml')) return path.join(DOCS_DIR, f);
  }
  return null;
}

function findSubtaskDesign(taskId, demandName) {
  if (!fs.existsSync(DOCS_DIR)) return null;
  // Look for subtask-{id}-design.yaml
  const normalizedTaskId = taskId.toLowerCase().replace(/\s+/g, '-');
  const files = fs.readdirSync(DOCS_DIR).filter(f => f.endsWith('-design.yaml'));
  // Try direct match
  for (const f of files) {
    if (f.toLowerCase().includes(normalizedTaskId) || f.includes(taskId)) {
      return path.join(DOCS_DIR, f);
    }
  }
  // Try in task-split subdirectory
  const splitDirs = fs.readdirSync(DOCS_DIR).filter(f =>
    fs.statSync(path.join(DOCS_DIR, f)).isDirectory() && f.includes('task-split')
  );
  for (const dir of splitDirs) {
    const subDir = path.join(DOCS_DIR, dir);
    const subFiles = fs.readdirSync(subDir);
    for (const f of subFiles) {
      if (f.toLowerCase().includes(normalizedTaskId) || f.includes(taskId)) {
        return path.join(subDir, f);
      }
    }
  }
  return null;
}

// ============================================================
// Phase 0: 代码架构规划
// ============================================================

function generatePlan(taskId, demandName) {
  console.log('');
  console.log('=== Phase 0: Code Architecture Planning ===');
  console.log('');

  // 1. Read subtask design
  const designFile = findSubtaskDesign(taskId, demandName);
  if (!designFile) {
    console.error('[ERROR] Cannot find subtask design file for', taskId);
    console.error('  Searched in:', DOCS_DIR);
    process.exit(1);
  }
  const designContent = safeRead(designFile);
  console.log('[INFO] Read subtask design:', designFile);

  // 2. Read design contract
  const contractFile = findDemandFile(demandName ? demandName + '-design-contract' : 'design-contract');
  let contractContent = null;
  if (contractFile) {
    contractContent = safeRead(contractFile);
    console.log('[INFO] Read design contract:', contractFile);
  }

  // 3. Analyze target files and methods
  const analysis = analyzeCodeStructure(designContent, contractContent, taskId);

  // 4. Determine segmentation strategy
  const strategy = determineStrategy(analysis);

  // 5. Generate code-generation-plan.yaml
  const plan = {
    task_id: taskId,
    demand_name: demandName,
    generated_at: new Date().toISOString(),
    estimated_total_size_kb: analysis.estimatedTotalKB,
    segmentation: strategy,
    segments: strategy.segments
  };

  const planYaml = generatePlanYaml(plan);
  const planPath = path.join(RUNTIME_DIR, `code-gen-plan-${taskId}.yaml`);
  safeWrite(planPath, planYaml);
  console.log('');
  console.log('[OK] Plan written to:', planPath);
  console.log('[INFO] Segmentation strategy:', strategy.mode);
  console.log('[INFO] Total segments:', strategy.segments.length);
  console.log('[INFO] Estimated total:', analysis.estimatedTotalKB + 'KB');

  // Generate segment lock file
  const lockPath = path.join(RUNTIME_DIR, `segment-lock-${taskId}.yaml`);
  const lockYaml = generateLockYaml(taskId, strategy);
  safeWrite(lockPath, lockYaml);
  console.log('[OK] Segment lock written to:', lockPath);

  return plan;
}

function analyzeCodeStructure(designContent, contractContent, taskId) {
  const analysis = {
    targetFiles: [],
    totalMethods: 0,
    estimatedTotalKB: 0,
    needsSegmentation: false
  };

  // Parse methods from design content
  const methods = extractMethodsFromDesign(designContent);
  analysis.totalMethods = methods.length;

  // Estimate sizes
  // Average method: ~4KB (Java), ~2KB (simple), ~8KB (complex)
  let totalEstimate = 0;
  const fileMap = new Map();

  for (const method of methods) {
    const est = estimateMethodSize(method);
    totalEstimate += est;
    if (!fileMap.has(method.file)) {
      fileMap.set(method.file, { methods: [], estimatedKB: 0 });
    }
    fileMap.get(method.file).methods.push(method);
    fileMap.get(method.file).estimatedKB += est;
  }

  // Add overhead for imports, class declaration, fields
  const overheadKB = 5; // imports + class + fields + annotations
  for (const [file, data] of fileMap) {
    data.estimatedKB += overheadKB;
    analysis.targetFiles.push({
      path: file,
      methodCount: data.methods.length,
      estimatedKB: Math.round(data.estimatedKB)
    });
  }

  analysis.estimatedTotalKB = Math.round(totalEstimate + overheadKB);
  analysis.needsSegmentation = analysis.estimatedTotalKB > SEGMENT_THRESHOLD_KB;

  return analysis;
}

function extractMethodsFromDesign(designContent) {
  const methods = [];
  const lines = designContent.split('\n');

  // Look for method definitions in YAML-like format
  let currentFile = 'Unknown.java';
  let currentClass = 'Unknown';

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();

    // Detect file/class context
    const fileMatch = trimmed.match(/(?:file|class|target_file):\s*["']?([^"'\n]+)/i);
    if (fileMatch) {
      if (fileMatch[1].endsWith('.java') || fileMatch[1].endsWith('.ts') ||
          fileMatch[1].endsWith('.py') || fileMatch[1].endsWith('.go')) {
        currentFile = fileMatch[1];
      }
      currentClass = fileMatch[1].replace(/\.\w+$/, '').replace(/.*\//, '');
    }

    // Detect method name
    const methodMatch = trimmed.match(/^-\s*name:\s*["']?(\w+)\(?/i);
    if (methodMatch) {
      methods.push({
        name: methodMatch[1],
        file: currentFile,
        class: currentClass,
        complexity: 'medium',
        line: i
      });
    }

    // Detect method in service methods section
    const svcMethodMatch = trimmed.match(/^\s+name:\s*["']?(\w+)\(?/i);
    if (svcMethodMatch && !trimmed.startsWith('-')) {
      // Check if parent section is methods
      let hasMethodsParent = false;
      for (let j = i - 1; j >= Math.max(0, i - 10); j--) {
        if (lines[j].trim().match(/^methods?:/i)) { hasMethodsParent = true; break; }
        if (lines[j].trim().match(/^\S/)) break;
      }
      if (hasMethodsParent && !methods.find(m => m.name === svcMethodMatch[1])) {
        methods.push({
          name: svcMethodMatch[1],
          file: currentFile,
          class: currentClass,
          complexity: 'medium',
          line: i
        });
      }
    }

    // Detect logic steps (complexity indicator)
    const stepMatch = trimmed.match(/step:\s*\d+/i);
    if (stepMatch && methods.length > 0) {
      methods[methods.length - 1].complexity = 'high';
    }
  }

  return methods;
}

function estimateMethodSize(method) {
  switch (method.complexity) {
    case 'high': return 8;
    case 'medium': return 4;
    case 'low': return 2;
    default: return 4;
  }
}

function determineStrategy(analysis) {
  if (!analysis.needsSegmentation) {
    return {
      mode: 'single_pass',
      reason: `Estimated ${analysis.estimatedTotalKB}KB <= ${SEGMENT_THRESHOLD_KB}KB threshold`,
      segments: [{
        id: 'seg-single',
        type: 'single_pass',
        target_file: analysis.targetFiles[0]?.path || 'Unknown',
        estimated_output_kb: analysis.estimatedTotalKB,
        description: 'Single-pass generation (no segmentation needed)'
      }]
    };
  }

  // Segmentation strategy: skeleton + method-by-method
  const segments = [];
  let segmentId = 0;

  for (const file of analysis.targetFiles) {
    // Skeleton segment
    segments.push({
      id: `seg-${++segmentId}`,
      type: 'skeleton',
      target_file: file.path,
      estimated_output_kb: Math.min(file.estimatedKB, SKELETON_LIMIT_KB),
      description: `Generate skeleton: imports + class + fields + ${file.methodCount} method signatures (TODO bodies)`,
      methods_included: []
    });

    // Method fill segments
    for (let i = 0; i < file.methodCount; i++) {
      const methodSizeKB = file.estimatedKB / file.methodCount;
      segments.push({
        id: `seg-${++segmentId}`,
        type: 'method_fill',
        target_file: file.path,
        target_method: `method_${i + 1}`,
        estimated_output_kb: Math.round(methodSizeKB),
        depends_on: [`seg-${segmentId - i}`],
        description: `Implement method ${i + 1}/${file.methodCount} in ${path.basename(file.path)}`
      });
    }
  }

  return {
    mode: 'skeleton_plus_fill',
    reason: `Estimated ${analysis.estimatedTotalKB}KB > ${SEGMENT_THRESHOLD_KB}KB threshold, needs segmentation`,
    segments
  };
}

function generatePlanYaml(plan) {
  let yaml = `# Code Generation Plan\n`;
  yaml += `# Auto-generated by segment-code.cjs (v3.0)\n`;
  yaml += `# Task: ${plan.task_id}\n`;
  yaml += `# Generated: ${plan.generated_at}\n\n`;
  yaml += `task_id: "${plan.task_id}"\n`;
  yaml += `demand_name: "${plan.demand_name}"\n`;
  yaml += `generated_at: "${plan.generated_at}"\n`;
  yaml += `estimated_total_size_kb: ${plan.estimated_total_size_kb}\n`;
  yaml += `segmentation_mode: "${plan.segmentation.mode}"\n`;
  yaml += `reason: "${plan.segmentation.reason}"\n\n`;
  yaml += `segments:\n`;

  for (const seg of plan.segments) {
    yaml += `  - id: "${seg.id}"\n`;
    yaml += `    type: "${seg.type}"\n`;
    yaml += `    target_file: "${seg.target_file}"\n`;
    yaml += `    estimated_output_kb: ${seg.estimated_output_kb}\n`;
    yaml += `    description: "${seg.description}"\n`;
    if (seg.target_method) yaml += `    target_method: "${seg.target_method}"\n`;
    if (seg.depends_on && seg.depends_on.length > 0) {
      yaml += `    depends_on: [${seg.depends_on.map(d => `"${d}"`).join(', ')}]\n`;
    }
    yaml += `\n`;
  }

  // Add instructions for subagent
  yaml += `# === Instructions for develop-expert subagent ===\n`;
  yaml += `#\n`;
  yaml += `# SEGMENTED_EXECUTION_MODE: skeleton_plus_fill\n`;
  yaml += `#\n`;
  yaml += `# If segmentation_mode is "single_pass":\n`;
  yaml += `#   Generate all code in a single pass (standard mode).\n`;
  yaml += `#\n`;
  yaml += `# If segmentation_mode is "skeleton_plus_fill":\n`;
  yaml += `#   1. SKELETON PHASE (seg skeleton):\n`;
  yaml += `#      - Generate imports, class declaration, fields, and method signatures\n`;
  yaml += `#      - All method bodies contain ONLY: // TODO: implement {method_name}\n`;
  yaml += `#      - Write to target_file\n`;
  yaml += `#\n`;
  yaml += `#   2. FILL PHASE (seg method_fill, one at a time):\n`;
  yaml += `#      - Read current file (now contains skeleton + previously filled methods)\n`;
  yaml += `#      - Read method spec from task-brief or subtask design\n`;
  yaml += `#      - Replace // TODO: implement {method} with complete method body\n`;
  yaml += `#      - Use Edit tool to replace ONLY the TODO line + method body\n`;
  yaml += `#      - Each method output should be 5-10KB (safe zone)\n`;
  yaml += `#      - Do NOT regenerate imports or other methods\n`;
  yaml += `#\n`;
  yaml += `#   3. VERIFY PHASE (after all methods filled):\n`;
  yaml += `#      - Read complete file\n`;
  yaml += `#      - Verify: no TODO/FIXME, no empty methods, no log-only bodies\n`;
  yaml += `#      - Verify: compile passes\n`;
  yaml += `#      - Verify: logic step coverage = 100%\n`;
  yaml += `#\n`;
  yaml += `# CONTEXT BUDGET PER FILL CALL:\n`;
  yaml += `#   system_prompt (~15KB) + method_spec (~20KB) + current_file (~10-45KB) = 45-80KB\n`;
  yaml += `#   Always well within 200KB model context window.\n`;

  return yaml;
}

// ============================================================
// Segment Lock 文件生成
// ============================================================

function generateLockYaml(taskId, strategy) {
  let yaml = `# Segment Lock File\n`;
  yaml += `# Auto-generated by segment-code.cjs\n`;
  yaml += `# Task: ${taskId}\n\n`;
  yaml += `task_id: "${taskId}"\n`;
  yaml += `lock_created_at: "${new Date().toISOString()}"\n`;
  yaml += `segmentation_mode: "${strategy.mode}"\n`;
  yaml += `total_segments: ${strategy.segments.length}\n\n`;
  yaml += `segments:\n`;

  for (const seg of strategy.segments) {
    yaml += `  - id: "${seg.id}"\n`;
    yaml += `    type: "${seg.type}"\n`;
    yaml += `    status: "pending"\n`;
    yaml += `    completed_at: null\n`;
    yaml += `    output_file: "${seg.target_file || ''}"\n`;
    if (seg.target_method) yaml += `    target_method: "${seg.target_method}"\n`;
    if (seg.depends_on && seg.depends_on.length > 0) {
      yaml += `    depends_on: [${seg.depends_on.map(d => `"${d}"`).join(', ')}]\n`;
    }
  }

  yaml += `\nenforcement:\n`;
  yaml += `  all_must_complete: true\n`;
  yaml += `  skip_any_segment: "FAIL"\n`;
  yaml += `  verification_required: true\n`;

  return yaml;
}

// ============================================================
// --complete: 标记段完成
// ============================================================

function completeSegment(taskId, segmentId) {
  const lockPath = path.join(RUNTIME_DIR, `segment-lock-${taskId}.yaml`);
  const content = safeRead(lockPath);
  if (!content) {
    console.error(`[ERROR] Segment lock file not found: ${lockPath}`);
    console.error('  Run --plan first to generate the lock file.');
    process.exit(1);
  }

  // Parse lock file segments
  const lockData = parseLockFile(content);

  // Find the target segment
  const segment = lockData.segments.find(s => s.id === segmentId);
  if (!segment) {
    console.error(`[ERROR] Segment "${segmentId}" not found in lock file.`);
    console.error('  Available segments:', lockData.segments.map(s => s.id).join(', '));
    process.exit(1);
  }

  if (segment.status === 'completed') {
    console.log(`[WARN] Segment "${segmentId}" is already completed at ${segment.completed_at}`);
    return;
  }

  // Update segment status
  segment.status = 'completed';
  segment.completed_at = new Date().toISOString();

  // Write back
  const updatedYaml = regenerateLockYaml(lockData);
  safeWrite(lockPath, updatedYaml);

  const completedCount = lockData.segments.filter(s => s.status === 'completed').length;
  console.log(`[OK] Segment "${segmentId}" marked as completed.`);
  console.log(`[INFO] Progress: ${completedCount}/${lockData.segments.length} segments completed`);
}

function parseLockFile(content) {
  const lines = content.split('\n');
  const data = {
    task_id: '',
    lock_created_at: '',
    segmentation_mode: '',
    total_segments: 0,
    segments: [],
    enforcement: {}
  };

  let inSegments = false;
  let currentSegment = null;
  let inEnforcement = false;

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    // Top-level key-value
    const kvMatch = trimmed.match(/^([a-zA-Z_][a-zA-Z0-9_]*):\s*(.*)/);
    if (!kvMatch) continue;

    const key = kvMatch[1];
    const val = kvMatch[2].trim();

    if (key === 'segments' && val === '') {
      inSegments = true;
      inEnforcement = false;
      continue;
    }
    if (key === 'enforcement' && val === '') {
      inEnforcement = true;
      inSegments = false;
      continue;
    }

    if (inEnforcement) {
      if (key === 'all_must_complete') data.enforcement.all_must_complete = parseYamlValue(val);
      else if (key === 'skip_any_segment') data.enforcement.skip_any_segment = parseYamlValue(val);
      else if (key === 'verification_required') data.enforcement.verification_required = parseYamlValue(val);
      continue;
    }

    if (inSegments) {
      if (trimmed.startsWith('- id:')) {
        if (currentSegment) data.segments.push(currentSegment);
        currentSegment = {
          id: parseYamlValue(trimmed.replace(/^-\s*id:\s*/, '')),
          type: '',
          status: 'pending',
          completed_at: null,
          output_file: '',
          target_method: '',
          depends_on: []
        };
      } else if (currentSegment) {
        if (key === 'type') currentSegment.type = parseYamlValue(val);
        else if (key === 'status') currentSegment.status = parseYamlValue(val);
        else if (key === 'completed_at') currentSegment.completed_at = val === 'null' ? null : parseYamlValue(val);
        else if (key === 'output_file') currentSegment.output_file = parseYamlValue(val);
        else if (key === 'target_method') currentSegment.target_method = parseYamlValue(val);
        else if (key === 'depends_on') {
          const arrMatch = val.match(/^\[(.+)\]$/);
          if (arrMatch) {
            currentSegment.depends_on = arrMatch[1].split(',').map(s => s.trim().replace(/"/g, ''));
          }
        }
      }
      continue;
    }

    // Top-level fields
    if (key === 'task_id') data.task_id = parseYamlValue(val);
    else if (key === 'lock_created_at') data.lock_created_at = parseYamlValue(val);
    else if (key === 'segmentation_mode') data.segmentation_mode = parseYamlValue(val);
    else if (key === 'total_segments') data.total_segments = parseInt(val, 10);
  }
  if (currentSegment) data.segments.push(currentSegment);

  return data;
}

function regenerateLockYaml(lockData) {
  let yaml = `# Segment Lock File\n`;
  yaml += `# Auto-generated by segment-code.cjs\n`;
  yaml += `# Task: ${lockData.task_id}\n\n`;
  yaml += `task_id: "${lockData.task_id}"\n`;
  yaml += `lock_created_at: "${lockData.lock_created_at}"\n`;
  yaml += `segmentation_mode: "${lockData.segmentation_mode}"\n`;
  yaml += `total_segments: ${lockData.total_segments}\n\n`;
  yaml += `segments:\n`;

  for (const seg of lockData.segments) {
    yaml += `  - id: "${seg.id}"\n`;
    yaml += `    type: "${seg.type}"\n`;
    yaml += `    status: "${seg.status}"\n`;
    yaml += `    completed_at: ${seg.completed_at ? `"${seg.completed_at}"` : 'null'}\n`;
    yaml += `    output_file: "${seg.output_file}"\n`;
    if (seg.target_method) yaml += `    target_method: "${seg.target_method}"\n`;
    if (seg.depends_on && seg.depends_on.length > 0) {
      yaml += `    depends_on: [${seg.depends_on.map(d => `"${d}"`).join(', ')}]\n`;
    }
  }

  yaml += `\nenforcement:\n`;
  yaml += `  all_must_complete: ${lockData.enforcement.all_must_complete}\n`;
  yaml += `  skip_any_segment: "${lockData.enforcement.skip_any_segment}"\n`;
  yaml += `  verification_required: ${lockData.enforcement.verification_required}\n`;

  return yaml;
}

// ============================================================
// --lock-status: 查看段锁状态
// ============================================================

function lockStatus(taskId) {
  const lockPath = path.join(RUNTIME_DIR, `segment-lock-${taskId}.yaml`);
  const content = safeRead(lockPath);
  if (!content) {
    console.error(`[ERROR] Segment lock file not found: ${lockPath}`);
    console.error('  Run --plan first to generate the lock file.');
    process.exit(1);
  }

  const lockData = parseLockFile(content);

  console.log('');
  console.log(`=== Segment Lock Status: ${taskId} ===`);
  console.log('');
  console.log(`  Mode: ${lockData.segmentation_mode}`);
  console.log(`  Total: ${lockData.total_segments} segments`);
  console.log(`  Created: ${lockData.lock_created_at}`);
  console.log('');

  const completed = lockData.segments.filter(s => s.status === 'completed');
  const pending = lockData.segments.filter(s => s.status === 'pending');

  console.log(`  Completed (${completed.length}):`);
  if (completed.length === 0) {
    console.log('    (none)');
  } else {
    for (const seg of completed) {
      const extra = seg.target_method ? ` → ${seg.target_method}` : '';
      console.log(`    ✓ ${seg.id} [${seg.type}]${extra} @ ${seg.completed_at}`);
    }
  }

  console.log('');
  console.log(`  Pending (${pending.length}):`);
  if (pending.length === 0) {
    console.log('    (none)');
  } else {
    for (const seg of pending) {
      const extra = seg.target_method ? ` → ${seg.target_method}` : '';
      const deps = seg.depends_on && seg.depends_on.length > 0 ? ` (depends: ${seg.depends_on.join(', ')})` : '';
      console.log(`    ○ ${seg.id} [${seg.type}]${extra}${deps}`);
    }
  }

  console.log('');
  if (pending.length === 0) {
    console.log('  Result: ALL COMPLETED ✓');
  } else {
    console.log(`  Result: ${pending.length} segment(s) still pending`);
  }
  console.log('');
}

// ============================================================
// Phase 2: Method Spec Extraction (--fill helper)
// ============================================================

function extractMethodSpec(taskId, methodName, demandName) {
  // Find task-brief if exists
  const briefPath = path.join(RUNTIME_DIR, `task-brief-${taskId}.md`);
  let briefContent = safeRead(briefPath);

  // If no brief, try subtask design
  if (!briefContent) {
    const designFile = findSubtaskDesign(taskId, demandName);
    if (designFile) briefContent = safeRead(designFile);
  }

  if (!briefContent) {
    console.error('[ERROR] No task-brief or subtask design found for', taskId);
    process.exit(1);
  }

  // Extract relevant method section
  const spec = extractRelevantMethodSpec(briefContent, methodName);

  const specPath = path.join(RUNTIME_DIR, `method-spec-${taskId}-${methodName}.md`);
  safeWrite(specPath, spec);
  console.log('[OK] Method spec written to:', specPath);
  console.log('[INFO] Size:', Math.round(Buffer.byteLength(spec, 'utf-8') / 1024) + 'KB');
}

function extractRelevantMethodSpec(content, methodName) {
  const lines = content.split('\n');
  const relevantLines = [];

  let capturing = false;
  let indent = 0;
  let captureCount = 0;

  for (const line of lines) {
    const trimmed = line.trim();

    // Start capturing when we find the method
    if (trimmed.includes(methodName) || trimmed.match(/^#{2,4}\s.*method/i)) {
      capturing = true;
      indent = line.length - line.trimStart().length;
      captureCount++;
    }

    if (capturing) {
      relevantLines.push(line);

      // Stop capturing at next section of same or higher level
      const currentIndent = line.length - line.trimStart().length;
      if (currentIndent <= indent && trimmed.match(/^#{2,4}\s/) && captureCount > 1) {
        break;
      }
    }
  }

  if (relevantLines.length === 0) {
    // Fallback: return first 50 lines (general context)
    return '## Method Spec (fallback)\n\n' +
      'No specific method spec found. Use the following general context:\n\n' +
      content.split('\n').slice(0, 50).join('\n') + '\n';
  }

  return `## Method Spec: ${methodName}\n\n` +
    `> Extracted from task-brief/subtask-design\n\n` +
    relevantLines.join('\n') + '\n';
}

// ============================================================
// Main
// ============================================================

function main() {
  const args = process.argv.slice(2);
  const opts = parseArgs(args);

  if (opts.help) {
    console.log(`
Usage: node scripts/segment-code.cjs [options]

Options:
  --plan              Phase 0: Generate code-generation-plan.yaml
  --skeleton          Phase 1: Generate skeleton code
  --fill <method>     Phase 2: Extract method spec for filling
  --fill-all          Phase 2: Extract all method specs sequentially
  --verify            Phase 3: Verify complete code
  --complete          Mark a segment as completed in the lock file
  --lock-status       Show segment lock status (completed vs pending)
  --compile           Also run compilation during verify
  --task <taskId>     Target task ID (e.g., Task-5)
  --segment <segId>   Segment ID for --complete (e.g., seg-2)
  --demand <name>     Demand/project name for file lookup
  --help              Show this help

Examples:
  node scripts/segment-code.cjs --plan --task Task-5 --demand user-mgmt
  node scripts/segment-code.cjs --fill createUser --task Task-5 --demand user-mgmt
  node scripts/segment-code.cjs --fill-all --task Task-5 --demand user-mgmt
  node scripts/segment-code.cjs --verify --task Task-5 --demand user-mgmt --compile
  node scripts/segment-code.cjs --complete --segment seg-2 --task Task-5 --demand user-mgmt
  node scripts/segment-code.cjs --lock-status --task Task-5
`);
    return;
  }

  ensureRuntimeDir();

  if (opts.plan) {
    generatePlan(opts.task, opts.demand);
  } else if (opts.fill) {
    extractMethodSpec(opts.task, opts.method, opts.demand);
  } else if (opts.fillAll) {
    // Read plan, extract specs for all method_fill segments
    const planPath = path.join(RUNTIME_DIR, `code-gen-plan-${opts.task}.yaml`);
    const planContent = safeRead(planPath);
    if (!planContent) {
      console.error('[ERROR] No code-gen-plan found. Run --plan first.');
      process.exit(1);
    }
    const segments = extractSegmentsFromPlan(planContent);
    const methodSegments = segments.filter(s => s.type === 'method_fill');
    console.log(`[INFO] Found ${methodSegments.length} method segments to fill`);
    for (const seg of methodSegments) {
      console.log('');
      console.log(`--- Filling: ${seg.id} (${seg.description}) ---`);
      extractMethodSpec(opts.task, seg.target_method, opts.demand);
    }
  } else if (opts.verify) {
    console.log('');
    console.log('=== Phase 3: Verification ===');
    console.log('[INFO] Read complete file and verify:');
    console.log('  1. No TODO/FIXME remaining');
    console.log('  2. No empty method bodies');
    console.log('  3. No log-only method bodies');
    console.log('  4. All imports valid (Grep verify)');
    console.log('  5. All method signatures match design contract');
    if (opts.compile) {
      console.log('  6. Compilation passes (mvn compile / npm run build)');
    }
    console.log('');
    console.log('[OK] Verification instructions output. Execute in subagent context.');
  } else if (opts.complete) {
    if (!opts.task || !opts.segment) {
      console.error('[ERROR] --complete requires --task <taskId> and --segment <segId>');
      process.exit(1);
    }
    completeSegment(opts.task, opts.segment);
  } else if (opts.lockStatus) {
    if (!opts.task) {
      console.error('[ERROR] --lock-status requires --task <taskId>');
      process.exit(1);
    }
    lockStatus(opts.task);
  } else {
    console.error('[ERROR] No action specified. Use --plan, --skeleton, --fill, --fill-all, --verify, --complete, or --lock-status');
    process.exit(1);
  }
}

function extractSegmentsFromPlan(planContent) {
  const segments = [];
  const lines = planContent.split('\n');
  let inSegments = false;
  let current = {};

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === 'segments:') { inSegments = true; continue; }
    if (inSegments && trimmed.startsWith('#')) break;

    if (inSegments && trimmed.startsWith('- id:')) {
      if (current.id) segments.push(current);
      current = { id: '', type: '', target_file: '', target_method: '', description: '' };
      current.id = parseYamlValue(trimmed.replace(/^-\s*id:\s*/, ''));
    } else if (inSegments && current.id) {
      const typeMatch = trimmed.match(/^type:\s*"?(.+?)"?\s*$/);
      if (typeMatch) current.type = typeMatch[1];
      const fileMatch = trimmed.match(/^target_file:\s*"?(.+?)"?\s*$/);
      if (fileMatch) current.target_file = fileMatch[1];
      const methodMatch = trimmed.match(/^target_method:\s*"?(.+?)"?\s*$/);
      if (methodMatch) current.target_method = methodMatch[1];
      const descMatch = trimmed.match(/^description:\s*"?(.+?)"?\s*$/);
      if (descMatch) current.description = descMatch[1];
    }
  }
  if (current.id) segments.push(current);
  return segments;
}

main();
