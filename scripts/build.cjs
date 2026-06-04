/**
 * dev-flow 跨平台构建脚本
 * 
 * 从 _core/SKILL.md（Router）+ _core/stages/（阶段指令）+ _core/agents/ 生成各平台最终文件。
 * 
 * 用法：
 *   node scripts/build.cjs              # 生成所有平台文件
 *   node scripts/build.cjs trae         # 仅生成 Trae 平台
 *   node scripts/build.cjs --verify     # 校验模式：生成后与现有文件对比
 *   node scripts/build.cjs --help       # 显示帮助
 * 
 * 零依赖，仅需 Node.js。
 */

const fs = require('fs');
const path = require('path');

// ============================================================
// 配置
// ============================================================

const ROOT = path.resolve(__dirname, '..');
const CORE_SKILL = path.join(ROOT, 'skill-templates', '_core', 'SKILL.md');
const CORE_AGENTS = path.join(ROOT, 'skill-templates', '_core', 'agents');
const CORE_STAGES = path.join(ROOT, 'skill-templates', '_core', 'stages');
const CORE_REFERENCES = path.join(ROOT, 'skill-templates', '_core', 'references');
const PLATFORMS_DIR = path.join(ROOT, 'skill-templates', '_platforms');

const PLATFORM_CONFIG = {
  trae: {
    outputDir: 'skill-templates/trae',
    outputFile: 'SKILL.md',
    stripTraeOnly: false,
    useExtraAgents: true,
    // Trae 的 skill 目录结构：.trae/skills/dev-flow/SKILL.md + stages/
    // AI 从 skill 目录解析相对路径，stages/ 是同级子目录
    stagesPath: 'stages/',
    agentsPath: 'agents/',
    referencesPath: 'references/',
  },
  cursor: {
    outputDir: 'skill-templates/cursor',
    outputFile: 'dev-flow.md',
    stripTraeOnly: true,
    useExtraAgents: false,
    // Cursor 安装路径：.cursor/commands/dev-flow.md + .cursor/stages/
    // AI 从项目根解析路径
    stagesPath: '.cursor/stages/',
    agentsPath: '.cursor/agents/',
    referencesPath: '.cursor/references/',
  },
  claude: {
    outputDir: 'skill-templates/claude',
    outputFile: 'dev-flow.md',
    stripTraeOnly: true,
    useExtraAgents: false,
    stagesPath: '.claude/stages/',
    agentsPath: '.claude/agents/',
    referencesPath: '.claude/references/',
  },
  qoder: {
    outputDir: 'skill-templates/qoder',
    outputFile: 'dev-flow.md',
    stripTraeOnly: true,
    useExtraAgents: false,
    stagesPath: '.qoder/stages/',
    agentsPath: '.qoder/agents/',
    referencesPath: '.qoder/references/',
  },
  codex: {
    outputDir: 'skill-templates/codex',
    outputFile: 'AGENTS.md',
    stripTraeOnly: true,
    useExtraAgents: false,
    formatCodex: true,
    skipAutoGen: true,
    stagesPath: '.codex/stages/',
    agentsPath: '.codex/agents/',
    referencesPath: '.codex/references/',
  },
};

// ============================================================
// 核心逻辑
// ============================================================

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * 处理 SKILL.md Router 内容（TRAE-ONLY 标记处理）
 */
function processSkillContent(content, stripTraeOnly) {
  const TRAE_START = '<!-- TRAE-ONLY-START -->';
  const TRAE_END = '<!-- TRAE-ONLY-END -->';

  if (stripTraeOnly) {
    // 移除整块 TRAE-ONLY-START ... TRAE-ONLY-END（含标记）
    const regex = new RegExp(
      escapeRegex(TRAE_START) + '[\\s\\S]*?' + escapeRegex(TRAE_END),
      'g'
    );
    content = content.replace(regex, '');
    // 清理连续空行
    content = content.replace(/(\r?\n){3,}/g, '\r\n\r\n');
  } else {
    // Trae: 移除标记。若标记独占一行则连同周围换行一起合并
    content = content.replace(
      new RegExp('\\r?\\n' + escapeRegex(TRAE_START) + '\\r?\\n', 'g'),
      '\r\n'
    );
    content = content.replace(
      new RegExp('\\r?\\n' + escapeRegex(TRAE_END) + '\\r?\\n', 'g'),
      '\r\n'
    );
    // 处理内联标记（放在行末/行首的标记）
    content = content.split(TRAE_START).join('');
    content = content.split(TRAE_END).join('');
    // 清理连续空行
    content = content.replace(/(\r?\n){3,}/g, '\r\n\r\n');
  }

  return content;
}

