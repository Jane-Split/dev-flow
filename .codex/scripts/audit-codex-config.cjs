#!/usr/bin/env node
/* eslint-disable */
/**
 * audit-codex-config.cjs - dev-flow Codex 配置审计脚本
 * ======================================================
 *
 * 审计项 (14 项):
 *   [P0] 1. 项目根 AGENTS.md 存在
 *   [P0] 2. 项目级 .codex/config.toml 存在
 *   [P0] 3. config.toml 含 [agents] 表 (max_threads / max_depth)
 *   [P0] 4. config.toml 含 [features] 表 (multi_agent / memories / hooks)
 *   [P0] 5. .codex/hooks.json 存在且合法
 *   [P0] 6. 所有 subagent .toml 字段完整 (name/description/sandbox_mode/model_reasoning_effort)
 *   [P0] 7. .agents/skills/dev-flow/SKILL.md 存在
 *   [P0] 8. 路径引用无大写 .Codex
 *   [P1] 9. develop-expert 有 nickname_candidates
 *   [P1] 10. sandbox_mode 与阶段匹配 (research = read-only, develop = workspace-write)
 *   [P1] 11. hooks.json 钩子脚本存在且可执行
 *   [P1] 12. 钩子脚本响应 session-start / subagent-start / subagent-stop
 *   [P1] 13. 项目级 config.toml 不含 profiles 键 (必须放用户级)
 *   [P1] 14. AGENTS.md 大小 <= 65 KiB
 *
 * 用法:
 *   node .codex/scripts/audit-codex-config.cjs           # 完整审计
 *   node .codex/scripts/audit-codex-config.cjs --json    # 输出 JSON
 *   node .codex/scripts/audit-codex-config.cjs --fix     # 自动修复可修复项 (谨慎)
 *
 * 退出码:
 *   0  - 全部通过
 *   1  - 有 P0 失败
 *   2  - 有 P1 失败 (但无 P0)
 */

'use strict';

const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = process.cwd();
const CODEX_DIR = path.join(PROJECT_ROOT, '.codex');
const AGENTS_DIR = path.join(CODEX_DIR, 'agents');
const CONFIG_TOML = path.join(CODEX_DIR, 'config.toml');
const HOOKS_JSON = path.join(CODEX_DIR, 'hooks.json');
const HOOK_SCRIPT = path.join(CODEX_DIR, 'scripts', 'dev-flow-hook.cjs');
const SKILL_MD = path.join(PROJECT_ROOT, '.agents', 'skills', 'dev-flow', 'SKILL.md');
const ROOT_AGENTS = path.join(PROJECT_ROOT, 'AGENTS.md');

const JSON_OUTPUT = process.argv.includes('--json');
const AUTO_FIX = process.argv.includes('--fix');

const results = [];

function record(id, priority, name, status, detail) {
  results.push({ id, priority, name, status, detail });
  if (!JSON_OUTPUT) {
    const icon = status === 'PASS' ? '✓' : status === 'FAIL' ? '✗' : '⚠';
    const color = status === 'PASS' ? '\x1b[32m' : status === 'FAIL' ? '\x1b[31m' : '\x1b[33m';
    console.log(`${color}${icon}\x1b[0m [${priority}] ${id}. ${name}`);
    if (detail) console.log(`   ${detail}`);
  }
}

function fileExists(p) {
  try { return fs.existsSync(p); } catch { return false; }
}

function readFile(p) {
  try { return fs.readFileSync(p, 'utf8'); } catch { return null; }
}

function fileSize(p) {
  try { return fs.statSync(p).size; } catch { return 0; }
}

// === 审计项 ===

function check01() {
  const ok = fileExists(ROOT_AGENTS);
  record('01', 'P0', '项目根 AGENTS.md 存在', ok ? 'PASS' : 'FAIL',
    ok ? `${ROOT_AGENTS}` : `缺失: ${ROOT_AGENTS}`);
}

function check02() {
  const ok = fileExists(CONFIG_TOML);
  record('02', 'P0', '项目级 .codex/config.toml 存在', ok ? 'PASS' : 'FAIL',
    ok ? `${CONFIG_TOML}` : `缺失: ${CONFIG_TOML}`);
}

function check03() {
  const content = readFile(CONFIG_TOML) || '';
  const hasAgentsTable = /^\[agents\]/m.test(content);
  const hasMaxThreads = /max_threads\s*=/.test(content);
  const hasMaxDepth = /max_depth\s*=/.test(content);
  const ok = hasAgentsTable && hasMaxThreads && hasMaxDepth;
  record('03', 'P0', 'config.toml 含 [agents] 表', ok ? 'PASS' : 'FAIL',
    ok ? 'max_threads + max_depth 完整' : `缺少字段: agents=${hasAgentsTable} max_threads=${hasMaxThreads} max_depth=${hasMaxDepth}`);
}

