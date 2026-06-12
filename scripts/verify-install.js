#!/usr/bin/env node

import { readdirSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(import.meta.url), '../..');

// Must match install.js exactly
const AGENT_FILES = [
  'orchestrator.md',
  'research-expert.md',
  'analyze-expert.md',
  'design-expert.md',
  'backend-develop-expert.md',
  'frontend-develop-expert.md',
  'verify-expert.md',
  'task-protocol.md',
  'dependency-scanner.md',
  'service-scanner.md',
  'structure-analyzer.md',
  'config-analyzer.md',
  'on-demand-loader.md',
  'runtime-state-manager.md',
  'smoke-test.md',
  'integration-test.md',
  'delivery.md',
  'step-enforcer.md',
  'contract-validator.md',
  'bytecode-analyzer.md',
  'design-contract-validator.md',
  'context-manager.md',
  'error-pattern-learner.md',
  'task-split-expert.md',
  'clarify-expert.md',
  'service-orchestrator.md',
  'db-verifier.md',
  'e2e-ui-tester.md',
];

const STAGE_FILES = [
  'research.md',
  'analyze.md',
  'design.md',
  'task-split.md',
  'develop.md',
  'test.md',
  'fix.md',
  'hotfix.md',
  'delivery.md',
  'code-reference.md',
  'clarify.md',
];

const platforms = ['trae', 'cursor', 'qoder', 'claude', 'codex'];
const extMap = { trae: '.md', cursor: '.md', qoder: '.md', claude: '.md', codex: '.toml' };

let hasError = false;

console.log('=== AGENT FILES CONSISTENCY CHECK ===\n');
for (const platform of platforms) {
  const ext = extMap[platform];
  const agentsDir = resolve(ROOT, 'skill-templates', platform, 'agents');
  const actualFiles = existsSync(agentsDir) ? readdirSync(agentsDir).filter(f => f.endsWith(ext)).sort() : [];
  const expectedFiles = AGENT_FILES.map(f => f.replace(/\.md$/, ext)).sort();

  const missing = expectedFiles.filter(f => !actualFiles.includes(f));
  const extra = actualFiles.filter(f => !expectedFiles.includes(f));

  console.log(`${platform.toUpperCase()}:`);
  console.log(`  Expected: ${expectedFiles.length}, Actual: ${actualFiles.length}`);
  if (missing.length) { console.log(`  MISSING: ${missing.join(', ')}`); hasError = true; }
  if (extra.length) { console.log(`  EXTRA: ${extra.join(', ')}`); }
  if (!missing.length && !extra.length) console.log(`  OK`);
  console.log();
}

console.log('=== STAGE FILES CONSISTENCY CHECK ===\n');
for (const platform of platforms) {
  const stagesDir = resolve(ROOT, 'skill-templates', platform, 'stages');
  const actualFiles = existsSync(stagesDir) ? readdirSync(stagesDir).filter(f => f.endsWith('.md')).sort() : [];
  const expectedFiles = [...STAGE_FILES].sort();

  const missing = expectedFiles.filter(f => !actualFiles.includes(f));
  const extra = actualFiles.filter(f => !expectedFiles.includes(f));

  console.log(`${platform.toUpperCase()}:`);
  console.log(`  Expected: ${expectedFiles.length}, Actual: ${actualFiles.length}`);
  if (missing.length) { console.log(`  MISSING: ${missing.join(', ')}`); hasError = true; }
  if (extra.length) { console.log(`  EXTRA: ${extra.join(', ')}`); }
  if (!missing.length && !extra.length) console.log(`  OK`);
  console.log();
}

console.log('=== REFERENCE FILES CONSISTENCY CHECK ===\n');
const refPlatforms = ['trae', 'cursor', 'qoder', 'claude', 'codex'];
for (const platform of refPlatforms) {
  const refsDir = resolve(ROOT, 'skill-templates', platform, 'references');
  const actualFiles = existsSync(refsDir) ? readdirSync(refsDir).filter(f => f.endsWith('.md')).sort() : [];

  console.log(`${platform.toUpperCase()}:`);
  console.log(`  Actual: ${actualFiles.length} files`);
  if (!actualFiles.length && platform !== 'codex') { console.log(`  WARNING: no reference files`); }
  else console.log(`  OK`);
  console.log();
}

if (hasError) {
  console.log('CHECK FAILED: some files are missing');
  process.exit(1);
} else {
  console.log('ALL CHECKS PASSED');
  process.exit(0);
}
