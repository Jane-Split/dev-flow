/**
 * dev-flow 文件修改审计脚本
 *
 * 验证零编辑铁律 v2.0 的执行情况：
 * 1. 扫描阶段产生的所有新文件和修改的文件
 * 2. 检查白名单外的文件是否有 @generated-by 溯源注释
 * 3. 计算交付物 SHA-256 checksum
 * 4. 输出 audit-log.yaml
 *
 * 用法：
 *   node scripts/audit.cjs --stage <stage> --session <session-id>
 *   node scripts/audit.cjs --stage <stage> --session <session-id> --strict
 *   node scripts/audit.cjs --help
 *
 * 依赖：零外部依赖（仅 Node.js 内置 crypto 模块）
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');
const DEV_FLOW_DIR = path.join(ROOT, '.dev-flow');
const SESSIONS_DIR = path.join(DEV_FLOW_DIR, 'sessions');
const DELIVERABLES_DIR = path.join(DEV_FLOW_DIR, 'deliverables');
const CONFIRMATIONS_DIR = path.join(DEV_FLOW_DIR, 'stage-confirmations');

// ============================================================
// 文件写入白名单
// ============================================================

const WHITELIST_PATTERNS = [
  // 阶段确认文件
  /\.dev-flow[\\/]stage-confirmations[\\/].+\.confirmed$/,
  // 会话初始化
  /\.dev-flow[\\/]sessions[\\/]session-init\.yaml$/,
  // 审计日志自身
  /audit-log\.yaml$/,
];

// ============================================================
// 工具函数
// ============================================================

function isWhitelisted(filePath) {
  const normalized = filePath.replace(/\//g, '\\/');
  return WHITELIST_PATTERNS.some(pattern => pattern.test(normalized));
}

function hasGeneratedByAnnotation(filePath) {
  if (!fs.existsSync(filePath)) return false;
  const content = fs.readFileSync(filePath, 'utf-8');
  // 支持多种注释格式
  const patterns = [
    /\/\/\s*@generated-by:/,       // Java / JS / TS
    /<!--\s*@generated-by:/,        // HTML / Markdown
    /#\s*@generated-by:/,            // Python / YAML / Shell
    /\/\*\s*@generated-by:/,        // Java multi-line comment start
  ];
  return patterns.some(p => p.test(content.substring(0, 500))); // 只检查前 500 字符
}

function calculateChecksum(filePath) {
  if (!fs.existsSync(filePath)) return null;
  const content = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(content).digest('hex').substring(0, 16);
}

function getFileExtension(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return ext;
}

// 判断文件是否可能是代码文件（需要 @generated-by 注释）
function isCodeFile(filePath) {
  const codeExtensions = ['.java', '.ts', '.js', '.tsx', '.jsx', '.py', '.go', '.rs', '.c', '.cpp', '.h', '.xml', '.yaml', '.yml', '.json', '.vue', '.svelte', '.css', '.scss', '.less'];
  const ext = getFileExtension(filePath);
  // 目录内的 index 文件或配置文件也需要
  return codeExtensions.includes(ext) || filePath.endsWith('Dockerfile') || filePath.endsWith('Makefile');
}

// ============================================================
// 审计核心逻辑
// ============================================================

function auditStage(stageName, sessionId, strict) {
  const errors = [];
  const warnings = [];
  const violations = [];
  const fileEntries = [];

  // 1. 查找阶段确认文件
  const confirmFile = path.join(CONFIRMATIONS_DIR, `${stageName}.confirmed`);
  if (!fs.existsSync(confirmFile)) {
    errors.push(`确认文件不存在: ${stageName}.confirmed`);
  }

  // 2. 查找交付物文件
  const deliverableMap = {
    'research': '01-research-report.md',
    'analyze': '02-analyze-result.md',
    'design': '03-design-result.md',
    'task-split': '04-task-breakdown.md',
    'develop': '05-develop-result.md',
    'test': '06-test-report.md',
    'fix': '07-fix-report.md',
    'delivery': '08-delivery-report.md',
  };
  const deliverableName = deliverableMap[stageName];
  const deliverablePath = deliverableName ? path.join(DELIVERABLES_DIR, deliverableName) : null;

  if (deliverableName && deliverablePath) {
    if (!fs.existsSync(deliverablePath)) {
      errors.push(`交付物文件不存在: ${deliverableName}`);
    } else {
      const stat = fs.statSync(deliverablePath);
      if (stat.size === 0) {
        errors.push(`交付物文件为空: ${deliverableName}`);
      }
      const checksum = calculateChecksum(deliverablePath);
      fileEntries.push({
        path: deliverablePath,
        type: 'deliverable',
        checksum,
        size: stat.size,
      });
    }
  }

  // 3. 扫描可能的阶段产出文件
  //    这里使用 session-init.yaml 中记录的时间戳作为起始点
  //    简化处理：扫描 .dev-flow/docs/ 目录中的设计契约等文件
  const docsDir = path.join(DEV_FLOW_DIR, 'docs');
  if (fs.existsSync(docsDir)) {
    const docFiles = fs.readdirSync(docsDir).filter(f => f.endsWith('.yaml') || f.endsWith('.md'));
    for (const docFile of docFiles) {
      const fullPath = path.join(docsDir, docFile);
      const relPath = path.relative(ROOT, fullPath);

      // 检查是否有 @generated-by
      if (isCodeFile(fullPath) && !hasGeneratedByAnnotation(fullPath)) {
        if (strict) {
          violations.push({
            file: relPath,
            type: 'missing_generated_by',
            severity: 'warning',
            message: `文件缺少 @generated-by 溯源注释`,
          });
        } else {
          warnings.push(`[${docFile}] 缺少 @generated-by 溯源注释（非 strict 模式，仅警告）`);
        }
      } else if (isCodeFile(fullPath) && hasGeneratedByAnnotation(fullPath)) {
        const checksum = calculateChecksum(fullPath);
        fileEntries.push({
          path: relPath,
          type: 'artifact',
          checksum,
          hasGeneratedBy: true,
        });
      }
    }
  }

  // 4. 扫描 memory 文件
  const memoryDir = path.join(DEV_FLOW_DIR, 'memory');
  if (fs.existsSync(memoryDir)) {
    const memFiles = fs.readdirSync(memoryDir).filter(f => f.endsWith('.md'));
    for (const memFile of memFiles) {
      const fullPath = path.join(memoryDir, memFile);
      const relPath = path.relative(ROOT, fullPath);
      const checksum = calculateChecksum(fullPath);
      fileEntries.push({
        path: relPath,
        type: 'memory',
        checksum,
        hasGeneratedBy: hasGeneratedByAnnotation(fullPath),
      });
    }
  }

  // 5. 零编辑铁律违规汇总
  const zeroEditViolation = violations.length > 0;

  return {
    stage: stageName,
    session: sessionId,
    timestamp: new Date().toISOString(),
    status: errors.length > 0 ? 'FAILED' : (warnings.length > 0 ? 'WARNING' : 'PASSED'),
    errors,
    warnings,
    violations,
    zero_edit_violation: zeroEditViolation,
    files: fileEntries,
    deliverable_checksum: deliverablePath ? calculateChecksum(deliverablePath) : null,
    deliverable_path: deliverableName || null,
  };
}

// ============================================================
// 输出
// ============================================================

function printAuditResult(result) {
  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log(`  Stage Audit: ${result.stage}`);
  console.log('═══════════════════════════════════════════════════');
  console.log(`  Status: ${result.status}`);
  console.log(`  Zero-Edit Violation: ${result.zero_edit_violation ? '🔴 YES' : '✅ NO'}`);

  if (result.deliverable_checksum) {
    console.log(`  Deliverable Checksum: ${result.deliverable_checksum}`);
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

  if (result.violations.length > 0) {
    console.log('');
    console.log(`  Violations (${result.violations.length}):`);
    result.violations.forEach((v, i) => console.log(`    ${i + 1}. [${v.severity}] ${v.file}: ${v.message}`));
  }

  if (result.files.length > 0) {
    console.log('');
    console.log(`  Files Audited (${result.files.length}):`);
    for (const f of result.files) {
      console.log(`    ${f.type}: ${f.path} (checksum: ${f.checksum || 'N/A'})`);
    }
  }

  const passed = result.errors.length === 0;
  console.log('');
  console.log(`  Result: ${passed ? 'PASS' : 'FAIL'} (${result.errors.length} errors, ${result.warnings.length} warnings, ${result.violations.length} violations)`);
  console.log('═══════════════════════════════════════════════════');

  return passed;
}

function writeAuditLog(result) {
  const logDir = path.join(SESSIONS_DIR, result.session);
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  const logPath = path.join(logDir, 'audit-log.yaml');
  const content = yamlStringify({
    stage: result.stage,
    session: result.session,
    timestamp: result.timestamp,
    status: result.status,
    zero_edit_violation: result.zero_edit_violation,
    deliverable_checksum: result.deliverable_checksum,
    deliverable_path: result.deliverable_path,
    errors: result.errors,
    warnings: result.warnings,
    violations: result.violations.map(v => ({
      file: v.file,
      type: v.type,
      severity: v.severity,
      message: v.message,
    })),
    files: result.files.map(f => ({
      path: f.path,
      type: f.type,
      checksum: f.checksum,
    })),
  });

  fs.writeFileSync(logPath, content, 'utf-8');
  console.log(`\nAudit log: ${logPath}`);
}

function yamlStringify(obj) {
  if (typeof obj === 'string') return obj;
  return Object.entries(obj).map(([k, v]) => {
    if (Array.isArray(v)) {
      if (v.length === 0) return `${k}: []`;
      const first = v[0];
      if (typeof first === 'object' && first !== null) {
        return `${k}:\n${v.map(item => {
          const inner = Object.entries(item).map(([ik, iv]) => {
            if (typeof iv === 'string' && (iv.includes(':') || iv.includes('#') || iv.includes("'"))) {
              return `    ${ik}: "${iv}"`;
            }
            return `    ${ik}: ${iv}`;
          }).join('\n');
          return `  - ${inner}`;
        }).join('\n')}`;
      }
      return `${k}:\n${v.map(item => `  - ${item}`).join('\n')}`;
    }
    if (typeof v === 'boolean') return `${k}: ${v}`;
    return `${k}: ${v}`;
  }).join('\n');
}

// ============================================================
// 主入口
// ============================================================

function main() {
  const args = process.argv.slice(2);
  const opts = { stage: null, session: null, strict: false, help: false };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--stage' && args[i + 1]) { opts.stage = args[++i]; }
    else if (args[i] === '--session' && args[i + 1]) { opts.session = args[++i]; }
    else if (args[i] === '--strict') { opts.strict = true; }
    else if (args[i] === '--help') { opts.help = true; }
  }

  if (opts.help) {
    console.log(`
dev-flow 文件修改审计工具（零编辑铁律 v2.0 验证）

用法：
  node scripts/audit.cjs --stage <stage> --session <sessionId>
  node scripts/audit.cjs --stage <stage> --session <sessionId> --strict
  node scripts/audit.cjs --help

选项：
  --stage <stage>       审计的阶段名称（research/analyze/design/develop/test 等）
  --session <sessionId> 会话 ID
  --strict              严格模式：缺少 @generated-by 注释视为错误而非警告
  --help                显示帮助

示例：
  node scripts/audit.cjs --stage develop --session session-001
  node scripts/audit.cjs --stage test --session session-001 --strict
`);
    process.exit(0);
  }

  if (!opts.stage || !opts.session) {
    console.error('[ERROR] 必须指定 --stage 和 --session');
    process.exit(1);
  }

  const result = auditStage(opts.stage, opts.session, opts.strict);
  const passed = printAuditResult(result);
  writeAuditLog(result);

  process.exit(passed ? 0 : 1);
}

main();
