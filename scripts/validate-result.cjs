/**
 * dev-flow subagent 产出校验脚本
 *
 * 在 subagent 完成任务后，自动校验 task-result.yaml 的完整性：
 * 1. 文件存在性 + 非空
 * 2. 无 TODO/FIXME/空方法体
 * 3. 编译验证（如可执行）
 * 4. Design Contract 方法签名一致性
 *
 * 用法：
 *   node scripts/validate-result.cjs --task Task-5 --demand user-management
 *   node scripts/validate-result.cjs --all --demand user-management
 *   node scripts/validate-result.cjs --help
 *
 * 依赖：零外部依赖（编译验证需要 mvn/npm）
 */

const fs = require('fs');
const path = require('path');
const { StaticValidationSuite } = require('./static-validation-suite.cjs');

const ROOT = path.resolve(__dirname, '..');
const DOCS_DIR = path.join(ROOT, '.dev-flow', 'docs');
const RUNTIME_DIR = path.join(ROOT, '.dev-flow', 'runtime');

// 有效的 contract 文件名列表
const CONTRACT_FILES = [
  'design-contract.yaml',
  'test-case-contract.yaml',
  'runtime-contract.yaml',
  'demand-draft.yaml',
];

// ============================================================
// 校验器
// ============================================================

function detectLanguage(filePath) {
  const ext = path.extname(filePath);
  const map = { '.java': 'java', '.ts': 'ts', '.js': 'js', '.py': 'py', '.go': 'go' };
  return map[ext] || 'java';
}

