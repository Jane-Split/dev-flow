/**
 * dev-flow 查询协议生成器
 *
 * 为子代理生成查询清单，实现"分层预加载+按步精准查询"模式。
 * 子代理不再一次性加载 60-105KB brief，而是预加载 8-33KB skeleton + 按步查询 15-30KB。
 *
 * 四源合并：design-contract + subtask-design + conventions + Grep 扫描
 *
 * 用法：
 *   node scripts/query-protocol.cjs --action generate --task Task-5 --demand user-mgmt
 *   node scripts/query-protocol.cjs --action extract --file design-contract.yaml --section entities.Order
 *   node scripts/query-protocol.cjs --action execute --task Task-5 --query q1
 *   node scripts/query-protocol.cjs --help
 *
 * 依赖：零外部依赖
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DOCS_DIR = path.join(ROOT, '.dev-flow', 'docs');
const RUNTIME_DIR = path.join(ROOT, '.dev-flow', 'runtime');
const CONTRACTS_DIR = path.join(ROOT, '.dev-flow', 'contracts');
const MEMORY_DIR = path.join(ROOT, '.dev-flow', 'memory');

// ============================================================
// 参数解析
// ============================================================

function parseArgs(args) {
  const opts = {
    action: null,
    task: null,
    demand: null,
    file: null,
    section: null,
    query: null,
    help: false,
  };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--action' && args[i + 1]) { opts.action = args[++i]; }
    else if (args[i] === '--task' && args[i + 1]) { opts.task = args[++i]; }
    else if (args[i] === '--demand' && args[i + 1]) { opts.demand = args[++i]; }
    else if (args[i] === '--file' && args[i + 1]) { opts.file = args[++i]; }
    else if (args[i] === '--section' && args[i + 1]) { opts.section = args[++i]; }
    else if (args[i] === '--query' && args[i + 1]) { opts.query = args[++i]; }
    else if (args[i] === '--help') { opts.help = true; }
  }
  return opts;
}

// ============================================================
// 文件操作
// ============================================================

function safeRead(filePath, maxSize) {
  maxSize = maxSize || 100 * 1024;
  try {
    if (!fs.existsSync(filePath)) return null;
    const stat = fs.statSync(filePath);
    if (stat.size > maxSize) {
      return `/* File too large (${Math.round(stat.size / 1024)}KB), content omitted: ${filePath} */`;
    }
    return fs.readFileSync(filePath, 'utf-8');
  } catch (e) {
    return null;
  }
}

function findDemandFile(prefix) {
  // Search in CONTRACTS_DIR first, then DOCS_DIR
  for (const dir of [CONTRACTS_DIR, DOCS_DIR]) {
    if (!fs.existsSync(dir)) continue;
    const files = fs.readdirSync(dir);
    for (const ext of ['.yaml', '.yml', '.md']) {
      const exact = files.find(f => f === `${prefix}${ext}`);
      if (exact) return path.join(dir, exact);
    }
    for (const ext of ['.yaml', '.yml', '.md']) {
      const prefixed = files.find(f => f.startsWith(prefix) && f.endsWith(ext));
      if (prefixed) return path.join(dir, prefixed);
    }
  }
  return null;
}

function findProjectRoot() {
  let dir = process.cwd();
  while (dir !== path.dirname(dir)) {
    const markers = ['pom.xml', 'package.json', 'go.mod', 'pyproject.toml', 'Cargo.toml'];
    for (const marker of markers) {
      if (fs.existsSync(path.join(dir, marker))) return dir;
    }
    dir = path.dirname(dir);
  }
  return process.cwd();
}

// ============================================================
// 查询清单生成（四源合并）
// ============================================================

function generateQueryList(taskId, demandName) {
  const queries = [];
  let queryId = 0;

  function addQuery(source, type, target, fields, step, estimatedKb, priority) {
    queries.push({
      id: `q${++queryId}`,
      source,
      type,
      target,
      fields,
      step,
      estimated_kb: estimatedKb,
      priority: priority || 'high',
    });
  }

  // 源 1: design-contract.yaml 的依赖列表
  const contractFile = findDemandFile(demandName ? `${demandName}-design-contract` : 'design-contract');
  if (contractFile) {
    const contractContent = safeRead(contractFile);
    if (contractContent) {
      // 提取 Entity 类名和文件路径
      const entityMatches = contractContent.matchAll(/name:\s*["']?(\w+)["']?\s*\n\s*(?:package|table|file)/gi);
      for (const m of entityMatches) {
        const entityName = m[1];
        addQuery('design-contract', 'entity_definition',
          `Grep:class ${entityName}`,
          ['fields', 'annotations', 'table_name'],
          '2.5', 3, 'critical');
      }

      // 提取 Service 类名
      const serviceMatches = contractContent.matchAll(/services?:/gi);
      // 简化：为整个 services 段添加一个查询
      addQuery('design-contract', 'service_signatures',
        contractFile,
        ['method_signatures', 'return_types', 'parameter_types'],
        '2.5', 5, 'critical');

      // 提取 DTO 类名
      addQuery('design-contract', 'dto_definitions',
        contractFile,
        ['fields', 'validation_annotations'],
        '2.5', 3, 'critical');

      // Mapper 接口
      addQuery('design-contract', 'mapper_interfaces',
        contractFile,
        ['method_signatures'],
        '2.5', 2, 'critical');
    }
  }

  // 源 2: subtask-design.yaml 的 read_files 字段
  const subtaskDesignFile = findDemandFile(`subtask-${taskId.replace(/^Task-/, '')}`);
  if (subtaskDesignFile) {
    const designContent = safeRead(subtaskDesignFile);
    if (designContent) {
      // 查找 read_files 或 target_files
      const readFilesMatch = designContent.match(/(?:read_files|target_files):\s*\n((?:\s+- .+\n)*)/);
      if (readFilesMatch) {
        const files = readFilesMatch[1].match(/- (.+)/g) || [];
        for (const f of files) {
          const filePath = f.replace(/^- /, '').trim().replace(/["']/g, '');
          if (!queries.find(q => q.target === filePath)) {
            addQuery('subtask-design', 'reference_code',
              filePath,
              ['all'],
              '2.5', 5, 'high');
          }
        }
      }
    }
  }

  // 源 3: conventions.md 中引用的工具类
  const conventionsFile = path.join(MEMORY_DIR, 'conventions.md');
  if (fs.existsSync(conventionsFile)) {
    addQuery('conventions', 'convention_rules',
      conventionsFile,
      ['service_implementation_rules', 'naming_conventions'],
      '2.5', 3, 'high');
  }

  // 源 4: Grep 扫描 subtask-design 中的类名引用（传递依赖）
  if (subtaskDesignFile) {
    const designContent = safeRead(subtaskDesignFile);
    if (designContent) {
      // 提取类名引用（大写开头的单词，后跟 . 或方法调用）
      const classRefs = designContent.matchAll(/\b([A-Z][a-zA-Z]+)\b/g);
      const uniqueClasses = new Set();
      for (const m of classRefs) {
        const cls = m[1];
        // 排除常见非类名词汇
        const skipWords = new Set(['Step', 'Note', 'Task', 'Description', 'Type', 'Name', 'Priority', 'Status', 'Action', 'Example', 'Return', 'Param', 'True', 'False', 'Null', 'None', 'The', 'This', 'That', 'With', 'From', 'Into']);
        if (!skipWords.has(cls) && cls.length > 2) {
          uniqueClasses.add(cls);
        }
      }
      for (const cls of uniqueClasses) {
        if (!queries.find(q => q.target && q.target.includes(cls))) {
          addQuery('grep-scan', 'transitive_dependency',
            `Grep:class ${cls}`,
            ['signatures'],
            '2.5', 1, 'medium');
        }
      }
    }
  }

  // Step 3 查询：逻辑步骤详情
  addQuery('subtask-design', 'logic_steps',
    subtaskDesignFile || contractFile || '',
    ['logic_steps', 'validation_rules', 'error_handling'],
    '3', 3, 'critical');

  // Step 3 查询：错误模式
  const mistakesFile = path.join(MEMORY_DIR, 'mistakes.md');
  if (fs.existsSync(mistakesFile)) {
    addQuery('conventions', 'error_patterns',
      mistakesFile,
      ['relevant_patterns'],
      '3', 2, 'medium');
  }

  // 按步骤分组
  return groupByStep(queries);
}

function groupByStep(queries) {
  const steps = {};
  for (const q of queries) {
    const stepKey = `step_${q.step.replace('.', '_')}`;
    if (!steps[stepKey]) {
      steps[stepKey] = {
        description: q.step === '2.5' ? '验证所有依赖类的实际代码' : '生成代码',
        queries: [],
        total_estimated_kb: 0,
      };
    }
    steps[stepKey].queries.push(q);
    steps[stepKey].total_estimated_kb += q.estimated_kb;
  }
  return steps;
}

// ============================================================
// 查询清单输出
// ============================================================

function generateQueryProtocolYaml(taskId, demandName, steps) {
  const allQueries = Object.values(steps).flatMap(s => s.queries);
  const totalKb = allQueries.reduce((sum, q) => sum + q.estimated_kb, 0);

  let yaml = `# Query Protocol\n`;
  yaml += `# Auto-generated by query-protocol.cjs\n`;
  yaml += `# Task: ${taskId}\n`;
  yaml += `# Generated: ${new Date().toISOString()}\n\n`;
  yaml += `task_id: "${taskId}"\n`;
  yaml += `demand_name: "${demandName || ''}"\n`;
  yaml += `generated_at: "${new Date().toISOString()}"\n`;
  yaml += `total_queries: ${allQueries.length}\n`;
  yaml += `total_estimated_kb: ${totalKb}\n\n`;

  yaml += `steps:\n`;
  for (const [stepKey, stepData] of Object.entries(steps)) {
    yaml += `  ${stepKey}:\n`;
    yaml += `    description: "${stepData.description}"\n`;
    yaml += `    total_estimated_kb: ${stepData.total_estimated_kb}\n`;
    yaml += `    queries:\n`;
    for (const q of stepData.queries) {
      yaml += `      - id: "${q.id}"\n`;
      yaml += `        source: "${q.source}"\n`;
      yaml += `        type: "${q.type}"\n`;
      yaml += `        target: "${q.target}"\n`;
      yaml += `        fields: [${q.fields.map(f => `"${f}"`).join(', ')}]\n`;
      yaml += `        estimated_kb: ${q.estimated_kb}\n`;
      yaml += `        priority: "${q.priority}"\n`;
    }
  }

  // 添加执行说明
  yaml += `\n# === Instructions for develop-expert subagent ===\n`;
  yaml += `#\n`;
  yaml += `# QUERY_PROTOCOL_MODE: enabled\n`;
  yaml += `#\n`;
  yaml += `# Before each step, execute the listed queries:\n`;
  yaml += `#   node scripts/query-protocol.cjs --action execute --task ${taskId} --query <queryId>\n`;
  yaml += `#\n`;
  yaml += `# Each query returns a precise file fragment.\n`;
  yaml += `# Read the returned content completely before proceeding.\n`;

  return yaml;
}