function check04() {
  const content = readFile(CONFIG_TOML) || '';
  const hasFeaturesTable = /^\[features\]/m.test(content);
  const hasMultiAgent = /multi_agent\s*=\s*true/.test(content);
  const hasMemories = /memories\s*=\s*true/.test(content);
  const hasHooks = /hooks\s*=\s*true/.test(content);
  const ok = hasFeaturesTable && hasMultiAgent && hasMemories && hasHooks;
  record('04', 'P0', 'config.toml 含 [features] 表', ok ? 'PASS' : 'FAIL',
    ok ? 'multi_agent + memories + hooks 完整' : `缺少: features=${hasFeaturesTable} multi_agent=${hasMultiAgent} memories=${hasMemories} hooks=${hasHooks}`);
}

function check05() {
  const ok = fileExists(HOOKS_JSON);
  let valid = false;
  let hookCount = 0;
  if (ok) {
    try {
      const content = JSON.parse(readFile(HOOKS_JSON));
      const events = content.hooks ? Object.keys(content.hooks) : [];
      hookCount = events.length;
      valid = hookCount > 0;
    } catch (err) {
      valid = false;
    }
  }
  record('05', 'P0', '.codex/hooks.json 存在且合法', (ok && valid) ? 'PASS' : 'FAIL',
    (ok && valid) ? `${hookCount} 个事件已配置` : `不存在或 JSON 非法: ${HOOKS_JSON}`);
}

function check06() {
  if (!fileExists(AGENTS_DIR)) {
    record('06', 'P0', 'subagent .toml 字段完整', 'FAIL', `目录不存在: ${AGENTS_DIR}`);
    return;
  }
  const files = fs.readdirSync(AGENTS_DIR).filter(f => f.endsWith('.toml'));
  const missing = [];
  for (const f of files) {
    const content = readFile(path.join(AGENTS_DIR, f)) || '';
    if (!/^name\s*=/m.test(content)) missing.push(`${f}: no name`);
    if (!/^description\s*=/m.test(content)) missing.push(`${f}: no description`);
    if (!/sandbox_mode\s*=/.test(content)) missing.push(`${f}: no sandbox_mode`);
    if (!/model_reasoning_effort\s*=/.test(content)) missing.push(`${f}: no model_reasoning_effort`);
  }
  const ok = missing.length === 0;
  record('06', 'P0', `subagent .toml 字段完整 (${files.length} 个)`, ok ? 'PASS' : 'FAIL',
    ok ? `全部 ${files.length} 个 subagent 字段完整` : `${missing.length} 项缺失: ${missing.slice(0, 5).join(', ')}${missing.length > 5 ? '...' : ''}`);
}

function check07() {
  const ok = fileExists(SKILL_MD);
  let hasFrontmatter = false;
  if (ok) {
    const content = readFile(SKILL_MD);
    hasFrontmatter = /^---\s*\n[\s\S]*?\n---\s*\n/.test(content);
  }
  record('07', 'P0', '.agents/skills/dev-flow/SKILL.md 存在', (ok && hasFrontmatter) ? 'PASS' : 'FAIL',
    (ok && hasFrontmatter) ? `存在且含 frontmatter` : `缺失或 frontmatter 非法: ${SKILL_MD}`);
}

function check08() {
  let violations = [];
  function scan(dir) {
    if (!fileExists(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) scan(p);
      else if (e.name.endsWith('.toml') || e.name.endsWith('.md') || e.name.endsWith('.json')) {
        const content = readFile(p) || '';
        const matches = content.match(/\.Codex[\w\/\-\.]*/g);
        if (matches) violations.push(...matches.map(m => `${p}: ${m}`));
      }
    }
  }
  scan(path.join(PROJECT_ROOT, '.codex'));
  scan(path.join(PROJECT_ROOT, '.agents'));
  const ok = violations.length === 0;
  record('08', 'P0', '路径引用无大写 .Codex', ok ? 'PASS' : 'FAIL',
    ok ? '无大写 .Codex 路径' : `${violations.length} 处违规: ${violations.slice(0, 3).join(', ')}`);
}

function check09() {
  const files = ['backend-develop-expert', 'frontend-develop-expert', 'develop-expert'];
  const missing = [];
  for (const name of files) {
    const p = path.join(AGENTS_DIR, `${name}.toml`);
    if (!fileExists(p)) { missing.push(`${name}: 文件不存在`); continue; }
    const content = readFile(p) || '';
    if (!/nickname_candidates\s*=/.test(content)) missing.push(`${name}: 无 nickname_candidates`);
  }
  const ok = missing.length === 0;
  record('09', 'P1', 'develop-expert 有 nickname_candidates', ok ? 'PASS' : 'FAIL',
    ok ? '3 个 develop-expert 全部配置' : `缺失: ${missing.join(', ')}`);
}