function validateResult(taskId, demandName) {
  const resultFile = path.join(RUNTIME_DIR, `task-result-${taskId}.yaml`);
  const errors = [];
  const warnings = [];

  // 1. 文件存在性
  if (!fs.existsSync(resultFile)) {
    return { taskId, status: 'MISSING', errors: [`task-result-${taskId}.yaml 不存在`], warnings: [] };
  }

  const content = fs.readFileSync(resultFile, 'utf-8');
  const lines = content.split('\n');

  // 2. status 字段
  const statusMatch = content.match(/status:\s*(success|partial|failed)/);
  if (!statusMatch) {
    errors.push('缺少 status 字段或值不合法 (success/partial/failed)');
  }
  const status = statusMatch ? statusMatch[1] : 'unknown';

  // 3. completed_files 列表
  const completedFiles = [];
  const cfSection = extractYamlList(lines, 'completed_files');
  if (cfSection.length === 0) {
    errors.push('缺少 completed_files 列表');
  } else {
    for (const entry of cfSection) {
      const pathMatch = entry.match(/path:\s*["']?(.+?)["']?\s*$/);
      if (pathMatch) {
        completedFiles.push(pathMatch[1]);
      }
    }
  }

  // 4. 文件存在性验证 + Layer 1 静态验证套件
  const projectRoot = process.cwd();
  for (const filePath of completedFiles) {
    const fullPath = path.resolve(projectRoot, filePath);
    if (!fs.existsSync(fullPath)) {
      errors.push(`声明产出文件不存在: ${filePath}`);
    } else {
      const stat = fs.statSync(fullPath);
      if (stat.size === 0) {
        errors.push(`产出文件为空: ${filePath}`);
      }
    }

    // Layer 1: 静态验证套件（硬阻断）
    if (fs.existsSync(fullPath)) {
      const suite = new StaticValidationSuite({
        projectRoot,
        language: detectLanguage(filePath)
      });
      const staticResult = suite.run(fullPath);

      if (!staticResult.passed) {
        for (const block of staticResult.blocking) {
          errors.push(`[LAYER_1][${path.basename(filePath)}] ${block.name}: ${JSON.stringify(block.details)}`);
        }
      }
      if (staticResult.warnings.length > 0) {
        for (const warn of staticResult.warnings) {
          warnings.push(`[LAYER_1][${path.basename(filePath)}] ${warn.name}: ${JSON.stringify(warn.details)}`);
        }
      }
    }
  }

  // 5. 代码质量扫描（TODO/FIXME/空方法体）
  for (const filePath of completedFiles) {
    const fullPath = path.resolve(projectRoot, filePath);
    if (!fs.existsSync(fullPath)) continue;

    const fileContent = fs.readFileSync(fullPath, 'utf-8');

    // TODO/FIXME 检查
    const todoMatches = fileContent.match(/\/\/\s*TODO[^\n]*/gi) || [];
    if (todoMatches.length > 0) {
      for (const m of todoMatches) {
        errors.push(`[${path.basename(filePath)}] 发现 TODO: ${m.trim().substring(0, 80)}`);
      }
    }

    // 空方法体检查（Java/TS/多语言）— 支持注解、泛型、多参数
    const emptyMethodPatterns = [
      // Java: 含注解的空方法
      /@\w+(?:\([^)]*\))?\s*\n?\s*(?:public|protected|private|static|\s)*\w+(?:<[^>]*>)?\s+\w+\([^)]*\)\s*(?:throws\s+[\w,\s]+)?\s*\{\s*\}/g,
      // Java: 普通空方法（含泛型）
      /(?:public|protected|private)\s+(?:static\s+)?\w+(?:<[^>]*>)\s+\w+\([^)]*\)\s*(?:throws\s+[\w,\s]+)?\s*\{\s*\}/g,
      // TypeScript: 空方法/函数
      /(?:public|private|protected|async\s+)?(?:static\s+)?\w+(?:<[^>]*>)?\s*\([^)]*\)\s*(?::\s*[^{]+)?\s*\{\s*\}/g,
      // Python: pass-only 方法
      /def\s+\w+\([^)]*\):\s*\n\s+pass\s*\n/g,
      // Go: 空函数体
      /func\s+(?:\([^)]*\)\s+)?\w+\([^)]*\)\s*(?:\([^)]*\)\s+)?\{\s*\}/g,
    ];
    const emptyMethodMatches = [];
    for (const pattern of emptyMethodPatterns) {
      const matches = fileContent.match(pattern) || [];
      emptyMethodMatches.push(...matches);
    }
    if (emptyMethodMatches.length > 0) {
      for (const m of emptyMethodMatches) {
        errors.push(`[${path.basename(filePath)}] 空方法体: ${m.trim().substring(0, 80)}`);
      }
    }

    // 日志替代业务逻辑检查（多行方法体）
    const logOnlyPattern = /(?:public|protected|private)\s+\S+\s+\w+\([^)]*\)[^{]*\{(?:[^}]*log\.(info|warn|debug|error)\([^)]*\)[^}]*)+return\s+(?:null|void|Optional\.empty|ResponseEntity\.ok)\s*;?\s*\}/g;
    const logOnlyMatches = fileContent.match(logOnlyPattern) || [];
    if (logOnlyMatches.length > 0) {
      for (const m of logOnlyMatches) {
        warnings.push(`[${path.basename(filePath)}] 方法体仅含日志: ${m.trim().substring(0, 80)}`);
      }
    }

    // return null 检查
    const returnNullMatches = fileContent.match(/return\s+null\s*;/g) || [];
    if (returnNullMatches.length > 0) {
      for (const rn of returnNullMatches) {
        warnings.push(`[${path.basename(filePath)}] 发现 return null: ${rn.trim()}`);
      }
    }

    // 5.5 TypeScript/Python/Go 基础校验
    const ext = path.extname(filePath).toLowerCase();
    if (ext === '.ts' || ext === '.tsx') {
      // TypeScript: 检查 any 类型滥用
      const anyMatches = fileContent.match(/:\s*any\b/g) || [];
      if (anyMatches.length > 0) {
        warnings.push(`[${path.basename(filePath)}] 发现 ${anyMatches.length} 处 any 类型使用`);
      }
      // TypeScript: 检查 @ts-ignore / @ts-nocheck
      const tsIgnoreMatches = fileContent.match(/@ts-ignore|@ts-nocheck/g) || [];
      if (tsIgnoreMatches.length > 0) {
        warnings.push(`[${path.basename(filePath)}] 发现 ${tsIgnoreMatches.length} 处 @ts-ignore/@ts-nocheck`);
      }
    } else if (ext === '.py') {
      // Python: 检查 bare except
      const bareExceptMatches = fileContent.match(/except\s*:/g) || [];
      if (bareExceptMatches.length > 0) {
        warnings.push(`[${path.basename(filePath)}] 发现 ${bareExceptMatches.length} 处 bare except（应指定具体异常类型）`);
      }
      // Python: 检查 pass 占位（非 __init__ 或抽象方法）
      const passMatches = fileContent.match(/def\s+(\w+)\([^)]*\):\s*\n\s+pass/g) || [];
      const abstractPass = fileContent.match(/def\s+(\w+)\([^)]*\):\s*\n\s+pass.*#\s*abstract/g) || [];
      if (passMatches.length > abstractPass.length) {
        warnings.push(`[${path.basename(filePath)}] 发现 ${passMatches.length - abstractPass.length} 处 pass 占位方法`);
      }
    } else if (ext === '.go') {
      // Go: 检查 panic 占位
      const panicMatches = fileContent.match(/panic\s*\(\s*"(?:todo|not implemented|TODO|fixme)"\s*\)/gi) || [];
      if (panicMatches.length > 0) {
        errors.push(`[${path.basename(filePath)}] 发现 ${panicMatches.length} 处 panic 占位`);
      }
    }
  }

  // 6. Design Contract 一致性检查（如有）
  const contractFile = findDemandFile(demandName ? `${demandName}-design-contract` : 'design-contract');
  if (contractFile && fs.existsSync(contractFile) && completedFiles.length > 0) {
    const contractIssues = checkContractConsistency(contractFile, completedFiles, projectRoot);
    errors.push(...contractIssues.errors);
    warnings.push(...contractIssues.warnings);
  }

  // 6.5 新增 contract 文件校验（test-case-contract / runtime-contract / demand-draft）
  const contractsDir = path.join(ROOT, '.dev-flow', 'contracts', demandName || '');
  const newContractFiles = ['test-case-contract.yaml', 'runtime-contract.yaml', 'demand-draft.yaml'];
  for (const cf of newContractFiles) {
    let cfPath = null;
    // 优先在 contracts/{demandName}/ 目录下查找
    if (fs.existsSync(contractsDir)) {
      const fullPath = path.join(contractsDir, cf);
      if (fs.existsSync(fullPath)) cfPath = fullPath;
    }
    // 兜底：在 docs 目录下查找
    if (!cfPath) {
      cfPath = findDemandFile(demandName ? `${demandName}-${cf.replace('.yaml', '')}` : cf.replace('.yaml', ''));
    }
    if (cfPath && fs.existsSync(cfPath)) {
      const cfContent = fs.readFileSync(cfPath, 'utf-8');
      if (cfContent.trim() === '') {
        warnings.push(`${cf} 文件为空`);
      }
      // test-case-contract.yaml 基本校验
      if (cf === 'test-case-contract.yaml') {
        if (!cfContent.includes('test_suites:') && !cfContent.includes('test_suites')) {
          warnings.push('test-case-contract.yaml 缺少 test_suites 章节');
        }
      }
      // runtime-contract.yaml 基本校验
      if (cf === 'runtime-contract.yaml') {
        if (!cfContent.includes('services:') && !cfContent.includes('startup_sequence:')) {
          warnings.push('runtime-contract.yaml 缺少 services 或 startup_sequence 章节');
        }
      }
      // demand-draft.yaml 基本校验
      if (cf === 'demand-draft.yaml') {
        if (!cfContent.includes('source:') && !cfContent.includes('requirements_draft:')) {
          warnings.push('demand-draft.yaml 缺少 source 或 requirements_draft 章节');
        }
      }
    }
  }

  return { taskId, status, errors, warnings, completedFiles };
}

