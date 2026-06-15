#!/usr/bin/env node
/* eslint-disable */
/**
 * memories-sync.cjs - dev-flow ↔ Codex Memories 双向同步
 * =====================================================
 *
 * 用途:
 *   1. push: 将 .dev-flow/memory/ 中的关键条目推到 Codex memories (~/.codex/memories/)
 *   2. pull: 从 ~/.codex/memories/ 拉取新生成条目到 .dev-flow/memory/session/{id}/
 *
 * 触发:
 *   - SessionStart 钩子 → pull (拉取 Codex 跨会话记忆)
 *   - Stop 钩子 → push (推送 dev-flow 项目级记忆)
 *
 * 用法:
 *   node .agents/skills/dev-flow/scripts/memories-sync.cjs push
 *   node .agents/skills/dev-flow/scripts/memories-sync.cjs pull
 *   node .agents/skills/dev-flow/scripts/memories-sync.cjs status
 */

'use strict';

const fs = require('fs');
const path = require('path');

const MODE = process.argv[2] || 'status';
const PROJECT_ROOT = process.cwd();
const SESSION_ID = process.env.CODEX_SESSION_ID || 'default-' + Date.now();
const CODEX_HOME = process.env.CODEX_HOME || path.join(process.env.USERPROFILE || process.env.HOME || '', '.codex');
const CODEX_MEMORIES = path.join(CODEX_HOME, 'memories');
const DEVFLOW_MEMORY = path.join(PROJECT_ROOT, '.dev-flow', 'memory');
const SESSION_MEMORIES = path.join(DEVFLOW_MEMORY, 'session', SESSION_ID);

function log(level, msg) {
  const line = `[${new Date().toISOString()}] [${level}] ${msg}\n`;
  process.stdout.write(line);
}

function ensureDir(dir) {
  try { fs.mkdirSync(dir, { recursive: true }); } catch (_) {}
}

function listFiles(dir, ext) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter(f => !ext || f.endsWith(ext));
}

function push() {
  log('INFO', 'Push: .dev-flow/memory/ → ~/.codex/memories/');
  if (!fs.existsSync(DEVFLOW_MEMORY)) {
    log('WARN', `Source not found: ${DEVFLOW_MEMORY}`);
    return;
  }
  ensureDir(CODEX_MEMORIES);
  ensureDir(path.join(CODEX_MEMORIES, 'dev-flow'));

  const files = listFiles(DEVFLOW_MEMORY, '.md');
  for (const file of files) {
    const src = path.join(DEVFLOW_MEMORY, file);
    const dest = path.join(CODEX_MEMORIES, 'dev-flow', file);
    try {
      fs.copyFileSync(src, dest);
      log('INFO', `  ✓ ${file}`);
    } catch (err) {
      log('ERROR', `  ✗ ${file}: ${err.message}`);
    }
  }
  log('INFO', `Pushed ${files.length} files to ${CODEX_MEMORIES}/dev-flow/`);
}

function pull() {
  log('INFO', 'Pull: ~/.codex/memories/ → .dev-flow/memory/session/{id}/');
  if (!fs.existsSync(CODEX_MEMORIES)) {
    log('WARN', `Source not found: ${CODEX_MEMORIES}`);
    return;
  }
  ensureDir(SESSION_MEMORIES);

  const devflowSubdir = path.join(CODEX_MEMORIES, 'dev-flow');
  const sourceDirs = [CODEX_MEMORIES];
  if (fs.existsSync(devflowSubdir)) sourceDirs.push(devflowSubdir);

  let count = 0;
  for (const dir of sourceDirs) {
    const files = listFiles(dir, '.md');
    for (const file of files) {
      // 跳过自己 push 的文件, 避免循环
      if (file.startsWith('dev-flow-')) continue;
      const src = path.join(dir, file);
      const dest = path.join(SESSION_MEMORIES, file);
      try {
        fs.copyFileSync(src, dest);
        log('INFO', `  ✓ ${file}`);
        count++;
      } catch (err) {
        log('ERROR', `  ✗ ${file}: ${err.message}`);
      }
    }
  }
  log('INFO', `Pulled ${count} files to ${SESSION_MEMORIES}/`);
}

function status() {
  log('INFO', 'Status check');
  console.log('---');
  console.log('CODEX_HOME      :', CODEX_HOME);
  console.log('CODEX_MEMORIES  :', CODEX_MEMORIES, fs.existsSync(CODEX_MEMORIES) ? '(exists)' : '(missing)');
  console.log('DEVFLOW_MEMORY  :', DEVFLOW_MEMORY, fs.existsSync(DEVFLOW_MEMORY) ? '(exists)' : '(missing)');
  console.log('SESSION_MEMORIES:', SESSION_MEMORIES, fs.existsSync(SESSION_MEMORIES) ? '(exists)' : '(missing)');
  console.log('SESSION_ID      :', SESSION_ID);
  console.log('---');
  if (fs.existsSync(DEVFLOW_MEMORY)) {
    console.log('dev-flow memory files:', listFiles(DEVFLOW_MEMORY, '.md').join(', '));
  }
  if (fs.existsSync(CODEX_MEMORIES)) {
    console.log('codex memory files   :', listFiles(CODEX_MEMORIES, '.md').join(', '));
  }
}

const handlers = { push, pull, status };
const handler = handlers[MODE];
if (!handler) {
  log('ERROR', `Unknown mode: ${MODE} (expected: push | pull | status)`);
  process.exit(1);
}

try {
  handler();
  process.exit(0);
} catch (err) {
  log('ERROR', `Sync failed: ${err.message}\n${err.stack}`);
  process.exit(1);
}
