#!/usr/bin/env node

/**
 * validate-runtime.cjs — 运行时契约校验脚本
 *
 * 校验 runtime-contract.yaml 和 test-case-contract.yaml 的完整性和正确性
 * 用法：node scripts/validate-runtime.cjs --demand <需求简称>
 */

const fs = require('fs');
const path = require('path');

// ─── 参数解析 ───
const args = process.argv.slice(2);
let demandName = '';

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--demand' && args[i + 1]) {
    demandName = args[i + 1];
    i++;
  }
}

if (!demandName) {
  console.log('用法: node validate-runtime.cjs --demand <需求简称>');
  process.exit(1);
}

const contractsDir = path.join('.dev-flow', 'contracts', demandName);
const errors = [];
const warnings = [];

// ─── 校验 runtime-contract.yaml ───
function validateRuntimeContract() {
  const filePath = path.join(contractsDir, 'runtime-contract.yaml');

  if (!fs.existsSync(filePath)) {
    warnings.push('runtime-contract.yaml 不存在（降级模式：跳过服务编排）');
    return;
  }

  const content = fs.readFileSync(filePath, 'utf-8');

  // 检查必填章节
  const requiredSections = ['infrastructure:', 'services:', 'startup_sequence:'];
  for (const section of requiredSections) {
    if (!content.includes(section)) {
      errors.push(`runtime-contract.yaml 缺少必填章节: ${section.replace(':', '')}`);
    }
  }

  // 检查服务健康检查配置
  const healthCheckPattern = /health_check:/g;
  const healthCheckCount = (content.match(healthCheckPattern) || []).length;
  const servicePattern = /^  - name:/gm;
  const serviceCount = (content.match(servicePattern) || []).length;

  if (serviceCount > 0 && healthCheckCount < serviceCount) {
    warnings.push(`runtime-contract.yaml: ${serviceCount} 个服务中只有 ${healthCheckCount} 个定义了 health_check`);
  }

  // 检查启动顺序
  if (!content.includes('phase_1_infrastructure') || !content.includes('phase_2_backend')) {
    warnings.push('runtime-contract.yaml: startup_sequence 建议包含 phase_1_infrastructure 和 phase_2_backend');
  }

  // 检查清理策略
  if (!content.includes('cleanup:')) {
    warnings.push('runtime-contract.yaml: 建议定义 cleanup 策略');
  }

  console.log(`✅ runtime-contract.yaml 基本校验通过`);
}

// ─── 校验 test-case-contract.yaml ───
function validateTestCaseContract() {
  const filePath = path.join(contractsDir, 'test-case-contract.yaml');

  if (!fs.existsSync(filePath)) {
    warnings.push('test-case-contract.yaml 不存在（降级模式：使用现有测试逻辑）');
    return;
  }

  const content = fs.readFileSync(filePath, 'utf-8');

  // 检查必填章节
  const requiredSections = ['meta:', 'config:', 'test_suites:', 'traceability:'];
  for (const section of requiredSections) {
    if (!content.includes(section)) {
      errors.push(`test-case-contract.yaml 缺少必填章节: ${section.replace(':', '')}`);
    }
  }

  // 检查测试套件
  const suitePattern = /suite_id:/g;
  const suiteCount = (content.match(suitePattern) || []).length;

  const casePattern = /case_id:/g;
  const caseCount = (content.match(casePattern) || []).length;

  if (suiteCount === 0) {
    errors.push('test-case-contract.yaml: 至少需要一个测试套件');
  }

  if (caseCount === 0) {
    errors.push('test-case-contract.yaml: 至少需要一个测试用例');
  }

  // 检查 API 配置
  if (!content.includes('api:') || !content.includes('base_url:')) {
    warnings.push('test-case-contract.yaml: 建议定义 config.api.base_url');
  }

  // 检查 DB 配置
  if (!content.includes('db:') || !content.includes('cleanup_strategy:')) {
    warnings.push('test-case-contract.yaml: 建议定义 config.db 和 cleanup_strategy');
  }

  // 检查 UI 配置（如有前端项目）
  if (content.includes('type: "ui"') && !content.includes('ui:')) {
    warnings.push('test-case-contract.yaml: 存在 UI 测试用例但未定义 config.ui');
  }

  // 检查 db_assert 覆盖
  const apiCasePattern = /type: "api"/g;
  const apiCaseCount = (content.match(apiCasePattern) || []).length;
  const dbAssertPattern = /db_assert:/g;
  const dbAssertCount = (content.match(dbAssertPattern) || []).length;

  if (apiCaseCount > 0 && dbAssertCount === 0) {
    warnings.push('test-case-contract.yaml: API 测试用例建议包含 db_assert 数据库断言');
  }

  // 检查追溯矩阵
  const reqIdPattern = /req_id: "REQ-/g;
  const reqCount = (content.match(reqIdPattern) || []).length;

  if (reqCount === 0) {
    warnings.push('test-case-contract.yaml: traceability 建议关联 REQ-ID');
  }

  console.log(`✅ test-case-contract.yaml 基本校验通过 (${suiteCount} 套件, ${caseCount} 用例)`);
}

// ─── 校验 demand-draft.yaml（可选）───
function validateDemandDraft() {
  const filePath = path.join(contractsDir, 'demand-draft.yaml');

  if (!fs.existsSync(filePath)) {
    // demand-draft 是可选的，不存在不报错
    return;
  }

  const content = fs.readFileSync(filePath, 'utf-8');

  if (!content.includes('source:') || !content.includes('requirements_draft:')) {
    warnings.push('demand-draft.yaml: 格式不完整，缺少 source 或 requirements_draft 章节');
  } else {
    console.log(`✅ demand-draft.yaml 基本校验通过`);
  }
}

// ─── 执行校验 ───
console.log(`\n🔍 运行时契约校验 — 需求: ${demandName}`);
console.log(`📁 契约目录: ${contractsDir}\n`);

if (!fs.existsSync(contractsDir)) {
  console.log(`⚠️  契约目录不存在，跳过校验（降级模式）`);
  process.exit(0);
}

validateRuntimeContract();
validateTestCaseContract();
validateDemandDraft();

// ─── 输出结果 ───
console.log('\n' + '='.repeat(50));

if (errors.length > 0) {
  console.log(`\n❌ 发现 ${errors.length} 个错误：`);
  errors.forEach((e, i) => console.log(`  ${i + 1}. ${e}`));
}

if (warnings.length > 0) {
  console.log(`\n⚠️  发现 ${warnings.length} 个警告：`);
  warnings.forEach((w, i) => console.log(`  ${i + 1}. ${w}`));
}

if (errors.length === 0 && warnings.length === 0) {
  console.log('\n✅ 所有运行时契约校验通过');
}

console.log('');

process.exit(errors.length > 0 ? 1 : 0);