// ============================================================
// 精准片段提取
// ============================================================

function extractSection(filePath, sectionName) {
  const content = safeRead(filePath);
  if (!content) return `/* File not found: ${filePath} */`;

  // YAML 段落提取：查找 sectionName 对应的顶级 key
  const lines = content.split('\n');
  const relevantLines = [];
  let capturing = false;
  let baseIndent = -1;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      if (capturing) relevantLines.push(line);
      continue;
    }

    const indent = line.search(/\S/);

    // 检查是否匹配目标段落
    if (!capturing) {
      // 支持 dot notation: entities.Order → 匹配 "entities:" 下的 "Order:"
      const parts = sectionName.split('.');
      if (parts.length === 2) {
        if (trimmed === `${parts[0]}:`) {
          capturing = true;
          baseIndent = indent;
          relevantLines.push(line);
          continue;
        }
      }
      if (trimmed.startsWith(`${sectionName}:`) || trimmed === `${sectionName}:`) {
        capturing = true;
        baseIndent = indent;
        relevantLines.push(line);
        continue;
      }
    } else {
      // 已在捕获中，检查是否离开当前段落
      if (indent <= baseIndent && trimmed.match(/^[a-zA-Z_]/)) {
        // 检查是否是子段落（如 entities.Order 中的 Order）
        const parts = sectionName.split('.');
        if (parts.length === 2 && trimmed.startsWith(`${parts[1]}:`)) {
          baseIndent = indent;
          relevantLines.push(line);
          continue;
        }
        if (indent === baseIndent) {
          // 同级新段落，停止捕获
          break;
        }
      }
      relevantLines.push(line);
    }
  }

  if (relevantLines.length === 0) {
    // 未找到精确段落，返回文件前 100 行作为上下文
    return content.split('\n').slice(0, 100).join('\n') + '\n\n/* Section not found, showing first 100 lines */';
  }

  return relevantLines.join('\n');
}