/**
 * 处理 stage 文件内容（TRAE-ONLY 标记处理，用于 stages 目录下的文件）
 */
function processStageContent(content, stripTraeOnly) {
  return processSkillContent(content, stripTraeOnly);
}

/**
 * 生成单个平台的输出文件
 */
function generatePlatform(platform, config) {
  const outputDir = path.join(ROOT, config.outputDir);
  const outputFile = path.join(outputDir, config.outputFile);
  const agentsDir = path.join(outputDir, 'agents');
  const stagesDir = path.join(outputDir, 'stages');

  console.log(`\n[${platform}] 生成中...`);

  // 1. 主 SKILL 文件（Router）
  if (!fs.existsSync(CORE_SKILL)) {
    throw new Error(`核心文件不存在: ${CORE_SKILL}`);
  }
  const coreContent = fs.readFileSync(CORE_SKILL, 'utf-8');
  let processed = processSkillContent(coreContent, config.stripTraeOnly);

  // 平台特定路径替换（{{STAGES_PATH}} 和 {{AGENTS_PATH}}）
  if (config.stagesPath) {
    processed = processed.replace(/\{\{STAGES_PATH\}\}/g, config.stagesPath);
  }
  if (config.agentsPath) {
    processed = processed.replace(/\{\{AGENTS_PATH\}\}/g, config.agentsPath);
  }
  if (config.referencesPath) {
    processed = processed.replace(/\{\{REFERENCES_PATH\}\}/g, config.referencesPath);
  }

  if (config.formatCodex) {
    processed = convertToCodexFormat(processed);
  }

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  fs.writeFileSync(outputFile, processed, 'utf-8');
  console.log(`  \u2713 主文件 (Router): ${outputFile} (${processed.split('\n').length} 行, ${Buffer.byteLength(processed, 'utf-8')} bytes)`);

  // 2. Stages（阶段指令文件）
  if (!fs.existsSync(stagesDir)) {
    fs.mkdirSync(stagesDir, { recursive: true });
  }

  if (fs.existsSync(CORE_STAGES)) {
    const stageFiles = fs.readdirSync(CORE_STAGES).filter(f => f.endsWith('.md'));
    for (const stageFile of stageFiles) {
      const src = path.join(CORE_STAGES, stageFile);
      let content = fs.readFileSync(src, 'utf-8');
      content = processStageContent(content, config.stripTraeOnly);
      const dst = path.join(stagesDir, stageFile);
      fs.writeFileSync(dst, content, 'utf-8');
    }
    console.log(`  \u2713 stages: ${stageFiles.length} 个阶段指令文件`);
  }

  // 2.5 References（按需加载参考文件）
  const referencesDir = path.join(outputDir, 'references');
  if (!fs.existsSync(referencesDir)) {
    fs.mkdirSync(referencesDir, { recursive: true });
  }

  if (fs.existsSync(CORE_REFERENCES)) {
    const refFiles = fs.readdirSync(CORE_REFERENCES).filter(f => f.endsWith('.md'));
    for (const refFile of refFiles) {
      const src = path.join(CORE_REFERENCES, refFile);
      let content = fs.readFileSync(src, 'utf-8');
      content = processStageContent(content, config.stripTraeOnly);
      // 平台路径替换
      if (config.stagesPath) {
        content = content.replace(/\{\{STAGES_PATH\}\}/g, config.stagesPath);
      }
      if (config.agentsPath) {
        content = content.replace(/\{\{AGENTS_PATH\}\}/g, config.agentsPath);
      }
      if (config.referencesPath) {
        content = content.replace(/\{\{REFERENCES_PATH\}\}/g, config.referencesPath);
      }
      const dst = path.join(referencesDir, refFile);
      fs.writeFileSync(dst, content, 'utf-8');
    }
    console.log(`  \u2713 references: ${refFiles.length} 个参考文件`);
  }

  // 3. Agents
  if (!fs.existsSync(agentsDir)) {
    fs.mkdirSync(agentsDir, { recursive: true });
  }

  if (fs.existsSync(CORE_AGENTS)) {
    const baseAgents = fs.readdirSync(CORE_AGENTS).filter(f => f.endsWith('.md'));
    for (const agent of baseAgents) {
      const src = path.join(CORE_AGENTS, agent);
      let content = fs.readFileSync(src, 'utf-8');
      // 平台特定路径替换
      if (config.stagesPath) {
        content = content.replace(/\{\{STAGES_PATH\}\}/g, config.stagesPath);
      }
      if (config.agentsPath) {
        content = content.replace(/\{\{AGENTS_PATH\}\}/g, config.agentsPath);
      }
      const dst = path.join(agentsDir, agent);
      fs.writeFileSync(dst, content, 'utf-8');
    }
    console.log(`  \u2713 agents: ${baseAgents.length} 个`);
  }

  // 4. Trae 额外 agents（仅 TRAE-ONLY 标记相关的 agents，现在已大部分提升到 _core）
  if (config.useExtraAgents) {
    const traeAgentsDir = path.join(PLATFORMS_DIR, 'trae', 'agents');
    if (fs.existsSync(traeAgentsDir)) {
      const extraAgents = fs.readdirSync(traeAgentsDir).filter(f => f.endsWith('.md'));
      let copied = 0;
      for (const agent of extraAgents) {
        const src = path.join(traeAgentsDir, agent);
        const dst = path.join(agentsDir, agent);
        // 只复制 _core 中不存在的 agent（避免覆盖已提升的版本）
        if (!fs.existsSync(dst)) {
          fs.copyFileSync(src, dst);
          copied++;
        }
      }
      if (copied > 0) {
        console.log(`  \u2713 Trae 额外 agents: ${copied} 个（已提升到 _core 的不再重复）`);
      }
    }
  }

  console.log(`[${platform}] 生成完毕 \u2713`);
}

