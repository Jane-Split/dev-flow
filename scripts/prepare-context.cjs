/**
 * dev-flow subagent 上下文注入脚本
 *
 * 在派发 subagent 前，自动将任务所需的所有上下文文件合并为 task-brief.md，
 * 确保 subagent 打开即有完整信息，不依赖 AI 自觉读取文件。
 *
 * 用法：
 *   node scripts/prepare-context.cjs --task Task-5 --demand user-management
 *   node scripts/prepare-context.cjs --task Task-5 --demand user-management --dry-run
 *   node scripts/prepare-context.cjs --batch 3 --demand user-management
 *   node scripts/prepare-context.cjs --help
 *
 * 依赖：零外部依赖
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DOCS_DIR = path.join(ROOT, '.dev-flow', 'docs');
const RUNTIME_DIR = path.join(ROOT, '.dev-flow', 'runtime');
const MEMORY_DIR = path.join(ROOT, '.dev-flow', 'memory');
const STAGES_DIR = path.join(ROOT, 'skill-templates', '_core', 'stages');

// ============================================================
// 配置
// ============================================================

const MAX_BRIEF_SIZE = 120 * 1024; // 120KB - 给 subagent 留足够空间
const MAX_FILE_READ = 30 * 1024;   // 单个依赖文件最大 30KB

// ============================================================
// 参数解析
// ============================================================

function parseArgs(args) {
  const opts = { task: null, demand: null, batch: null, dryRun: false };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--task' && args[i + 1]) { opts.task = args[++i]; }
    else if (args[i] === '--demand' && args[i + 1]) { opts.demand = args[++i]; }
    else if (args[i] === '--batch' && args[i + 1]) { opts.batch = args[++i]; }
    else if (args[i] === '--dry-run') { opts.dryRun = true; }
    else if (args[i] === '--help') { opts.help = true; }
  }
  return opts;
}

// ============================================================
// YAML 简易解析器（增强版）
// ============================================================

function parseYaml(content) {
  const lines = content.split('\n');
  const result = parseBlock(lines, 0, 0).result;
  return result;
}

function parseBlock(lines, startIdx, baseIndent) {
  const result = {};
  const items = [];
  let i = startIdx;
  let currentKey = null;
  let currentIndent = baseIndent;
  let collectingList = false;
  let collectingListKey = null;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith('#')) { i++; continue; }

    const indent = line.search(/\S/);
    if (indent === -1) { i++; continue; }

    // 回退到更外层
    if (indent < baseIndent && trimmed !== '') break;

    // 列表项
    if (trimmed.startsWith('- ') && indent <= currentIndent + 2) {
      collectingList = true;
      collectingListKey = currentKey;
      if (!Array.isArray(result[currentKey])) {
        result[currentKey] = [];
      }
      const val = trimmed.slice(2).trim();
      // 列表项可能包含 key: value
      const kvMatch = val.match(/^([^:]+):\s*(.*)$/);
      if (kvMatch) {
        const subObj = {};
        subObj[kvMatch[1].trim()] = parseValue(kvMatch[2].trim());
        result[currentKey].push(subObj);
      } else {
        result[currentKey].push(parseValue(val));
      }
      currentIndent = indent;
      i++; continue;
    }

    // key: value
    const kvMatch = trimmed.match(/^([^:#]+):\s*(.*)$/);
    if (kvMatch && indent === baseIndent) {
      currentKey = kvMatch[1].trim();
      const val = kvMatch[2].trim();
      if (val === '') {
        // 可能是对象或列表，需要看下一行
        collectingList = false;
        result[currentKey] = null;
      } else {
        result[currentKey] = parseValue(val);
        collectingList = false;
      }
      currentIndent = indent;
      i++; continue;
    }

    // key: value（缩进更深的子字段）
    if (kvMatch && indent > baseIndent) {
      currentKey = kvMatch[1].trim();
      const val = kvMatch[2].trim();
      result[currentKey] = val === '' ? null : parseValue(val);
      currentIndent = indent;
      i++; continue;
    }

    i++;
  }
  return { result, nextIdx: i };
}

function parseValue(val) {
  if (val === 'null' || val === '~') return null;
  if (val === 'true') return true;
  if (val === 'false') return false;
  if (val === '[]' || val === '{}') return val === '[]' ? [] : {};
  if (/^"(.*)"$/.test(val)) return val.slice(1, -1);
  if (/^'.*'$/.test(val)) return val.slice(1, -1);
  if (/^\[.*\]$/.test(val)) {
    const inner = val.slice(1, -1);
    if (!inner.trim()) return [];
    return inner.split(',').map(s => parseValue(s.trim()));
  }
  if (!isNaN(Number(val)) && val !== '') return Number(val);
  return val;
}

// ============================================================
// 文件操作
// ============================================================

function safeRead(filePath, maxSize) {
  maxSize = maxSize || MAX_FILE_READ;
  try {
    if (!fs.existsSync(filePath)) return null;
    const stat = fs.statSync(filePath);
    if (stat.size > maxSize) {
      console.warn(`[WARN] 文件过大 (${Math.round(stat.size / 1024)}KB)，跳过: ${path.basename(filePath)}`);
      return `/* 文件过大(${Math.round(stat.size / 1024)}KB)，内容省略，请 subagent 自行读取: ${filePath} */`;
    }
    return fs.readFileSync(filePath, 'utf-8');
  } catch (e) {
    return null;
  }
}

function findFile(dir, pattern) {
  if (!fs.existsSync(dir)) return null;
  const files = fs.readdirSync(dir);
  // 精确匹配：优先完整文件名匹配，然后前缀匹配
  const exact = files.find(f => f === pattern || f.startsWith(pattern + '.') || f.startsWith(pattern + '-'));
  return exact ? path.join(dir, exact) : null;
}

function findDemandFile(prefix) {
  if (!fs.existsSync(DOCS_DIR)) return null;
  const files = fs.readdirSync(DOCS_DIR);
  // 精确匹配：前缀匹配 + .yaml/.md/.yml 扩展名
  // 优先匹配 prefix-{suffix}.yaml，然后 prefix.yaml，然后 prefix-{suffix}.md
  const yamlExts = ['.yaml', '.yml'];
  const mdExts = ['.md'];

  // 1. 精确前缀 + 扩展名匹配（如 "user-management-task-dag.yaml" 匹配前缀 "user-management-task-dag"）
  for (const ext of [...yamlExts, ...mdExts]) {
    const exact = files.find(f => f === `${prefix}${ext}`);
    if (exact) return path.join(DOCS_DIR, exact);
  }

  // 2. 前缀 + 分隔符匹配（如 "user-management-task-dag.yaml" 匹配前缀 "user-management" + 后缀 "-task-dag"）
  //    这里 prefix 是需求名（如 "user-management"），完整文件名是 "user-management-task-dag.yaml"
  //    所以匹配 f.startsWith(prefix + '-') && f.endsWith(.yaml)
  for (const ext of [...yamlExts, ...mdExts]) {
    const prefixed = files.find(f => f.startsWith(prefix + '-') && f.endsWith(ext));
    if (prefixed) return path.join(DOCS_DIR, prefixed);
  }

  // 3. 兜底：文件名包含 prefix（但必须是独立词边界，避免 user-management 匹配到 user-management-design-contract.yaml 而非 user-management-task-dag.yaml）
  //    当有多个匹配时，优先选最长的（最精确的匹配）
  const candidates = files.filter(f => {
    const nameWithoutExt = f.replace(/\.(yaml|yml|md)$/, '');
    // prefix 必须是文件名（去掉扩展名后）的前缀部分，通过 - 分隔
    const parts = nameWithoutExt.split('-');
    // 至少匹配前 N 段
    const prefixParts = prefix.split('-');
    return prefixParts.every((p, i) => parts[i] === p);
  });

  if (candidates.length === 1) return path.join(DOCS_DIR, candidates[0]);
  if (candidates.length > 1) {
    // 多个匹配，选最长的文件名（最精确）
    candidates.sort((a, b) => b.length - a.length);
    console.warn(`[WARN] findDemandFile('${prefix}') 匹配到多个文件，选择最精确的: ${candidates[0]} (候选: ${candidates.join(', ')})`);
    return path.join(DOCS_DIR, candidates[0]);
  }

  return null;
}

// ============================================================
// 上下文收集器
// ============================================================

function collectTaskContext(taskId, demandName) {
  const sections = [];
  let totalSize = 0;

  function addSection(title, content) {
    if (!content || content.trim() === '') return false;
    const section = `\n## ${title}\n\n${content.trim()}\n`;
    if (totalSize + section.length > MAX_BRIEF_SIZE) {
      console.warn(`[WARN] 上下文已达 ${Math.round(MAX_BRIEF_SIZE / 1024)}KB 上限，跳过: ${title}`);
      return false;
    }
    sections.push(section);
    totalSize += section.length;
    return true;
  }

  // 1. 任务基本信息
  const dagFile = findDemandFile(demandName ? `${demandName}-task-dag` : 'task-dag');
  if (dagFile) {
    const dagContent = safeRead(dagFile);
    if (dagContent) {
      const taskInfo = extractTaskFromDag(dagContent, taskId);
      if (taskInfo) {
        addSection('Task Info', [
          `Task ID: ${taskInfo.id}`,
          taskInfo.name ? `Name: ${taskInfo.name}` : '',
          taskInfo.agent ? `Agent: ${taskInfo.agent}` : '',
          taskInfo.type ? `Type: ${taskInfo.type}` : '',
          taskInfo.description ? `Description: ${taskInfo.description}` : '',
          taskInfo.dependencies.length > 0 ? `Dependencies: ${taskInfo.dependencies.join(', ')}` : 'Dependencies: none (can start immediately)',
          taskInfo.parallel_group ? `Parallel Group: ${taskInfo.parallel_group}` : '',
        ].filter(Boolean).join('\n'));
      }
    }
  }

  // 2. 子任务设计文档
  const subtaskDesign = findDemandFile(demandName ? `subtask-${taskId.replace(/^Task-/, '')}` : `subtask-${taskId.replace(/^Task-/, '')}`);
  if (subtaskDesign) {
    const content = safeRead(subtaskDesign, MAX_BRIEF_SIZE / 4);
    if (content) addSection('Subtask Design', content);
  }
  // 尝试在 docs 目录下找
  if (!subtaskDesign) {
    const alt = findFile(DOCS_DIR, `subtask-${taskId.replace(/^Task-/, '')}`) ||
                findFile(DOCS_DIR, taskId.toLowerCase());
    if (alt) {
      const content = safeRead(alt, MAX_BRIEF_SIZE / 4);
      if (content) addSection('Subtask Design', content);
    }
  }

  // 3. Design Contract（关键！必须包含）
  const contractFile = findDemandFile(demandName ? `${demandName}-design-contract` : 'design-contract');
  if (contractFile) {
    const content = safeRead(contractFile, MAX_BRIEF_SIZE / 3);
    if (content) {
      // 提取与本任务相关的部分
      const taskSpecific = extractRelevantContract(content, taskId);
      addSection('Design Contract (Relevant)', taskSpecific || content);
    }
  }

  // 4. 阶段指令（Develop 阶段核心规则）
  const developStage = path.join(STAGES_DIR, 'develop.md');
  if (fs.existsSync(developStage)) {
    const fullContent = safeRead(developStage);
    if (fullContent) {
      // 提取关键步骤规则，而非全文
      const coreRules = extractDevelopCoreRules(fullContent);
      addSection('Develop Rules (Core)', coreRules);
    }
  }

  // 5. 编码规范
  const conventions = path.join(MEMORY_DIR, 'conventions.md');
  const convContent = safeRead(conventions, 15 * 1024);
  if (convContent) addSection('Coding Conventions', convContent);

  // 6. 错误模式
  const mistakes = path.join(MEMORY_DIR, 'mistakes.md');
  const mistakesContent = safeRead(mistakes, 10 * 1024);
  if (mistakesContent) addSection('Error Patterns to Avoid', mistakesContent);

  // 7. 父任务结果（依赖的 subagent 产出）
  const dagContent = safeRead(dagFile);
  if (dagContent) {
    const taskInfo = extractTaskFromDag(dagContent, taskId);
    if (taskInfo && taskInfo.dependencies.length > 0) {
      const parentResults = [];
      for (const depId of taskInfo.dependencies) {
        const resultFile = path.join(RUNTIME_DIR, `task-result-${depId}.yaml`);
        const resultContent = safeRead(resultFile, 5 * 1024);
        if (resultContent) {
          parentResults.push(`### Parent Task: ${depId}\n${resultContent}`);
        }
      }
      if (parentResults.length > 0) {
        addSection('Parent Task Results', parentResults.join('\n\n'));
      }
    }
  }

  // 8. 依赖类定义
  if (contractFile) {
    const contractContent = safeRead(contractFile);
    if (contractContent) {
      const deps = extractDependencyList(contractContent);
      const depDefinitions = [];
      const projectRoot = findProjectRoot();
      if (projectRoot && deps.length > 0) {
        for (const dep of deps) {
          // 搜索类文件
          const matches = searchClassFile(projectRoot, dep);
          if (matches.length > 0) {
            const classContent = safeRead(matches[0], 8 * 1024);
            if (classContent) {
              depDefinitions.push(`### ${dep}\nFile: ${matches[0]}\n\`\`\`\n${classContent}\n\`\`\``);
            }
          }
        }
      }
      if (depDefinitions.length > 0) {
        addSection('Dependency Class Definitions', depDefinitions.join('\n\n'));
      }
    }
  }

  return { sections, totalSize };
}