function extractYamlList(lines, key) {
  const results = [];
  let inSection = false;
  let baseIndent = -1;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const indent = line.search(/\S/);
    if (indent === -1) continue;

    if (trimmed.startsWith(`${key}:`)) {
      inSection = true;
      baseIndent = indent;
      // 检查同行是否有值
      const inlineMatch = trimmed.match(new RegExp(`${key}:\\s*\\[(.+?)\\]`));
      if (inlineMatch) {
        const items = inlineMatch[1].split(',').map(s => s.trim());
        for (const item of items) {
          if (item) results.push(item);
        }
        inSection = false;
      }
      continue;
    }

    if (inSection) {
      if (indent <= baseIndent && !trimmed.startsWith('-')) {
        inSection = false;
        continue;
      }
      if (trimmed.startsWith('- ')) {
        results.push(trimmed.slice(2).trim());
      }
    }
  }
  return results;
}

function checkContractConsistency(contractFile, completedFiles, projectRoot) {
  const errors = [];
  const warnings = [];
  const contractContent = fs.readFileSync(contractFile, 'utf-8');

  try {
    // 提取 contract 中的方法签名
    const serviceMethods = [];
    const serviceBlocks = contractContent.split(/\n(?=  \w+\s*$)/);
    for (const block of serviceBlocks) {
      const methodMatches = block.match(/-\s*name:\s*["'](\w+)["']\s*\n\s*params:\s*\[([^\]]*)\]\s*\n\s*returnType:\s*["']?([^"'\n]+?)["']?\s*(?:\n|$)/);
      for (const m of methodMatches) {
        serviceMethods.push({ name: m[1], params: m[2], returnType: m[3] });
      }
    }

    // 在产出的 Java 文件中验证方法签名
    for (const filePath of completedFiles) {
      if (!filePath.endsWith('.java')) continue;
      const fullPath = path.resolve(projectRoot, filePath);
      if (!fs.existsSync(fullPath)) continue;
      const fileContent = fs.readFileSync(fullPath, 'utf-8');

      for (const method of serviceMethods) {
        const pattern = new RegExp(`(?:public|)\\s+\\S+\\s+${method.name}\\s*\\(`);
        if (contractContent.length > 0 && !pattern.test(fileContent)) {
          // 检查是否在接口文件中（接口可以只有声明没有实现）
          if (!fileContent.includes('interface ') && !fileContent.includes('@FeignClient')) {
            warnings.push(`Contract 方法 ${method.name} 在 ${path.basename(filePath)} 中未找到实现`);
          }
        }
      }
    }
  } catch (e) {
    warnings.push('Contract 一致性检查遇到解析错误，跳过');
  }

  return { errors, warnings };
}

function findDemandFile(prefix) {
  if (!fs.existsSync(DOCS_DIR)) return null;
  const files = fs.readdirSync(DOCS_DIR);
  // 精确匹配：优先完整文件名 → 前缀+分隔符 → 词边界
  for (const ext of ['.yaml', '.yml', '.md']) {
    const exact = files.find(f => f === `${prefix}${ext}`);
    if (exact) return path.join(DOCS_DIR, exact);
  }
  for (const ext of ['.yaml', '.yml', '.md']) {
    const prefixed = files.find(f => f.startsWith(prefix + '-') && f.endsWith(ext));
    if (prefixed) return path.join(DOCS_DIR, prefixed);
  }
  const candidates = files.filter(f => {
    const nameWithoutExt = f.replace(/\.(yaml|yml|md)$/, '');
    const prefixParts = prefix.split('-');
    const parts = nameWithoutExt.split('-');
    return prefixParts.every((p, i) => parts[i] === p);
  });
  if (candidates.length === 1) return path.join(DOCS_DIR, candidates[0]);
  if (candidates.length > 1) {
    candidates.sort((a, b) => b.length - a.length);
    return path.join(DOCS_DIR, candidates[0]);
  }
  return null;
}

// ============================================================
// 编译验证
// ============================================================

function runCompileVerification(projectRoot) {
  // 检测项目类型
  let cmd = null;
  if (fs.existsSync(path.join(projectRoot, 'pom.xml'))) {
    cmd = 'mvn compile -q 2>&1';
  } else if (fs.existsSync(path.join(projectRoot, 'package.json'))) {
    const pkg = JSON.parse(fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf-8'));
    if (pkg.scripts && pkg.scripts.build) {
      cmd = 'npm run build 2>&1';
    } else {
      cmd = 'npx tsc --noEmit 2>&1';
    }
  }

  if (!cmd) return { success: null, message: '无法确定项目类型，跳过编译验证' };

  try {
    const { execSync } = require('child_process');
    const output = execSync(cmd, {
      cwd: projectRoot,
      encoding: 'utf-8',
      timeout: 120000,
      windowsHide: true,
    });
    return { success: true, message: '编译通过' };
  } catch (e) {
    const errorMsg = e.stdout || e.stderr || e.message;
    return { success: false, message: `编译失败:\n${errorMsg.substring(0, 2000)}` };
  }
}

// ============================================================
// 输出
// ============================================================

function printResult(result) {
  console.log('');
  console.log(`═══════════════════════════════════════════════════`);
  console.log(`  Task Result Validation: ${result.taskId}`);
  console.log('═══════════════════════════════════════════════════');
  console.log(`  Status: ${result.status}`);

  if (result.completedFiles.length > 0) {
    console.log(`  Files: ${result.completedFiles.join(', ')}`);
  }

  if (result.errors.length > 0) {
    console.log('');
    console.log(`  Errors (${result.errors.length}):`);
    result.errors.forEach((e, i) => console.log(`    ${i + 1}. ${e}`));
  }

  if (result.warnings.length > 0) {
    console.log('');
    console.log(`  Warnings (${result.warnings.length}):`);
    result.warnings.forEach((w, i) => console.log(`    ${i + 1}. ${w}`));
  }

  const passed = result.errors.length === 0;
  console.log('');
  console.log(`  Result: ${passed ? 'PASS' : 'FAIL'} (${result.errors.length} errors, ${result.warnings.length} warnings)`);
  console.log('═══════════════════════════════════════════════════');

  return passed;
}

// ============================================================
// 主入口
// ============================================================

function main() {
  const args = process.argv.slice(2);
  const opts = { task: null, demand: null, all: false, compile: false, help: false };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--task' && args[i + 1]) { opts.task = args[++i]; }
    else if (args[i] === '--demand' && args[i + 1]) { opts.demand = args[++i]; }
    else if (args[i] === '--all') { opts.all = true; }
    else if (args[i] === '--compile') { opts.compile = true; }
    else if (args[i] === '--help') { opts.help = true; }
  }

  if (opts.help) {
    console.log(`
dev-flow Subagent 产出校验工具

用法：
  node scripts/validate-result.cjs --task <taskId> [--demand <demandName>] [--compile]
  node scripts/validate-result.cjs --all --demand <demandName> [--compile]
  node scripts/validate-result.cjs --help

选项：
  --task <taskId>     校验指定任务的产出
  --all              校验所有任务的产出
  --demand <name>     需求名称（用于定位 design-contract.yaml）
  --compile          额外执行编译验证
  --help              显示帮助

示例：
  node scripts/validate-result.cjs --task Task-5 --demand user-management
  node scripts/validate-result.cjs --all --demand user-management --compile
`);
    process.exit(0);
  }

  if (opts.all && opts.demand) {
    // 校验所有任务
    if (!fs.existsSync(RUNTIME_DIR)) {
      console.error('[ERROR] runtime 目录不存在');
      process.exit(1);
    }
    const files = fs.readdirSync(RUNTIME_DIR).filter(f => f.startsWith('task-result-') && f.endsWith('.yaml'));
    if (files.length === 0) {
      console.log('[INFO] 未找到任何 task-result 文件');
      process.exit(0);
    }

    const taskIds = files.map(f => f.replace('task-result-', '').replace('.yaml', ''));
    let allPassed = true;
    const results = [];

    for (const taskId of taskIds) {
      const result = validateResult(taskId, opts.demand);
      results.push(result);
      const passed = printResult(result);
      if (!passed) allPassed = false;
    }

    // 额外编译验证
    if (opts.compile) {
      console.log('');
      console.log('[INFO] 执行全局编译验证...');
      const compileResult = runCompileVerification(process.cwd());
      console.log(`  ${compileResult.success ? 'PASS' : 'FAIL'}: ${compileResult.message}`);
      if (!compileResult.success) allPassed = false;
    }

    console.log('');
    console.log(`Summary: ${results.length} tasks, ${allPassed ? 'ALL PASS' : 'SOME FAILED'}`);

    // 写入验证报告
    const report = {
      timestamp: new Date().toISOString(),
      demand: opts.demand,
      total_tasks: results.length,
      passed: results.filter(r => r.errors.length === 0).length,
      failed: results.filter(r => r.errors.length > 0).length,
      results: results.map(r => ({
        task_id: r.taskId,
        status: r.status,
        error_count: r.errors.length,
        warning_count: r.warnings.length,
      })),
    };
    const reportPath = path.join(RUNTIME_DIR, 'validation-report.yaml');
    fs.writeFileSync(reportPath, yamlStringify(report), 'utf-8');
    console.log(`Report: ${reportPath}`);

    process.exit(allPassed ? 0 : 1);
  } else if (opts.task) {
    const result = validateResult(opts.task, opts.demand);
    const passed = printResult(result);

    if (opts.compile) {
      console.log('');
      console.log('[INFO] 执行编译验证...');
      const compileResult = runCompileVerification(process.cwd());
      console.log(`  ${compileResult.success ? 'PASS' : 'FAIL'}: ${compileResult.message}`);
    }

    process.exit(passed ? 0 : 1);
  } else {
    console.error('[ERROR] 必须指定 --task 或 --all --demand');
    process.exit(1);
  }
}

function yamlStringify(obj) {
  if (typeof obj === 'string') return obj;
  return Object.entries(obj).map(([k, v]) => {
    if (Array.isArray(v)) {
      return `${k}:\n${v.map(item => {
        if (typeof item === 'object' && item !== null) {
          const inner = Object.entries(item).map(([ik, iv]) => `    ${ik}: ${iv}`).join('\n');
          return `  - ${inner}`;
        }
        return `  - ${item}`;
      }).join('\n')}`;
    }
    return `${k}: ${v}`;
  }).join('\n');
}

main();
