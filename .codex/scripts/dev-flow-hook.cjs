#!/usr/bin/env node
/* eslint-disable */
/**
 * dev-flow-hook.cjs - Codex 生命周期钩子脚本
 * ============================================
 * 用法: node .codex/scripts/dev-flow-hook.cjs <event> [args...]
 *
 * 事件清单 (6 个, 覆盖 Codex 9 个支持事件中的关键事件):
 *   - session-start     启动/恢复 session 时
 *   - subagent-start    subagent 启动时
 *   - subagent-stop     subagent 停止时
 *   - pre-write         Edit/Write/MultiEdit 调用前
 *   - post-write        Edit/Write 调用后
 *   - stage-stop        阶段停止 (Stop 事件)
 *
 * 日志位置:
 *   - .dev-flow/sessions/{session_id}/hooks.log         全部事件
 *   - .dev-flow/sessions/{session_id}/subagent-failures.log  subagent 失败
 *
 * 退出码:
 *   0  - 正常
 *   2  - 阻止 (PreToolUse 阻断场景; 当前实现仅记录, 不阻断)
 */

'use strict';

const fs = require('fs');
const path = require('path');

// === 参数解析 ===
const EVENT = process.argv[2] || 'unknown';
const ARGS = process.argv.slice(3);

// === 环境变量 ===
const SESSION_ID = process.env.CODEX_SESSION_ID || process.env.SESSION_ID || 'default-' + Date.now();
// agent_name 优先从环境变量取, 没有再从 ARGS[0] 取
const AGENT_NAME = process.env.CODEX_AGENT_NAME || (ARGS[0] && !ARGS[0].includes('/') && !ARGS[0].includes('\\') && !ARGS[0].includes('.') ? ARGS[0] : 'unknown');
const AGENT_ROLE = process.env.CODEX_AGENT_ROLE || 'subagent'; // 'main' | 'subagent'

// === 路径 ===
const PROJECT_ROOT = process.cwd();
const SESSION_DIR = path.join(PROJECT_ROOT, '.dev-flow', 'sessions', SESSION_ID);
const HOOKS_LOG = path.join(SESSION_DIR, 'hooks.log');
const FAILURES_LOG = path.join(SESSION_DIR, 'subagent-failures.log');

// === 工具函数 ===

function ensureDir(filePath) {
  try {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
  } catch (err) {
    // 忽略目录已存在错误
  }
}

function timestamp() {
  return new Date().toISOString();
}

function log(level, message, extra) {
  ensureDir(HOOKS_LOG);
  const line = {
    ts: timestamp(),
    level,
    event: EVENT,
    session_id: SESSION_ID,
    agent_name: AGENT_NAME,
    agent_role: AGENT_ROLE,
    message,
    ...(extra ? { extra } : {}),
  };
  try {
    fs.appendFileSync(HOOKS_LOG, JSON.stringify(line) + '\n', 'utf8');
  } catch (err) {
    // 静默失败, 避免钩子自身崩溃影响主流程
    process.stderr.write(`[dev-flow-hook] log write failed: ${err.message}\n`);
  }
}

function detectProjectType() {
  const checks = [
    { file: 'pom.xml', type: 'java-maven' },
    { file: 'build.gradle', type: 'java-gradle' },
    { file: 'build.gradle.kts', type: 'kotlin' },
    { file: 'package.json', type: 'node' },
    { file: 'go.mod', type: 'go' },
    { file: 'pyproject.toml', type: 'python-pyproject' },
    { file: 'requirements.txt', type: 'python-requirements' },
    { file: 'Cargo.toml', type: 'rust' },
  ];

  for (const { file, type } of checks) {
    if (fs.existsSync(path.join(PROJECT_ROOT, file))) {
      return { type, indicator: file };
    }
  }
  return { type: 'unknown', indicator: null };
}

function isMainAgent() {
  return AGENT_ROLE === 'main';
}