// ============================================================
// 查询执行
// ============================================================

function executeQuery(taskId, queryId) {
  // 读取查询协议文件
  const protocolPath = path.join(RUNTIME_DIR, `query-protocol-${taskId}.yaml`);
  if (!fs.existsSync(protocolPath)) {
    console.error(`[ERROR] Query protocol file not found: ${protocolPath}`);
    console.error(`  Run --action generate first.`);
    process.exit(1);
  }

  const protocolContent = safeRead(protocolPath);
  if (!protocolContent) {
    console.error(`[ERROR] Cannot read query protocol file`);
    process.exit(1);
  }

  // 解析查询项
  const queryMatch = protocolContent.match(new RegExp(`id:\\s*["']?${queryId}["']?\\s*\\n\\s*source:\\s*["']?(.+?)["']?\\s*\\n\\s*type:\\s*["']?(.+?)["']?\\s*\\n\\s*target:\\s*["']?(.+?)["']?\\s*\\n`));

  if (!queryMatch) {
    console.error(`[ERROR] Query ${queryId} not found in protocol`);
    process.exit(1);
  }

  const target = queryMatch[3].trim();

  // Grep 类型查询
  if (target.startsWith('Grep:')) {
    const grepPattern = target.replace('Grep:', '');
    console.log(`[INFO] Grep query: ${grepPattern}`);
    console.log(`[INFO] Execute in subagent: Grep "${grepPattern}" --glob="**/*.java"`);
    console.log(`\n--- Query ${queryId} Result ---\n`);
    console.log(`Please execute the Grep command above in your subagent context.`);
    return;
  }

  // 文件读取查询
  if (fs.existsSync(target)) {
    const content = safeRead(target, 30 * 1024);
    console.log(`\n--- Query ${queryId} Result ---\n`);
    console.log(`File: ${target}`);
    console.log(`Size: ${content ? Math.round(Buffer.byteLength(content, 'utf-8') / 1024) : 0}KB\n`);
    console.log(content || '/* File empty or too large */');
  } else {
    // 尝试在项目中搜索
    const projectRoot = findProjectRoot();
    const filename = path.basename(target);
    console.log(`[WARN] File not found: ${target}`);
    console.log(`[INFO] Try searching in project: Grep "class ${filename.replace(/\.\w+$/, '')}" --glob="**/*.java"`);
  }
}