/**
 * Codex 格式转换
 */
function convertToCodexFormat(content) {
  content = content.replace(/^---\n[\s\S]*?\n---\n/, '');
  content = content.replace(/@(\w[\w-]*)\b/g, 'run agent: $1');
  return content;
}

/**
 * 校验模式
 */
function verifyPlatform(platform, config) {
  const outputDir = path.join(ROOT, config.outputDir);
  const outputFile = path.join(outputDir, config.outputFile);
  const agentsDir = path.join(outputDir, 'agents');
  const stagesDir = path.join(outputDir, 'stages');
  let passed = true;

  // 1. 校验主文件
  if (!fs.existsSync(outputFile)) {
    console.log(`  \u26a0 主文件不存在: ${outputFile}`);
    passed = false;
  } else {
    const coreContent = fs.readFileSync(CORE_SKILL, 'utf-8');
    let generated = processSkillContent(coreContent, config.stripTraeOnly);
    // 平台特定路径替换
    if (config.stagesPath) {
      generated = generated.replace(/\{\{STAGES_PATH\}\}/g, config.stagesPath);
    }
    if (config.agentsPath) {
      generated = generated.replace(/\{\{AGENTS_PATH\}\}/g, config.agentsPath);
    }
    if (config.referencesPath) {
      generated = generated.replace(/\{\{REFERENCES_PATH\}\}/g, config.referencesPath);
    }
    if (config.formatCodex) {
      generated = convertToCodexFormat(generated);
    }
    const original = fs.readFileSync(outputFile, 'utf-8');
    if (original === generated) {
      console.log(`  \u2713 主文件一致`);
    } else {
      console.log(`  \u2717 主文件不一致!`);
      const origLines = original.split('\n');
      const genLines = generated.split('\n');
      console.log(`    原始: ${origLines.length} 行, 生成: ${genLines.length} 行`);
      passed = false;
    }
  }

  // 2. 校验 stages
  if (fs.existsSync(CORE_STAGES)) {
    const stageFiles = fs.readdirSync(CORE_STAGES).filter(f => f.endsWith('.md'));
    for (const sf of stageFiles) {
      const src = path.join(CORE_STAGES, sf);
      const dst = path.join(stagesDir, sf);
      if (!fs.existsSync(dst)) {
        console.log(`  \u26a0 缺少 stage: ${sf}`);
        passed = false;
      } else {
        let content = fs.readFileSync(src, 'utf-8');
        content = processStageContent(content, config.stripTraeOnly);
        const original = fs.readFileSync(dst, 'utf-8');
        if (content !== original) {
          console.log(`  \u2717 stage 不一致: ${sf}`);
          passed = false;
        }
      }
    }
    console.log(`  stages 校验: ${stageFiles.length} 个文件`);
  }

  // 3. 校验 agents（检查 _core agents 是否都存在）
  if (fs.existsSync(CORE_AGENTS)) {
    const coreAgents = fs.readdirSync(CORE_AGENTS).filter(f => f.endsWith('.md'));
    let agentOk = 0;
    for (const a of coreAgents) {
      if (fs.existsSync(path.join(agentsDir, a))) {
        agentOk++;
      } else {
        console.log(`  \u26a0 缺少 agent: ${a}`);
        passed = false;
      }
    }
    console.log(`  agents 校验: ${agentOk}/${coreAgents.length} 个文件`);
  }

  return passed;
}