function isAllowedFile(filePath) {
  if (!filePath) return true;
  // 允许的路径白名单
  const allowed = [
    '.codex/',
    '.agents/',
    'AGENTS.md',
    'CLAUDE.md', // 兼容旧文档
  ];
  const normalized = filePath.replace(/\\/g, '/');
  return allowed.some(prefix => normalized.includes(prefix));
}

// === 事件处理 ===

function handleSessionStart() {
  const project = detectProjectType();
  log('INFO', 'Session started', {
    project_type: project.type,
    project_indicator: project.indicator,
    node_version: process.version,
    platform: process.platform,
  });

  // 写入 session 元信息
  ensureDir(path.join(SESSION_DIR, 'meta.json'));
  try {
    fs.writeFileSync(
      path.join(SESSION_DIR, 'meta.json'),
      JSON.stringify({
        session_id: SESSION_ID,
        started_at: timestamp(),
        project_type: project.type,
        project_indicator: project.indicator,
      }, null, 2),
      'utf8'
    );
  } catch (err) {
    log('WARN', 'Failed to write session meta', { error: err.message });
  }
}

function handleSubagentStart() {
  log('INFO', 'Subagent started', { agent: AGENT_NAME });
}

function handleSubagentStop() {
  const exitCode = ARGS[1] || process.env.CODEX_AGENT_EXIT_CODE || '0';
  const isFailure = exitCode !== '0' && exitCode !== 0;
  log(isFailure ? 'ERROR' : 'INFO', 'Subagent stopped', {
    agent: AGENT_NAME,
    exit_code: exitCode,
  });

  if (isFailure) {
    ensureDir(FAILURES_LOG);
    try {
      fs.appendFileSync(
        FAILURES_LOG,
        `[${timestamp()}] [${AGENT_NAME}] exit_code=${exitCode}\n`,
        'utf8'
      );
    } catch (err) {
      process.stderr.write(`[dev-flow-hook] failure log write failed: ${err.message}\n`);
    }
  }
}

function handlePreWrite() {
  const filePath = ARGS[0] || process.env.CODEX_TOOL_FILE_PATH || 'unknown';

  // 记录主 agent 的所有写入
  if (isMainAgent() && !isAllowedFile(filePath)) {
    log('WARN', 'Main agent attempting to write project file', {
      file_path: filePath,
      policy: 'should-be-avoided',
    });
    // 注释: Codex hook 当前为观察性, 不阻断. 如需硬阻断, 返回 exit 2
  } else {
    log('INFO', 'Write tool called', {
      file_path: filePath,
      role: AGENT_ROLE,
    });
  }
}

function handlePostWrite() {
  const filePath = ARGS[0] || process.env.CODEX_TOOL_FILE_PATH || 'unknown';
  log('INFO', 'File written', { file_path: filePath });

  // 检测阶段交付物
  const deliverableMatch = filePath.match(/\.dev-flow[\/\\]deliverables[\/\\]([^/\\]+)[\/\\](\d+-[^/\\]+\.md)/);
  if (deliverableMatch) {
    log('INFO', 'Stage deliverable detected', {
      requirement: deliverableMatch[1],
      file: deliverableMatch[2],
    });
  }
}

function handleStageStop() {
  log('INFO', 'Stage stopped, user confirmation may be required');
  // Stop 事件: 主 Agent 在主对话中等待用户确认后, 由 .confirmed 标记跟踪
  // 这里仅记录, 不自动写 .confirmed (避免误标)
}

// === 路由 ===

const handlers = {
  'session-start': handleSessionStart,
  'subagent-start': handleSubagentStart,
  'subagent-stop': handleSubagentStop,
  'pre-write': handlePreWrite,
  'post-write': handlePostWrite,
  'stage-stop': handleStageStop,
};

try {
  const handler = handlers[EVENT];
  if (handler) {
    handler();
  } else {
    log('WARN', `Unknown event: ${EVENT}`);
  }
  process.exit(0);
} catch (err) {
  // 钩子失败不应阻塞主流程
  process.stderr.write(`[dev-flow-hook] handler error: ${err.message}\n${err.stack}\n`);
  process.exit(0);
}