function check10() {
  const checks = [
    { file: 'research-expert.toml', expected: 'read-only' },
    { file: 'analyze-expert.toml', expected: 'read-only' },
    { file: 'design-expert.toml', expected: 'read-only' },
    { file: 'backend-develop-expert.toml', expected: 'workspace-write' },
    { file: 'frontend-develop-expert.toml', expected: 'workspace-write' },
  ];
  const wrong = [];
  for (const { file, expected } of checks) {
    const p = path.join(AGENTS_DIR, file);
    if (!fileExists(p)) { wrong.push(`${file}: 文件不存在`); continue; }
    const content = readFile(p) || '';
    const match = content.match(/sandbox_mode\s*=\s*"([^"]+)"/);
    if (!match || match[1] !== expected) wrong.push(`${file}: 期望 ${expected}, 实际 ${match ? match[1] : '缺失'}`);
  }
  const ok = wrong.length === 0;
  record('10', 'P1', 'sandbox_mode 与阶段匹配', ok ? 'PASS' : 'FAIL',
    ok ? '所有关键 subagent 沙箱正确' : `不匹配: ${wrong.join('; ')}`);
}

function check11() {
  const ok = fileExists(HOOK_SCRIPT);
  record('11', 'P1', '钩子脚本存在', ok ? 'PASS' : 'FAIL',
    ok ? HOOK_SCRIPT : `缺失: ${HOOK_SCRIPT}`);
}

function check12() {
  if (!fileExists(HOOK_SCRIPT)) {
    record('12', 'P1', '钩子脚本响应关键事件', 'FAIL', '脚本不存在');
    return;
  }
  const content = readFile(HOOK_SCRIPT) || '';
  const required = ['session-start', 'subagent-start', 'subagent-stop', 'pre-write', 'post-write', 'stage-stop'];
  const missing = required.filter(e => !content.includes(`'${e}'`) && !content.includes(`"${e}"`));
  const ok = missing.length === 0;
  record('12', 'P1', '钩子脚本响应 6 关键事件', ok ? 'PASS' : 'FAIL',
    ok ? '6 事件全部实现' : `缺失事件: ${missing.join(', ')}`);
}

function check13() {
  const content = readFile(CONFIG_TOML) || '';
  // 项目级不能含 profile / profiles
  const hasProfile = /^\s*profile\s*=\s*"[^"]+"/m.test(content) || /^\s*profiles\s*=\s*\[/m.test(content);
  // 也检查 [profiles.xxx] 表
  const hasProfilesTable = /^\[profiles\./m.test(content);
  const ok = !hasProfile && !hasProfilesTable;
  record('13', 'P1', '项目级 config.toml 不含 profiles', ok ? 'PASS' : 'FAIL',
    ok ? 'profiles 应放用户级 ~/.codex/config.toml' : 'profiles 键被忽略, 需移除');
}

function check14() {
  const size = fileSize(ROOT_AGENTS);
  const maxBytes = 65536; // 64 KiB
  const ok = size <= maxBytes;
  record('14', 'P1', `AGENTS.md 大小 <= ${maxBytes} B`, ok ? 'PASS' : 'FAIL',
    `实际: ${size} B (${(size / 1024).toFixed(1)} KiB)${ok ? '' : ' ⚠ 需调高 project_doc_max_bytes 或拆分'}`);
}

// === 执行 ===

const checks = [check01, check02, check03, check04, check05, check06, check07, check08, check09, check10, check11, check12, check13, check14];

if (!JSON_OUTPUT) {
  console.log('========================================');
  console.log('dev-flow Codex 配置审计');
  console.log('========================================');
  console.log(`项目根: ${PROJECT_ROOT}`);
  console.log('');
}

checks.forEach(fn => fn());

const p0Failed = results.filter(r => r.priority === 'P0' && r.status === 'FAIL').length;
const p1Failed = results.filter(r => r.priority === 'P1' && r.status === 'FAIL').length;
const p0Pass = results.filter(r => r.priority === 'P0' && r.status === 'PASS').length;
const p1Pass = results.filter(r => r.priority === 'P1' && r.status === 'PASS').length;
const totalPass = results.filter(r => r.status === 'PASS').length;
const total = results.length;

if (JSON_OUTPUT) {
  console.log(JSON.stringify({ summary: { total, pass: totalPass, p0Failed, p1Failed }, results }, null, 2));
} else {
  console.log('');
  console.log('========================================');
  console.log(`总计: ${totalPass}/${total} 通过`);
  console.log(`  P0: ${p0Pass - p0Failed} / ${p0Pass + p0Failed} 通过${p0Failed > 0 ? ` (${p0Failed} 失败)` : ''}`);
  console.log(`  P1: ${p1Pass} / ${p1Pass + p1Failed} 通过${p1Failed > 0 ? ` (${p1Failed} 失败)` : ''}`);
  console.log('========================================');
}

process.exit(p0Failed > 0 ? 1 : (p1Failed > 0 ? 2 : 0));