function extractTaskFromDag(dagContent, taskId) {
  const tasks = [];
  const lines = dagContent.split('\n');
  let currentTask = null;
  let currentIndent = -1;

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const indent = rawLine.search(/\S/);
    if (indent < 0) continue;

    if (indent === 0 && trimmed.match(/^- /)) {
      const idMatch = trimmed.match(/^-\s*id:\s*["']?(.+?)["']?\s*$/);
      if (idMatch) {
        if (currentTask && currentTask.id === taskId) return currentTask;
        currentTask = {
          id: idMatch[1],
          dependencies: [],
          agent: '',
          type: '',
          parallel_group: '',
          name: '',
          description: '',
          target_files: [],
          read_files: [],
        };
        tasks.push(currentTask);
        currentIndent = indent;
        continue;
      }
    }
    if (!currentTask) continue;
    const depMatch = trimmed.match(/^dependencies:\s*\[(.+?)\]\s*$/);
    if (depMatch) { currentTask.dependencies = depMatch[1].split(',').map(s => s.trim()).filter(Boolean); continue; }
    if (trimmed === 'dependencies:') { currentTask._collecting = 'dependencies'; currentIndent = indent; continue; }
    if (indent > currentIndent && currentTask._collecting === 'dependencies' && trimmed.startsWith('- ')) {
      currentTask.dependencies.push(trimmed.slice(2).trim()); continue;
    }
    const agentMatch = trimmed.match(/^agent:\s*["']?(.+?)["']?\s*$/);
    if (agentMatch) { currentTask.agent = agentMatch[1]; currentTask._collecting = null; continue; }
    const typeMatch = trimmed.match(/^type:\s*["']?(.+?)["']?\s*$/);
    if (typeMatch) { currentTask.type = typeMatch[1]; currentTask._collecting = null; continue; }
    const nameMatch = trimmed.match(/^name:\s*["']?(.+?)["']?\s*$/);
    if (nameMatch) { currentTask.name = nameMatch[1]; currentTask._collecting = null; continue; }
    const descMatch = trimmed.match(/^description:\s*["']?(.+?)["']?\s*$/);
    if (descMatch) { currentTask.description = descMatch[1]; currentTask._collecting = null; continue; }
    currentTask._collecting = null;
  }
  if (currentTask && currentTask.id === taskId) return currentTask;
  return null;
}

function extractRelevantContract(contractContent, taskId) {
  // 如果 contract 内容太大，尝试提取与本任务相关的部分
  if (contractContent.length < 40 * 1024) return contractContent;

  const lines = contractContent.split('\n');
  const taskNum = taskId.replace(/\D/g, '');
  const relevantSections = [];
  let inRelevantSection = false;
  let sectionDepth = 0;

  for (const line of lines) {
    if (line.match(new RegExp(`task[-_]?${taskNum}\\b`, 'i')) ||
        line.match(/(service|mapper|entity|controller|dto|enum)s?:/i)) {
      inRelevantSection = true;
      sectionDepth = (line.match(/^-/) || [])[0] ? 1 : 0;
    }
    if (inRelevantSection) {
      relevantSections.push(line);
      if (line.match(/^[a-z]/i) && !line.startsWith(' ') && !line.startsWith('#') && sectionDepth === 0) {
        inRelevantSection = false;
      }
    }
  }

  if (relevantSections.length > 20) {
    return relevantSections.join('\n');
  }
  // 如果提取不到有意义的部分，返回 contract 的接口定义部分
  const interfaceIdx = contractContent.indexOf('interfaces:');
  if (interfaceIdx > 0) {
    return contractContent.substring(0, interfaceIdx + 5000);
  }
  return contractContent.substring(0, 40 * 1024);
}

function extractDevelopCoreRules(developContent) {
  // 提取 develop.md 中最关键的规则，而非全文（避免上下文过大）
  const rules = [];

  // 提取禁止事项
  const forbidSection = developContent.match(/禁止事项[^\n]*\n([\s\S]*?)(?=\n###|\n##|$)/);
  if (forbidSection) {
    rules.push('### Prohibitions\n' + forbidSection[1].trim());
  }

  // 提取完整性要求
  const completeSection = developContent.match(/每个方法的完整性要求[^\n]*\n([\s\S]*?)(?=\n---\n|\n### |\n## |$)/);
  if (completeSection) {
    rules.push('### Completeness Requirements\n' + completeSection[1].trim());
  }

  // 提取强制检查项
  const checkSection = developContent.match(/强制检查项[^\n]*\n([\s\S]*?)(?=\n---\n|\n### |\n## |$)/);
  if (checkSection) {
    rules.push('### Mandatory Checks\n' + checkSection[1].trim());
  }

  // 如果提取不到具体内容，返回关键规则的精简版
  if (rules.length === 0) {
    return [
      '1. All code must be complete and runnable - no TODO/placeholder/log-only method bodies',
      '2. Every import path must be verified with Grep before use',
      '3. Every method call must match actual signatures from dependency classes',
      '4. Every field assignment must be type-compatible (check actual types)',
      '5. After code generation: compile verification -> QuickTest -> logic coverage check',
      '6. Read the full design-contract.yaml and subtask design before writing any code',
      '7. For each method: validate input -> business logic -> persistence/external call -> return result',
    ].join('\n');
  }

  return rules.join('\n\n');
}

function extractDependencyList(contractContent) {
  const deps = [];
  // 提取 Entity 类名
  const entityMatches = contractContent.match(/name:\s*"(\w+)"\s*\n\s*package:/g);
  if (entityMatches) {
    for (const m of entityMatches) {
      const nameMatch = m.match(/name:\s*"(\w+)"/);
      if (nameMatch) deps.push(nameMatch[1]);
    }
  }
  return [...new Set(deps)];
}

function findProjectRoot() {
  // 从当前目录向上查找项目根目录（包含 pom.xml/package.json/go.mod 等）
  let dir = process.cwd();
  while (dir !== path.dirname(dir)) {
    const markers = ['pom.xml', 'package.json', 'go.mod', 'pyproject.toml', 'Cargo.toml', 'AGENTS.md', 'CLAUDE.md', '.cursor'];
    for (const marker of markers) {
      if (fs.existsSync(path.join(dir, marker))) return dir;
    }
    dir = path.dirname(dir);
  }
  return process.cwd();
}

function searchClassFile(projectRoot, className) {
  // 纯 Node.js 实现，跨平台兼容（不依赖 find/ls 等系统命令）
  const results = [];
  const extensions = ['.java', '.ts', '.tsx', '.py', '.go'];
  const maxDepth = 15;
  const maxResults = 5;
  const skipDirs = new Set([
    'node_modules', '.git', '.mvn', 'target', 'build', '__pycache__',
    '.idea', '.vscode', 'dist', '.gradle', 'bin', 'out', '.next',
    'vendor', '.cache', 'coverage', '.nyc_output',
  ]);

  function walk(dir, depth) {
    if (depth > maxDepth || results.length >= maxResults) return;
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch (e) { return; }

    for (const entry of entries) {
      if (results.length >= maxResults) break;
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (skipDirs.has(entry.name)) continue;
        walk(fullPath, depth + 1);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name);
        if (extensions.includes(ext) && entry.name === `${className}${ext}`) {
          results.push(fullPath);
        }
      }
    }
  }

  // 按优先级搜索常见源码目录，最后兜底搜全项目
  const searchDirs = [
    path.join(projectRoot, 'src', 'main'),
    path.join(projectRoot, 'src'),
    path.join(projectRoot, 'pkg'),
    path.join(projectRoot, 'lib'),
    path.join(projectRoot, 'app'),
    path.join(projectRoot, 'internal'),
    projectRoot,
  ];

  for (const dir of searchDirs) {
    if (results.length >= maxResults) break;
    if (fs.existsSync(dir)) {
      walk(dir, 0);
    }
  }

  return [...new Set(results)];
}

// ============================================================
// 输出生成
// ============================================================

function generateBrief(taskId, sections, totalSize) {
  const header = [
    `# Task Brief: ${taskId}`,
    ``,
    `> Auto-generated by prepare-context.cjs`,
    `> Size: ${Math.round(totalSize / 1024)}KB / ${Math.round(MAX_BRIEF_SIZE / 1024)}KB`,
    `> Generated at: ${new Date().toISOString()}`,
    ``,
    `## Instructions`,
    ``,
    `1. Read this entire brief carefully before starting any work`,
    `2. Follow the Design Contract exactly - do not deviate from defined interfaces`,
    `3. Verify every import path, method signature, and type before writing code`,
    `4. After code generation: compile -> QuickTest -> logic coverage verification`,
    `5. Write result to task-result-${taskId}.yaml when done`,
    ``,
  ].join('\n');

  return header + sections.join('\n');
}

// ============================================================
// 批量处理
// ============================================================

function processBatch(batchIndex, demandName) {
  const dagFile = findDemandFile(demandName ? `${demandName}-task-dag` : 'task-dag');
  if (!dagFile) {
    console.error(`[ERROR] 未找到 task-dag.yaml`);
    process.exit(1);
  }
  const dagContent = safeRead(dagFile);
  if (!dagContent) { console.error('[ERROR] 无法读取 DAG 文件'); process.exit(1); }

  const lines = dagContent.split('\n');
  let currentBatch = -1;
  const batchTasks = [];

  // 简单批次检测（基于 dispatch.cjs 的输出）
  // 或者直接从 DAG 文件中按拓扑排序找同批次任务
  // 这里简化为：读取所有任务，用户指定 batch 后按任务列表取
  for (const rawLine of lines) {
    const trimmed = rawLine.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idMatch = trimmed.match(/^-\s*id:\s*["']?(.+?)["']?\s*$/);
    if (idMatch) {
      batchTasks.push(idMatch[1]);
    }
  }

  if (batchIndex < 0 || batchIndex >= batchTasks.length) {
    console.error(`[ERROR] 批次 ${batchIndex} 超出范围 (共 ${batchTasks.length} 个任务)`);
    process.exit(1);
  }

  // 简单策略：每个"批次"处理 batchTasks[batchIndex]
  // 实际应基于拓扑排序的批次信息
  const taskId = batchTasks[Math.min(batchIndex, batchTasks.length - 1)];
  console.log(`[INFO] 处理批次 ${batchIndex} 中的任务: ${taskId}`);

  return processTask(taskId, demandName);
}

function processTask(taskId, demandName) {
  console.log(`[INFO] 为任务 ${taskId} 准备上下文...`);
  console.log(`[INFO] 需求名称: ${demandName || 'current'}`);

  const { sections, totalSize } = collectTaskContext(taskId, demandName);

  if (sections.length === 0) {
    console.error(`[ERROR] 未找到任何上下文信息给任务 ${taskId}`);
    return false;
  }

  const brief = generateBrief(taskId, sections, totalSize);

  fs.mkdirSync(RUNTIME_DIR, { recursive: true });
  const briefPath = path.join(RUNTIME_DIR, `task-brief-${taskId}.md`);

  fs.writeFileSync(briefPath, brief, 'utf-8');
  console.log(`[INFO] Task Brief 已生成: ${briefPath}`);
  console.log(`[INFO] 大小: ${Math.round(totalSize / 1024)}KB (${sections.length} 个章节)`);

  return true;
}

// ============================================================
// 主入口
// ============================================================

function main() {
  const args = process.argv.slice(2);
  const opts = parseArgs(args);

  if (opts.help) {
    console.log(`
dev-flow Subagent 上下文注入工具

用法：
  node scripts/prepare-context.cjs --task <taskId> [--demand <demandName>] [--dry-run]
  node scripts/prepare-context.cjs --batch <batchIndex> --demand <demandName> [--dry-run]
  node scripts/prepare-context.cjs --help

选项：
  --task <taskId>     为指定任务准备上下文（如 Task-5）
  --batch <index>     为指定批次准备上下文
  --demand <name>     需求名称（用于定位 design-contract.yaml 和 task-dag.yaml）
  --dry-run           仅输出分析结果，不生成文件
  --help              显示帮助

示例：
  node scripts/prepare-context.cjs --task Task-5 --demand user-management
  node scripts/prepare-context.cjs --batch 3 --demand user-management --dry-run
`);
    process.exit(0);
  }

  if (opts.task) {
    const success = processTask(opts.task, opts.demand);
    if (!success) process.exit(1);
  } else if (opts.batch !== null && opts.demand) {
    processBatch(parseInt(opts.batch), opts.demand);
  } else {
    console.error('[ERROR] 必须指定 --task 或 --batch + --demand');
    process.exit(1);
  }
}

main();