// ============================================================
// 主入口
// ============================================================

function main() {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
dev-flow 跨平台构建脚本

用法:
  node scripts/build.cjs              # 生成所有平台文件
  node scripts/build.cjs <platform>   # 仅生成指定平台
  node scripts/build.cjs --verify     # 校验所有平台
  node scripts/build.cjs <p> --verify # 校验指定平台

支持的平台: ${Object.keys(PLATFORM_CONFIG).join(', ')}

架构:
  _core/SKILL.md (Router ~25KB) → 各平台主文件
  _core/stages/*.md (阶段指令) → 各平台 stages/ 目录
  _core/agents/*.md (Agent 文件) → 各平台 agents/ 目录
    `);
    return;
  }

  const isVerify = args.includes('--verify');
  const targetPlatforms = args.filter(a => PLATFORM_CONFIG[a]);

  const platforms = targetPlatforms.length > 0
    ? Object.fromEntries(targetPlatforms.map(p => [p, PLATFORM_CONFIG[p]]))
    : PLATFORM_CONFIG;

  if (isVerify) {
    console.log('=== 校验模式 ===\n');
    let allPassed = true;
    for (const [platform, config] of Object.entries(platforms)) {
      if (config.skipAutoGen) {
        console.log(`[${platform}] \u23ed 跳过（手动维护平台）`);
        continue;
      }
      console.log(`[${platform}]`);
      const passed = verifyPlatform(platform, config);
      if (!passed) allPassed = false;
    }
    console.log(`\n=== 校验结果: ${allPassed ? '全部通过 \u2713' : '存在差异 \u2717'} ===`);
  } else {
    console.log('=== dev-flow 跨平台构建 ===\n');
    console.log(`核心文件: ${CORE_SKILL}`);
    console.log(`阶段指令: ${CORE_STAGES}`);
    console.log(`Agent文件: ${CORE_AGENTS}`);
    console.log(`目标平台: ${Object.keys(platforms).join(', ')}\n`);

    for (const [platform, config] of Object.entries(platforms)) {
      if (config.skipAutoGen) {
        console.log(`[${platform}] \u23ed 跳过（手动维护平台）`);
        continue;
      }
      try {
        generatePlatform(platform, config);
      } catch (err) {
        console.error(`[${platform}] \u2717 生成失败: ${err.message}`);
      }
    }

    console.log('\n=== 构建完成 ===');
  }
}

main();