// ============================================================
// 主入口
// ============================================================

function main() {
  const args = process.argv.slice(2);
  const opts = parseArgs(args);

  if (opts.help) {
    console.log(`
dev-flow 查询协议生成器

用法：
  node scripts/query-protocol.cjs --action generate --task <taskId> --demand <name>
  node scripts/query-protocol.cjs --action extract --file <path> --section <name>
  node scripts/query-protocol.cjs --action execute --task <taskId> --query <queryId>
  node scripts/query-protocol.cjs --help

选项：
  --action <action>  generate | extract | execute
  --task <taskId>    任务 ID（如 Task-5）
  --demand <name>    需求名称
  --file <path>      目标文件路径（extract 时使用）
  --section <name>   段落名称（extract 时使用，如 entities.Order）
  --query <queryId>  查询项 ID（execute 时使用，如 q1）
  --help             显示帮助

示例：
  node scripts/query-protocol.cjs --action generate --task Task-5 --demand user-mgmt
  node scripts/query-protocol.cjs --action extract --file design-contract.yaml --section entities.Order
  node scripts/query-protocol.cjs --action execute --task Task-5 --query q1
`);
    process.exit(0);
  }

  if (!opts.action) {
    console.error('[ERROR] Must specify --action (generate|extract|execute)');
    process.exit(1);
  }

  if (!fs.existsSync(RUNTIME_DIR)) fs.mkdirSync(RUNTIME_DIR, { recursive: true });

  switch (opts.action) {
    case 'generate': {
      if (!opts.task) {
        console.error('[ERROR] Must specify --task for generate action');
        process.exit(1);
      }
      const steps = generateQueryList(opts.task, opts.demand);
      const yaml = generateQueryProtocolYaml(opts.task, opts.demand, steps);
      const protocolPath = path.join(RUNTIME_DIR, `query-protocol-${opts.task}.yaml`);
      fs.writeFileSync(protocolPath, yaml, 'utf-8');
      const allQueries = Object.values(steps).flatMap(s => s.queries);
      const totalKb = allQueries.reduce((sum, q) => sum + q.estimated_kb, 0);
      console.log(`[OK] Query protocol generated: ${protocolPath}`);
      console.log(`[INFO] Total queries: ${allQueries.length}, Total estimated: ${totalKb}KB`);
      break;
    }
    case 'extract': {
      if (!opts.file) {
        console.error('[ERROR] Must specify --file for extract action');
        process.exit(1);
      }
      const result = extractSection(opts.file, opts.section || '');
      console.log(result);
      break;
    }
    case 'execute': {
      if (!opts.task || !opts.query) {
        console.error('[ERROR] Must specify --task and --query for execute action');
        process.exit(1);
      }
      executeQuery(opts.task, opts.query);
      break;
    }
    default:
      console.error(`[ERROR] Unknown action: ${opts.action}`);
      process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  generateQueryList,
  extractSection,
  executeQuery,
  generateQueryProtocolYaml,
};
