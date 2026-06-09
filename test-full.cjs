#!/usr/bin/env node

/**
 * dev-flow 全场景全工具全流程测试脚本
 * 
 * 测试范围：
 *   1. 新增文件完整性验证
 *   2. 修改文件增量内容验证
 *   3. 构建系统验证
 *   4. 跨平台一致性验证
 *   5. 脚本功能验证
 *   6. 降级兼容性验证
 *   7. 契约格式验证
 *   8. 模板完整性验证
 *   9. Agent 定义合规性验证
 *  10. Reference 交叉引用验证
 *  11. 原有功能不受影响验证
 *  12. validate-runtime.cjs 端到端验证
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ─── 配置 ───
const PROJECT_ROOT = 'D:\\project\\dev-flow';
const CORE_DIR = path.join(PROJECT_ROOT, 'skill-templates', '_core');
const PLATFORMS = ['trae', 'cursor', 'claude', 'qoder'];
const PLATFORM_FILE_MAP = { trae: 'SKILL.md', cursor: 'dev-flow.md', claude: 'dev-flow.md', qoder: 'dev-flow.md' };

// ─── 测试结果收集 ───
const results = {
  total: 0,
  passed: 0,
  failed: 0,
  warnings: 0,
  details: []
};

function assert(condition, category, testName, detail) {
  results.total++;
  if (condition) {
    results.passed++;
    results.details.push({ status: 'PASS', category, test: testName, detail: detail || '' });
  } else {
    results.failed++;
    results.details.push({ status: 'FAIL', category, test: testName, detail: detail || '' });
  }
}

function readFile(relPath) {
  const absPath = path.join(PROJECT_ROOT, relPath);
  if (!fs.existsSync(absPath)) return null;
  return fs.readFileSync(absPath, 'utf-8');
}

// ═══════════════════════════════════════════════════════════════
// 测试套件 1：新增文件完整性验证
// ═══════════════════════════════════════════════════════════════
function testNewFiles() {
  const category = '1.新增文件完整性';
  
  // 1.1 产品需求模板
  const tmpl = readFile('templates/prd/product-requirement-template.md');
  assert(tmpl !== null, category, 'product-requirement-template.md 存在');
  if (tmpl) {
    ['业务背景', '功能描述', '页面交互', '数据要求', '特殊要求', '验收标准'].forEach(s => {
      assert(tmpl.includes(s), category, '模板包含章节: ' + s);
    });
    assert(tmpl.includes('必填'), category, '模板标注必填');
    assert(tmpl.includes('建议'), category, '模板标注建议');
    assert(tmpl.includes('v1.0'), category, '模板包含版本号');
  }

  // 1.2 e2e-ui-tester Agent
  const uiTester = readFile('skill-templates/_core/agents/e2e-ui-tester.md');
  assert(uiTester !== null, category, 'e2e-ui-tester.md 存在');
  if (uiTester) {
    assert(uiTester.includes('name: e2e-ui-tester'), category, 'e2e-ui-tester frontmatter name');
    assert(uiTester.includes('description:'), category, 'e2e-ui-tester frontmatter description');
    assert(uiTester.includes('tools:'), category, 'e2e-ui-tester frontmatter tools');
    assert(uiTester.includes('核心职责'), category, 'e2e-ui-tester 核心职责');
    assert(uiTester.includes('输入'), category, 'e2e-ui-tester 输入定义');
    assert(uiTester.includes('输出'), category, 'e2e-ui-tester 输出定义');
    assert(uiTester.includes('Step 1'), category, 'e2e-ui-tester 执行流程');
    assert(uiTester.includes('agent-browser'), category, 'e2e-ui-tester 引用 agent-browser');
    assert(uiTester.includes('Playwright'), category, 'e2e-ui-tester Playwright 降级');
    assert(uiTester.includes('精准加载'), category, 'e2e-ui-tester 精准加载策略');
    assert(uiTester.includes('ui_steps'), category, 'e2e-ui-tester 引用 ui_steps');
    assert(uiTester.includes('ui_selectors'), category, 'e2e-ui-tester 引用 ui_selectors');
    assert(uiTester.includes('screenshots'), category, 'e2e-ui-tester 截图存证');
    assert(uiTester.includes('降级'), category, 'e2e-ui-tester 降级策略');
  }

  // 1.3 service-orchestrator Agent
  const svcOrch = readFile('skill-templates/_core/agents/service-orchestrator.md');
  assert(svcOrch !== null, category, 'service-orchestrator.md 存在');
  if (svcOrch) {
    assert(svcOrch.includes('name: service-orchestrator'), category, 'service-orchestrator frontmatter name');
    assert(svcOrch.includes('tools:'), category, 'service-orchestrator frontmatter tools');
    assert(svcOrch.includes('核心职责'), category, 'service-orchestrator 核心职责');
    assert(svcOrch.includes('Phase 1'), category, 'service-orchestrator Phase 1');
    assert(svcOrch.includes('Phase 2'), category, 'service-orchestrator Phase 2');
    assert(svcOrch.includes('Phase 3'), category, 'service-orchestrator Phase 3');
    assert(svcOrch.includes('Phase 4'), category, 'service-orchestrator Phase 4');
    assert(svcOrch.includes('健康检查'), category, 'service-orchestrator 健康检查');
    assert(svcOrch.includes('startup-report'), category, 'service-orchestrator 输出 startup-report');
    assert(svcOrch.includes('精准加载'), category, 'service-orchestrator 精准加载策略');
    assert(svcOrch.includes('runtime-contract'), category, 'service-orchestrator 引用 runtime-contract');
    assert(svcOrch.includes('错误处理'), category, 'service-orchestrator 错误处理');
  }

  // 1.4 db-verifier Agent
  const dbVer = readFile('skill-templates/_core/agents/db-verifier.md');
  assert(dbVer !== null, category, 'db-verifier.md 存在');
  if (dbVer) {
    assert(dbVer.includes('name: db-verifier'), category, 'db-verifier frontmatter name');
    assert(dbVer.includes('tools:'), category, 'db-verifier frontmatter tools');
    assert(dbVer.includes('核心职责'), category, 'db-verifier 核心职责');
    assert(dbVer.includes('Step 1'), category, 'db-verifier 执行流程');
    assert(dbVer.includes('db_assert'), category, 'db-verifier 引用 db_assert');
    assert(dbVer.includes('expected_rows'), category, 'db-verifier 引用 expected_rows');
    assert(dbVer.includes('expected_values'), category, 'db-verifier 引用 expected_values');
    assert(dbVer.includes('db-assertions-report'), category, 'db-verifier 输出 db-assertions-report');
    assert(dbVer.includes('精准加载'), category, 'db-verifier 精准加载策略');
    assert(dbVer.includes('数据清理'), category, 'db-verifier 数据清理策略');
  }

  // 1.5 runtime-protocol Reference
  const rtProto = readFile('skill-templates/_core/references/runtime-protocol.md');
  assert(rtProto !== null, category, 'runtime-protocol.md 存在');
  if (rtProto) {
    assert(rtProto.includes('type: reference'), category, 'runtime-protocol frontmatter type');
    ['运行时契约格式', '测试用例契约格式', '验证证据目录结构', '追溯矩阵回写协议', '降级策略', '与现有协议的关系'].forEach(s => {
      assert(rtProto.includes(s), category, 'runtime-protocol 包含章节: ' + s);
    });
    assert(rtProto.includes('runtime-contract.yaml'), category, 'runtime-protocol 包含 runtime-contract 格式');
    assert(rtProto.includes('test-case-contract.yaml'), category, 'runtime-protocol 包含 test-case-contract 格式');
    assert(rtProto.includes('verified'), category, 'runtime-protocol 包含 verified 状态');
    assert(rtProto.includes('tested_with_failures'), category, 'runtime-protocol 包含 tested_with_failures 状态');
    assert(rtProto.includes('db_assert'), category, 'runtime-protocol 包含 db_assert');
    assert(rtProto.includes('ui_steps'), category, 'runtime-protocol 包含 ui_steps');
    assert(rtProto.includes('ui_selectors'), category, 'runtime-protocol 包含 ui_selectors');
  }

  // 1.6 validate-runtime.cjs
  const valRt = readFile('scripts/validate-runtime.cjs');
  assert(valRt !== null, category, 'validate-runtime.cjs 存在');
  if (valRt) {
    assert(valRt.includes('runtime-contract'), category, 'validate-runtime.cjs 校验 runtime-contract');
    assert(valRt.includes('test-case-contract'), category, 'validate-runtime.cjs 校验 test-case-contract');
    assert(valRt.includes('demand-draft'), category, 'validate-runtime.cjs 校验 demand-draft');
    assert(valRt.includes('--demand'), category, 'validate-runtime.cjs 支持 --demand 参数');
    assert(valRt.includes('降级'), category, 'validate-runtime.cjs 降级模式');
  }
}

// ═══════════════════════════════════════════════════════════════
// 测试套件 2：修改文件增量内容验证
// ═══════════════════════════════════════════════════════════════
function testModifiedFiles() {
  const category = '2.修改文件增量';

  const analyze = readFile('skill-templates/_core/stages/analyze.md');
  assert(analyze !== null, category, 'analyze.md 存在');
  if (analyze) {
    assert(analyze.includes('Step 0.5'), category, 'analyze.md Step 0.5');
    assert(analyze.includes('输入源识别与解析'), category, 'analyze.md 输入源识别');
    assert(analyze.includes('文件路径'), category, 'analyze.md 文件路径输入');
    assert(analyze.includes('产品需求模板'), category, 'analyze.md 产品需求模板输入');
    assert(analyze.includes('demand-draft.yaml'), category, 'analyze.md demand-draft 输出');
    assert(analyze.includes('Step 4.3'), category, 'analyze.md Step 4.3');
    assert(analyze.includes('test-case-contract.yaml'), category, 'analyze.md test-case-contract');
    assert(analyze.includes('Step 4.4'), category, 'analyze.md Step 4.4');
    assert(analyze.includes('runtime-contract.yaml'), category, 'analyze.md runtime-contract');
    assert(analyze.includes('降级兼容'), category, 'analyze.md 降级兼容');
    assert(analyze.includes('测试用例契约'), category, 'analyze.md 确认清单: 测试用例契约');
    assert(analyze.includes('运行时契约'), category, 'analyze.md 确认清单: 运行时契约');
    assert(analyze.includes('产品输入解析'), category, 'analyze.md 确认清单: 产品输入解析');
  }

  const test = readFile('skill-templates/_core/stages/test.md');
  assert(test !== null, category, 'test.md 存在');
  if (test) {
    assert(test.includes('test-case-contract.yaml'), category, 'test.md 读取 test-case-contract');
    assert(test.includes('runtime-contract.yaml'), category, 'test.md 读取 runtime-contract');
    assert(test.includes('prd-contract.yaml'), category, 'test.md 读取 prd-contract');
    assert(test.includes('design-contract.yaml'), category, 'test.md 读取 design-contract');
    assert(test.includes('Step 4.4.1'), category, 'test.md Step 4.4.1 服务编排');
    assert(test.includes('service-orchestrator'), category, 'test.md 引用 service-orchestrator');
    assert(test.includes('Step 4.4.2'), category, 'test.md Step 4.4.2 DB核对');
    assert(test.includes('db_assert'), category, 'test.md 引用 db_assert');
    assert(test.includes('db-verifier'), category, 'test.md 引用 db-verifier');
    assert(test.includes('Step 5.5'), category, 'test.md Step 5.5 UI验证');
    assert(test.includes('e2e-ui-tester'), category, 'test.md 引用 e2e-ui-tester');
    assert(test.includes('agent-browser'), category, 'test.md 引用 agent-browser');
    assert(test.includes('Step 5.6'), category, 'test.md Step 5.6 追溯矩阵');
    assert(test.includes('verified'), category, 'test.md verified 状态');
    assert(test.includes('tested_with_failures'), category, 'test.md tested_with_failures 状态');
    assert(test.includes('DB 数据核对结果'), category, 'test.md 测试报告: DB核对');
    assert(test.includes('UI 层验证结果'), category, 'test.md 测试报告: UI验证');
    assert(test.includes('验证追溯矩阵'), category, 'test.md 测试报告: 追溯矩阵');
    assert(test.includes('DB 数据核对'), category, 'test.md 确认清单: DB核对');
    assert(test.includes('UI 层验证'), category, 'test.md 确认清单: UI验证');
    assert(test.includes('追溯矩阵'), category, 'test.md 确认清单: 追溯矩阵');
    assert(test.includes('验证证据'), category, 'test.md 确认清单: 验证证据');
  }

  const design = readFile('skill-templates/_core/stages/design.md');
  assert(design !== null, category, 'design.md 存在');
  if (design) {
    assert(design.includes('Step 2.5'), category, 'design.md Step 2.5');
    assert(design.includes('ui_selectors'), category, 'design.md ui_selectors');
    assert(design.includes('data-testid'), category, 'design.md data-testid');
    assert(design.includes('选择器优先级'), category, 'design.md 选择器优先级');
    assert(design.includes('runtime-protocol'), category, 'design.md 引用 runtime-protocol');
  }

  const dev = readFile('skill-templates/_core/agents/develop-expert.md');
  assert(dev !== null, category, 'develop-expert.md 存在');
  if (dev) {
    assert(dev.includes('data-testid'), category, 'develop-expert.md data-testid');
    assert(dev.includes('前端组件 data-testid'), category, 'develop-expert.md data-testid 章节');
    assert(dev.includes('create-user'), category, 'develop-expert.md 按钮命名示例');
    assert(dev.includes('input-username'), category, 'develop-expert.md 输入框命名示例');
    assert(dev.includes('modal-create-user'), category, 'develop-expert.md 弹窗命名示例');
    assert(dev.includes('data-testid="create-user"'), category, 'develop-expert.md Vue示例');
    assert(dev.includes('React'), category, 'develop-expert.md React示例');
  }

  const skill = readFile('skill-templates/_core/SKILL.md');
  assert(skill !== null, category, 'SKILL.md 存在');
  if (skill) {
    assert(skill.includes('-e2e'), category, 'SKILL.md -e2e 命令');
    assert(skill.includes('-e2e-ui'), category, 'SKILL.md -e2e-ui 命令');
    assert(skill.includes('-e2e-api'), category, 'SKILL.md -e2e-api 命令');
    assert(skill.includes('-verify'), category, 'SKILL.md -verify 命令');
    assert(skill.includes('service-orchestrator'), category, 'SKILL.md service-orchestrator');
    assert(skill.includes('db-verifier'), category, 'SKILL.md db-verifier');
    assert(skill.includes('e2e-ui-tester'), category, 'SKILL.md e2e-ui-tester');
  }

  const protocol = readFile('skill-templates/_core/references/protocol.md');
  assert(protocol !== null, category, 'protocol.md 存在');
  if (protocol) {
    assert(protocol.includes('test-case-contract.yaml'), category, 'protocol.md test-case-contract');
    assert(protocol.includes('runtime-contract.yaml'), category, 'protocol.md runtime-contract');
    assert(protocol.includes('demand-draft.yaml'), category, 'protocol.md demand-draft');
    assert(protocol.includes('evidence'), category, 'protocol.md evidence 目录');
    assert(protocol.includes('screenshots'), category, 'protocol.md screenshots 目录');
  }

  const tp = readFile('skill-templates/_core/agents/task-protocol.md');
  assert(tp !== null, category, 'task-protocol.md 存在');
  if (tp) {
    assert(tp.includes('service-orchestrate'), category, 'task-protocol.md service-orchestrate');
    assert(tp.includes('e2e-ui-test'), category, 'task-protocol.md e2e-ui-test');
    assert(tp.includes('db-verify'), category, 'task-protocol.md db-verify');
    assert(tp.includes('verified'), category, 'task-protocol.md verified');
    assert(tp.includes('tested_with_failures'), category, 'task-protocol.md tested_with_failures');
  }
}

// ═══════════════════════════════════════════════════════════════
// 测试套件 3：构建系统验证
// ═══════════════════════════════════════════════════════════════
function testBuildSystem() {
  const category = '3.构建系统';
  try {
    execSync('node scripts/build.cjs', { cwd: PROJECT_ROOT, stdio: 'pipe' });
    assert(true, category, '构建执行成功');
  } catch (e) {
    assert(false, category, '构建执行成功', e.message);
    return;
  }
  PLATFORMS.forEach(p => {
    const pDir = path.join(PROJECT_ROOT, 'skill-templates', p);
    assert(fs.existsSync(pDir), category, p + ' 平台目录存在');
    assert(fs.existsSync(path.join(pDir, PLATFORM_FILE_MAP[p])), category, p + ' Router 文件存在');
    assert(fs.existsSync(path.join(pDir, 'agents')), category, p + ' agents 目录存在');
    assert(fs.existsSync(path.join(pDir, 'references')), category, p + ' references 目录存在');
    assert(fs.existsSync(path.join(pDir, 'stages')), category, p + ' stages 目录存在');
  });
}

// ═══════════════════════════════════════════════════════════════
// 测试套件 4：跨平台一致性验证
// ═══════════════════════════════════════════════════════════════
function testCrossPlatform() {
  const category = '4.跨平台一致性';
  PLATFORMS.forEach(p => {
    const pDir = path.join(PROJECT_ROOT, 'skill-templates', p);
    const agents = fs.readdirSync(path.join(pDir, 'agents')).filter(f => f.endsWith('.md'));
    const coreAgents = fs.readdirSync(path.join(CORE_DIR, 'agents')).filter(f => f.endsWith('.md'));
    coreAgents.forEach(ca => {
      assert(agents.includes(ca), category, p + ' 包含 Agent: ' + ca);
    });
    const refs = fs.readdirSync(path.join(pDir, 'references')).filter(f => f.endsWith('.md'));
    const coreRefs = fs.readdirSync(path.join(CORE_DIR, 'references')).filter(f => f.endsWith('.md'));
    coreRefs.forEach(cr => {
      assert(refs.includes(cr), category, p + ' 包含 Reference: ' + cr);
    });
    const stages = fs.readdirSync(path.join(pDir, 'stages')).filter(f => f.endsWith('.md'));
    const coreStages = fs.readdirSync(path.join(CORE_DIR, 'stages')).filter(f => f.endsWith('.md'));
    coreStages.forEach(cs => {
      assert(stages.includes(cs), category, p + ' 包含 Stage: ' + cs);
    });
    const skillContent = fs.readFileSync(path.join(pDir, PLATFORM_FILE_MAP[p]), 'utf-8');
    assert(skillContent.includes('-e2e'), category, p + ' Router -e2e 命令');
    assert(skillContent.includes('-verify'), category, p + ' Router -verify 命令');
    assert(skillContent.includes('service-orchestrator'), category, p + ' Router service-orchestrator');
    assert(skillContent.includes('db-verifier'), category, p + ' Router db-verifier');
    assert(skillContent.includes('e2e-ui-tester'), category, p + ' Router e2e-ui-tester');
    ['analyze.md', 'test.md', 'design.md'].forEach(sf => {
      const sc = fs.readFileSync(path.join(pDir, 'stages', sf), 'utf-8');
      assert(sc.includes('runtime-protocol'), category, p + '/stages/' + sf + ' 引用 runtime-protocol');
    });
  });
}

// ═══════════════════════════════════════════════════════════════
// 测试套件 5：脚本功能验证
// ═══════════════════════════════════════════════════════════════
function testScripts() {
  const category = '5.脚本功能';
  const pc = readFile('scripts/prepare-context.cjs');
  assert(pc !== null, category, 'prepare-context.cjs 存在');
  if (pc) {
    assert(pc.includes('service-orchestrator'), category, 'prepare-context.cjs service-orchestrator');
    assert(pc.includes('db-verifier'), category, 'prepare-context.cjs db-verifier');
    assert(pc.includes('e2e-ui-tester'), category, 'prepare-context.cjs e2e-ui-tester');
    assert(pc.includes('AGENT_CONTEXT_MAP') || pc.includes('AGENT_TYPES'), category, 'prepare-context.cjs Agent映射');
  }
  const vr = readFile('scripts/validate-result.cjs');
  assert(vr !== null, category, 'validate-result.cjs 存在');
  if (vr) {
    assert(vr.includes('test-case-contract'), category, 'validate-result.cjs test-case-contract');
    assert(vr.includes('runtime-contract'), category, 'validate-result.cjs runtime-contract');
    assert(vr.includes('demand-draft'), category, 'validate-result.cjs demand-draft');
    assert(vr.includes('CONTRACT_FILES'), category, 'validate-result.cjs CONTRACT_FILES');
  }
  try {
    execSync('node -c scripts/validate-runtime.cjs', { cwd: PROJECT_ROOT, stdio: 'pipe' });
    assert(true, category, 'validate-runtime.cjs 语法正确');
  } catch (e) {
    assert(false, category, 'validate-runtime.cjs 语法正确', e.message);
  }
  const build = readFile('scripts/build.cjs');
  assert(build !== null, category, 'build.cjs 存在');
  if (build) {
    assert(build.includes('readdirSync'), category, 'build.cjs 动态文件发现');
    assert(!build.includes('e2e-ui-tester'), category, 'build.cjs 未硬编码新Agent');
  }
}

// ═══════════════════════════════════════════════════════════════
// 测试套件 6：降级兼容性验证
// ═══════════════════════════════════════════════════════════════
function testDegradation() {
  const category = '6.降级兼容性';
  const skill = readFile('skill-templates/_core/SKILL.md');
  if (skill) {
    ['/dev-flow <需求描述>', '/dev-flow -fix', '/dev-flow -hotfix', '/dev-flow --resume'].forEach(cmd => {
      assert(skill.includes(cmd), category, '原有命令保留: ' + cmd);
    });
  }
  const analyze = readFile('skill-templates/_core/stages/analyze.md');
  if (analyze) { assert(analyze.includes('降级兼容'), category, 'analyze.md 降级兼容'); }
  const test = readFile('skill-templates/_core/stages/test.md');
  if (test) {
    ['降级', '跳过', 'Playwright 脚本'].forEach(kw => {
      assert(test.includes(kw), category, 'test.md 降级关键词: ' + kw);
    });
  }
  const design = readFile('skill-templates/_core/stages/design.md');
  if (design) { assert(design.includes('降级兼容'), category, 'design.md 降级兼容'); }
  const rtProto = readFile('skill-templates/_core/references/runtime-protocol.md');
  if (rtProto) {
    ['agent-browser 不可用', 'runtime-contract.yaml 不存在', 'test-case-contract.yaml 不存在', '数据库不可连接', '前端项目不存在'].forEach(s => {
      assert(rtProto.includes(s), category, 'runtime-protocol 降级场景: ' + s);
    });
  }
}

// ═══════════════════════════════════════════════════════════════
// 测试套件 7：契约格式验证
// ═══════════════════════════════════════════════════════════════
function testContractFormats() {
  const category = '7.契约格式';
  const rtProto = readFile('skill-templates/_core/references/runtime-protocol.md');
  if (!rtProto) return;
  ['infrastructure:', 'services:', 'frontend:', 'startup_sequence:', 'cleanup:', 'health_check:', 'phase_1_infrastructure', 'phase_2_backend', 'phase_3_frontend'].forEach(f => {
    assert(rtProto.includes(f), category, 'runtime-contract 格式: ' + f);
  });
  ['meta:', 'config:', 'test_suites:', 'traceability:', 'suite_id:', 'case_id:', 'preconditions:', 'steps:', 'api:', 'ui:', 'db:'].forEach(f => {
    assert(rtProto.includes(f), category, 'test-case-contract 格式: ' + f);
  });
  ['table:', 'conditions:', 'expected_rows:', 'expected_values:'].forEach(f => {
    assert(rtProto.includes(f), category, 'db_assert 格式: ' + f);
  });
  ['navigate', 'click', 'fill', 'select', 'wait_for', 'assert_visible', 'assert_table_contains', 'db_verify'].forEach(a => {
    assert(rtProto.includes(a), category, 'ui_steps action: ' + a);
  });
}

// ═══════════════════════════════════════════════════════════════
// 测试套件 8：模板完整性验证
// ═══════════════════════════════════════════════════════════════
function testTemplateCompleteness() {
  const category = '8.模板完整性';
  const tmpl = readFile('templates/prd/product-requirement-template.md');
  if (!tmpl) return;
  ['一、业务背景', '二、功能描述', '三、页面交互', '四、数据要求', '五、特殊要求', '六、验收标准'].forEach(s => {
    assert(tmpl.includes(s), category, '模板章节: ' + s);
  });
  ['需求标题', '业务痛点', '目标用户', '优先级', '用户故事', '正常流程', '异常情况', '业务规则', '字段名称', '权限控制', '验收场景'].forEach(f => {
    assert(tmpl.includes(f), category, '模板字段: ' + f);
  });
  assert(tmpl.includes('填写说明'), category, '模板填写说明');
  assert(tmpl.includes('v1.0'), category, '模板版本号');
}

// ═══════════════════════════════════════════════════════════════
// 测试套件 9：Agent 定义合规性验证
// ═══════════════════════════════════════════════════════════════
function testAgentCompliance() {
  const category = '9.Agent合规性';
  ['e2e-ui-tester.md', 'service-orchestrator.md', 'db-verifier.md'].forEach(agentFile => {
    const content = readFile('skill-templates/_core/agents/' + agentFile);
    if (!content) return;
    assert(content.startsWith('---'), category, agentFile + ' frontmatter 开始');
    const end = content.indexOf('---', 3);
    assert(end > 0, category, agentFile + ' frontmatter 结束');
    const fm = content.substring(0, end);
    assert(fm.includes('name:'), category, agentFile + ' name 字段');
    assert(fm.includes('description:'), category, agentFile + ' description 字段');
    assert(fm.includes('tools:'), category, agentFile + ' tools 字段');
    assert(fm.includes('model:'), category, agentFile + ' model 字段');
    assert(content.includes('核心职责'), category, agentFile + ' 核心职责');
    assert(content.includes('输入'), category, agentFile + ' 输入定义');
    assert(content.includes('输出'), category, agentFile + ' 输出定义');
    assert(content.includes('精准加载'), category, agentFile + ' 精准加载');
    assert(content.includes('必读文件'), category, agentFile + ' 必读文件');
    // H1 标题检查（排除代码块内的 # 注释行）
    const lines = content.split('\n');
    let inCodeBlock = false;
    let h1Count = 0;
    lines.forEach(line => {
      if (line.startsWith('```')) inCodeBlock = !inCodeBlock;
      if (!inCodeBlock && line.startsWith('# ') && !line.startsWith('## ')) h1Count++;
    });
    assert(h1Count === 1, category, agentFile + ' 仅一个 H1 标题');
  });
}

// ═══════════════════════════════════════════════════════════════
// 测试套件 10：交叉引用验证
// ═══════════════════════════════════════════════════════════════
function testCrossReferences() {
  const category = '10.交叉引用';
  const e2eUiTester = readFile('skill-templates/_core/agents/e2e-ui-tester.md');
  if (e2eUiTester) {
    assert(e2eUiTester.includes('test-case-contract.yaml'), category, 'e2e-ui-tester → test-case-contract');
    assert(e2eUiTester.includes('design-contract.yaml'), category, 'e2e-ui-tester → design-contract');
    assert(e2eUiTester.includes('runtime-contract.yaml'), category, 'e2e-ui-tester → runtime-contract');
  }
  const svcOrch = readFile('skill-templates/_core/agents/service-orchestrator.md');
  if (svcOrch) {
    assert(svcOrch.includes('runtime-contract.yaml'), category, 'service-orchestrator → runtime-contract');
    assert(svcOrch.includes('startup-report.yaml'), category, 'service-orchestrator → startup-report');
  }
  const dbVer = readFile('skill-templates/_core/agents/db-verifier.md');
  if (dbVer) {
    assert(dbVer.includes('test-case-contract.yaml'), category, 'db-verifier → test-case-contract');
    assert(dbVer.includes('runtime-contract.yaml'), category, 'db-verifier → runtime-contract');
  }
  const skill = readFile('skill-templates/_core/SKILL.md');
  if (skill) {
    assert(skill.includes('service-orchestrator'), category, 'SKILL.md → service-orchestrator');
    assert(skill.includes('db-verifier'), category, 'SKILL.md → db-verifier');
    assert(skill.includes('e2e-ui-tester'), category, 'SKILL.md → e2e-ui-tester');
  }
  const readme = readFile('README.md');
  if (readme) {
    assert(readme.includes('23'), category, 'README.md 更新Agent数量');
    assert(readme.includes('runtime-protocol'), category, 'README.md → runtime-protocol');
  }
}

// ═══════════════════════════════════════════════════════════════
// 测试套件 11：原有功能不受影响验证
// ═══════════════════════════════════════════════════════════════
function testOriginalCapabilities() {
  const category = '11.原有功能不受影响';
  const skill = readFile('skill-templates/_core/SKILL.md');
  if (skill) {
    ['Research', 'Analyze', 'Design', 'Task Split', 'Develop', 'Test', 'Fix', 'Delivery'].forEach(s => {
      assert(skill.includes(s), category, '8阶段保留: ' + s);
    });
    assert(skill.includes('零编辑'), category, '主Agent零编辑铁律保留');
  }
  const coreAgents = fs.readdirSync(path.join(CORE_DIR, 'agents')).filter(f => f.endsWith('.md'));
  ['orchestrator.md', 'analyze-expert.md', 'design-expert.md', 'task-split-expert.md', 'develop-expert.md', 'verify-expert.md', 'contract-validator.md', 'context-manager.md', 'runtime-state-manager.md', 'error-pattern-learner.md', 'task-protocol.md'].forEach(oa => {
    assert(coreAgents.includes(oa), category, '原有Agent保留: ' + oa);
  });
  const coreRefs = fs.readdirSync(path.join(CORE_DIR, 'references')).filter(f => f.endsWith('.md'));
  ['protocol.md', 'memory-system.md', 'learning-system.md', 'error-pattern-db.md', 'model-context-config.md'].forEach(or => {
    assert(coreRefs.includes(or), category, '原有Reference保留: ' + or);
  });
  const prdFiles = fs.readdirSync(path.join(PROJECT_ROOT, 'templates', 'prd')).filter(f => f.endsWith('.md'));
  ['PRD-TEMPLATE-NEW.md', 'PRD-TEMPLATE-BUGFIX.md', 'PRD-TEMPLATE-OPTIMIZE.md'].forEach(opt => {
    assert(prdFiles.includes(opt), category, '原有PRD模板保留: ' + opt);
  });
  const scripts = fs.readdirSync(path.join(PROJECT_ROOT, 'scripts')).filter(f => f.endsWith('.cjs'));
  ['build.cjs', 'dispatch.cjs', 'prepare-context.cjs', 'validate-result.cjs', 'segment-code.cjs', 'validate-contract.cjs', 'audit.cjs'].forEach(os => {
    assert(scripts.includes(os), category, '原有脚本保留: ' + os);
  });
  const protocol = readFile('skill-templates/_core/references/protocol.md');
  if (protocol) {
    assert(protocol.includes('门禁'), category, '门禁检查保留');
    assert(protocol.includes('确认持久化'), category, '确认持久化保留');
  }
}

// ═══════════════════════════════════════════════════════════════
// 测试套件 12：validate-runtime.cjs 端到端验证
// ═══════════════════════════════════════════════════════════════
function testValidateRuntimeE2E() {
  const category = '12.validate-runtime E2E';
  const testDir = path.join(PROJECT_ROOT, '.dev-flow', 'contracts', '_test-demand');
  
  // 正常模式
  try {
    if (!fs.existsSync(testDir)) fs.mkdirSync(testDir, { recursive: true });
    fs.writeFileSync(path.join(testDir, 'runtime-contract.yaml'), [
      'meta:', '  prd_contract: test', 'infrastructure:', '  - name: mysql',
      '    type: database', 'services:', '  - name: user-service',
      '    type: java-springboot', '    health_check:',
      '      url: http://localhost:8084/actuator/health', '      method: GET',
      '      expected_status: 200', 'startup_sequence:',
      '  phase_1_infrastructure: {parallel: true, items: [mysql]}',
      '  phase_2_backend: {parallel: false, items: [user-service]}',
      'cleanup: {on_success: stop_all, test_data_cleanup: transaction_rollback}'
    ].join('\n'));
    fs.writeFileSync(path.join(testDir, 'test-case-contract.yaml'), [
      'meta:', '  prd_contract: test', '  total_suites: 1', '  total_cases: 1',
      'config:', '  api: {base_url: "http://localhost:8084"}',
      '  db: {type: mysql, cleanup_strategy: transaction_rollback}',
      'test_suites:', '  - suite_id: TS-001', '    req_id: REQ-001',
      '    cases:', '      - case_id: TC-001-01', '        type: api',
      '        priority: P0', 'traceability:', '  - req_id: REQ-001'
    ].join('\n'));
    const result = execSync('node scripts/validate-runtime.cjs --demand _test-demand', { cwd: PROJECT_ROOT, stdio: 'pipe', encoding: 'utf-8' });
    assert(result.includes('基本校验通过'), category, '正常模式: 校验通过');
  } catch (e) {
    assert(false, category, '正常模式执行', e.message);
  }

  // 降级模式
  try {
    const result = execSync('node scripts/validate-runtime.cjs --demand nonexistent', { cwd: PROJECT_ROOT, stdio: 'pipe', encoding: 'utf-8' });
    assert(result.includes('降级模式'), category, '降级模式: 目录不存在时降级');
  } catch (e) {
    assert(e.stdout && e.stdout.includes('降级模式'), category, '降级模式: 目录不存在时降级');
  }

  // 错误检测
  try {
    fs.writeFileSync(path.join(testDir, 'runtime-contract.yaml'), 'meta:\n  prd_contract: test\n');
    execSync('node scripts/validate-runtime.cjs --demand _test-demand', { cwd: PROJECT_ROOT, stdio: 'pipe', encoding: 'utf-8' });
    assert(false, category, '错误检测: 缺少必填章节时应报错');
  } catch (e) {
    assert(true, category, '错误检测: 缺少必填章节时报错（exit code != 0）');
  }

  // 清理
  try { if (fs.existsSync(testDir)) fs.rmSync(testDir, { recursive: true, force: true }); } catch(e) {}
}

// ═══════════════════════════════════════════════════════════════
// 执行所有测试
// ═══════════════════════════════════════════════════════════════
console.log('╔══════════════════════════════════════════════════════════╗');
console.log('║     dev-flow 全场景全工具全流程测试                      ║');
console.log('╚══════════════════════════════════════════════════════════╝');
console.log('项目根目录: ' + PROJECT_ROOT);
console.log('测试时间: ' + new Date().toISOString() + '\n');

const testSuites = [
  { name: '1.新增文件完整性', fn: testNewFiles },
  { name: '2.修改文件增量', fn: testModifiedFiles },
  { name: '3.构建系统', fn: testBuildSystem },
  { name: '4.跨平台一致性', fn: testCrossPlatform },
  { name: '5.脚本功能', fn: testScripts },
  { name: '6.降级兼容性', fn: testDegradation },
  { name: '7.契约格式', fn: testContractFormats },
  { name: '8.模板完整性', fn: testTemplateCompleteness },
  { name: '9.Agent合规性', fn: testAgentCompliance },
  { name: '10.交叉引用', fn: testCrossReferences },
  { name: '11.原有功能不受影响', fn: testOriginalCapabilities },
  { name: '12.validate-runtime E2E', fn: testValidateRuntimeE2E },
];

testSuites.forEach(suite => {
  console.log('\n>>> 运行: ' + suite.name);
  console.log('─'.repeat(60));
  const bt = results.total, bp = results.passed, bf = results.failed, bw = results.warnings;
  try { suite.fn(); } catch (e) { assert(false, suite.name, '套件执行', e.message); }
  const st = results.total - bt, sp = results.passed - bp, sf = results.failed - bf;
  console.log('=== ' + suite.name + ' 结果: ' + sp + '/' + st + ' 通过, ' + sf + ' 失败 ===');
});

// 输出报告
console.log('\n\n');
console.log('╔══════════════════════════════════════════════════════════╗');
console.log('║                    测试报告                              ║');
console.log('╚══════════════════════════════════════════════════════════╝');
console.log('\n总测试数: ' + results.total);
console.log('通过: ' + results.passed);
console.log('失败: ' + results.failed);
console.log('警告: ' + results.warnings);
console.log('通过率: ' + ((results.passed / results.total) * 100).toFixed(1) + '%');

if (results.failed > 0) {
  console.log('\n❌ 失败项详情:');
  results.details.filter(d => d.status === 'FAIL').forEach((d, i) => {
    console.log('  ' + (i+1) + '. [' + d.category + '] ' + d.test + (d.detail ? ' - ' + d.detail : ''));
  });
}

console.log('\n📊 分类统计:');
const categories = [...new Set(results.details.map(d => d.category))];
categories.forEach(cat => {
  const cd = results.details.filter(d => d.category === cat);
  const cp = cd.filter(d => d.status === 'PASS').length;
  const cf = cd.filter(d => d.status === 'FAIL').length;
  const icon = cf > 0 ? '❌' : '✅';
  console.log('  ' + icon + ' ' + cat + ': ' + cp + '/' + cd.length + ' 通过, ' + cf + ' 失败');
});

console.log('\n' + '='.repeat(60));
if (results.failed === 0) {
  console.log('✅ 全部测试通过！');
} else {
  console.log('❌ 存在 ' + results.failed + ' 个失败项，请检查！');
}

process.exit(results.failed > 0 ? 1 : 0);
