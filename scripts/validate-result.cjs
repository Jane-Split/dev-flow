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

const ROOT = path.resolve(__dirname, '..');
const DOCS_DIR = path.join(ROOT, '.dev-flow', 'docs');
const RUNTIME_DIR = path.join(ROOT, '.dev-flow', 'runtime');

// ============================================================
// 校验器
// ============================================================

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

  // 4. 文件存在性验证
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

    // 空方法体检查（Java）
    const emptyMethodMatches = fileContent.match(/(public|protected|private)\s+\S+\s+\w+\([^)]*\)\s*\{\s*\}/g) || [];
    if (emptyMethodMatches.length > 0) {
      for (const m of emptyMethodMatches) {
        errors.push(`[${path.basename(filePath)}] 空方法体: ${m.trim().substring(0, 80)}`);
      }
    }

    // 日志替代业务逻辑检查
    const logOnlyMethods = fileContent.match(/(public|protected|private)\s+\S+\s+\w+\([^)]*\)[^{]*\{[^}]*log\.(info|warn|debug|error)\([^)]*\)[^}]*\}/g) || [];
    if (logOnlyMethods.length > 0) {
      for (const m of logOnlyMethods) {
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
  }

  // 6. Design Contract 一致性检查（如有）
  const contractFile = findDemandFile(demandName ? `${demandName}-design-contract` : 'design-contract');
  if (contractFile && fs.existsSync(contractFile) && completedFiles.length > 0) {
    const contractIssues = checkContractConsistency(contractFile, completedFiles, projectRoot);
    errors.push(...contractIssues.errors);
    warnings.push(...contractIssues.warnings);
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
      const methodMatches = block.match(/-\s*name:\s*"(\w+)"\s*\n\s*params:\s*\[([^\]]*)\]\s*\n\s*returnType:\s*"?(\w+)"?/);
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

function findDemandFile(pattern) {
  if (!fs.existsSync(DOCS_DIR)) return null;
  const files = fs.readdirSync(DOCS_DIR);
  const match = files.find(f => f.includes(pattern));
  return match ? path.join(DOCS_DIR, match) : null;
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
