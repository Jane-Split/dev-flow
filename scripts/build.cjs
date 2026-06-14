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

/**
 * 处理 LANGUAGE-ONLY 标记
 * 格式: <!-- LANGUAGE-ONLY: java -->内容<!-- /LANGUAGE-ONLY: java -->
 * --lang 未指定时保留全部内容；指定时仅保留匹配语言 + 'all'
 */
function processLanguageOnly(content, targetLanguages) {
  // 始终移除 LANGUAGE-ONLY 标记（它们是构建时标记，不应出现在运行时产物中）
  // --lang 未指定时保留所有内容（仅移除标记），指定时仅保留匹配语言
  const regex = /<!--\s*LANGUAGE-ONLY:\s*([a-zA-Z,\s]+)\s*-->([\s\S]*?)<!--\s*\/LANGUAGE-ONLY:\s*\1\s*-->/g;
  content = content.replace(regex, (match, langList, innerContent) => {
    if (targetLanguages && targetLanguages.length > 0) {
      const allowedLangs = langList.split(',').map(s => s.trim().toLowerCase());
      if (allowedLangs.includes('all') || allowedLangs.some(l => targetLanguages.includes(l))) {
        return innerContent;
      }
      return ''; // 移除不匹配语言的内容
    }
    return innerContent; // 无 --lang 时保留所有内容
  });
  // 清理连续空行
  content = content.replace(/(\r?\n){3,}/g, '\r\n\r\n');
  return content;
}

/**
 * 解析 YAML frontmatter 并处理平台特定内容
 * 支持 platforms: [trae] / platforms: [cursor, claude] / platforms: [all]
 * 内容标记: <!-- PLATFORM-ONLY: trae -->...<!-- /PLATFORM-ONLY: trae -->
 */
function processFrontmatter(content, targetPlatform, config) {
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n/);
  if (!frontmatterMatch) return content;

  const fm = frontmatterMatch[1];
  const lines = fm.split('\n');
  let platforms = null;

  for (const line of lines) {
    const match = line.match(/^platforms:\s*\[([^\]]+)\]/);
    if (match) {
      platforms = match[1].split(',').map(s => s.trim());
    }
  }

  // 如果 platforms 字段存在但当前平台不在列表中，且列表不含 'all'
  // 则仅处理 frontmatter 中的平台标记（不隐藏整个文件）
  // platforms 字段主要用于元数据声明，不影响内容过滤

  // 处理 PLATFORM-ONLY 标记（比 TRAE-ONLY 更灵活）
  // 格式: <!-- PLATFORM-ONLY: trae,cursor -->内容<!-- /PLATFORM-ONLY: trae,cursor -->
  const platformOnlyRegex = /<!--\s*PLATFORM-ONLY:\s*([a-zA-Z,\s]+)\s*-->([\s\S]*?)<!--\s*\/PLATFORM-ONLY:\s*\1\s*-->/g;
  content = content.replace(platformOnlyRegex, (match, platformList, innerContent) => {
    const allowedPlatforms = platformList.split(',').map(s => s.trim().toLowerCase());
    if (allowedPlatforms.includes('all') || allowedPlatforms.includes(targetPlatform)) {
      return innerContent;
    }
    return ''; // 移除不属于当前平台的内容
  });

  return content;
}

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
function generatePlatform(platform, config, targetLanguages) {
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
  // 平台 frontmatter 处理
  processed = processFrontmatter(processed, platform, config);

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

  // LANGUAGE-ONLY 过滤
  processed = processLanguageOnly(processed, targetLanguages);

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
      // 平台 frontmatter 处理
      content = processFrontmatter(content, platform, config);
      // 平台特定路径替换
      if (config.stagesPath) {
        content = content.replace(/\{\{STAGES_PATH\}\}/g, config.stagesPath);
      }
      if (config.agentsPath) {
        content = content.replace(/\{\{AGENTS_PATH\}\}/g, config.agentsPath);
      }
      if (config.referencesPath) {
        content = content.replace(/\{\{REFERENCES_PATH\}\}/g, config.referencesPath);
      }
      // LANGUAGE-ONLY 过滤
      content = processLanguageOnly(content, targetLanguages);
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
      // 平台 frontmatter 处理
      content = processFrontmatter(content, platform, config);
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
      // LANGUAGE-ONLY 过滤
      content = processLanguageOnly(content, targetLanguages);
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
      if (config.referencesPath) {
        content = content.replace(/\{\{REFERENCES_PATH\}\}/g, config.referencesPath);
      }
      // LANGUAGE-ONLY 过滤
      content = processLanguageOnly(content, targetLanguages);
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
          const _copyContent = fs.readFileSync(src, 'utf-8');
          fs.writeFileSync(dst, _copyContent, 'utf-8');
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
function verifyPlatform(platform, config, targetLanguages) {
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
    generated = processFrontmatter(generated, platform, config);
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
    // LANGUAGE-ONLY 过滤
    generated = processLanguageOnly(generated, targetLanguages);
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
        content = processFrontmatter(content, platform, config);
        // 平台特定路径替换（与 generatePlatform 保持一致）
        if (config.stagesPath) {
          content = content.replace(/\{\{STAGES_PATH\}\}/g, config.stagesPath);
        }
        if (config.agentsPath) {
          content = content.replace(/\{\{AGENTS_PATH\}\}/g, config.agentsPath);
        }
        if (config.referencesPath) {
          content = content.replace(/\{\{REFERENCES_PATH\}\}/g, config.referencesPath);
        }
        // LANGUAGE-ONLY 过滤
        content = processLanguageOnly(content, targetLanguages);
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
支持的语言: java, typescript, python, go

架构:
  _core/SKILL.md (Router ~25KB) → 各平台主文件
  _core/stages/*.md (阶段指令) → 各平台 stages/ 目录
  _core/agents/*.md (Agent 文件) → 各平台 agents/ 目录
    `);
    return;
  }

  const isVerify = args.includes('--verify');
  const targetPlatforms = args.filter(a => PLATFORM_CONFIG[a]);

  // 解析 --lang 参数（语言过滤，用于 LANGUAGE-ONLY 标记）
  let targetLanguages = [];
  const langIdx = args.indexOf('--lang');
  if (langIdx !== -1 && args[langIdx + 1]) {
    targetLanguages = args[langIdx + 1].split(',').map(s => s.trim().toLowerCase());
  }

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
      const passed = verifyPlatform(platform, config, targetLanguages);
      if (!passed) allPassed = false;
    }
    console.log(`\n=== 校验结果: ${allPassed ? '全部通过 \u2713' : '存在差异 \u2717'} ===`);
  } else {
    console.log('=== dev-flow 跨平台构建 ===\n');
    console.log(`核心文件: ${CORE_SKILL}`);
    console.log(`阶段指令: ${CORE_STAGES}`);
    console.log(`Agent文件: ${CORE_AGENTS}`);
    console.log(`目标平台: ${Object.keys(platforms).join(', ')}`);
    if (targetLanguages.length > 0) {
      console.log(`语言过滤: ${targetLanguages.join(', ')} (仅保留匹配语言内容)`);
    }
    console.log('');

    for (const [platform, config] of Object.entries(platforms)) {
      if (config.skipAutoGen) {
        console.log(`[${platform}] \u23ed 跳过（手动维护平台）`);
        continue;
      }
      try {
        generatePlatform(platform, config, targetLanguages);
      } catch (err) {
        console.error(`[${platform}] \u2717 生成失败: ${err.message}`);
      }
    }

    console.log('\n=== 构建完成 ===');
  }
}

main();
