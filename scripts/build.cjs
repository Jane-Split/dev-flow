/**
 * dev-flow 跨平台构建脚本
 * 
 * 从 _core/SKILL.md（单一源真相）和 _platforms/ 适配器生成各平台最终文件。
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
const PLATFORMS_DIR = path.join(ROOT, 'skill-templates', '_platforms');

const PLATFORM_CONFIG = {
  trae: {
    outputDir: 'skill-templates/trae',
    outputFile: 'SKILL.md',
    stripTraeOnly: false,
    useExtraAgents: true,
  },
  cursor: {
    outputDir: 'skill-templates/cursor',
    outputFile: 'dev-flow.md',
    stripTraeOnly: true,
    useExtraAgents: false,
  },
  claude: {
    outputDir: 'skill-templates/claude',
    outputFile: 'dev-flow.md',
    stripTraeOnly: true,
    useExtraAgents: false,
  },
  qoder: {
    outputDir: 'skill-templates/qoder',
    outputFile: 'dev-flow.md',
    stripTraeOnly: true,
    useExtraAgents: false,
  },
  codex: {
    outputDir: 'skill-templates/codex',
    outputFile: 'AGENTS.md',
    stripTraeOnly: true,
    useExtraAgents: false,
    formatCodex: true,
    skipAutoGen: true,
  },
};

// ============================================================
// 核心逻辑
// ============================================================

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * 处理 SKILL.md 内容
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
    // START 独占一行：...\n<!-- START -->\n... → ...\n...
    content = content.replace(
      new RegExp('\\r?\\n' + escapeRegex(TRAE_START) + '\\r?\\n', 'g'),
      '\r\n'
    );
    // END 独占一行：...\n<!-- END -->\n... → ...\n...
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
 * 生成单个平台的 SKILL 文件
 */
function generatePlatform(platform, config) {
  const outputDir = path.join(ROOT, config.outputDir);
  const outputFile = path.join(outputDir, config.outputFile);
  const agentsDir = path.join(outputDir, 'agents');

  console.log(`\n[${platform}] 生成中...`);

  // 1. 主 SKILL 文件
  if (!fs.existsSync(CORE_SKILL)) {
    throw new Error(`核心文件不存在: ${CORE_SKILL}`);
  }
  const coreContent = fs.readFileSync(CORE_SKILL, 'utf-8');
  let processed = processSkillContent(coreContent, config.stripTraeOnly);

  if (config.formatCodex) {
    processed = convertToCodexFormat(processed);
  }

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  fs.writeFileSync(outputFile, processed, 'utf-8');
  console.log(`  \u2713 主文件: ${outputFile} (${processed.split('\n').length} 行)`);

  // 2. Agents
  if (!fs.existsSync(agentsDir)) {
    fs.mkdirSync(agentsDir, { recursive: true });
  }

  if (fs.existsSync(CORE_AGENTS)) {
    const baseAgents = fs.readdirSync(CORE_AGENTS).filter(f => f.endsWith('.md'));
    for (const agent of baseAgents) {
      const src = path.join(CORE_AGENTS, agent);
      const dst = path.join(agentsDir, agent);
      fs.copyFileSync(src, dst);
    }
    console.log(`  \u2713 基准 agents: ${baseAgents.length} 个`);
  }

  if (config.useExtraAgents) {
    const traeAgentsDir = path.join(PLATFORMS_DIR, 'trae', 'agents');
    if (fs.existsSync(traeAgentsDir)) {
      const extraAgents = fs.readdirSync(traeAgentsDir).filter(f => f.endsWith('.md'));
      for (const agent of extraAgents) {
        const src = path.join(traeAgentsDir, agent);
        const dst = path.join(agentsDir, agent);
        fs.copyFileSync(src, dst);
      }
      console.log(`  \u2713 Trae \u72ec\u6709 agents: ${extraAgents.length} 个`);
    }
  }

  console.log(`[${platform}] \u751f\u6210\u5b8c\u6bd5 \u2713`);
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
function verifyPlatform(platform, config, originalContent) {
  const coreContent = fs.readFileSync(CORE_SKILL, 'utf-8');
  let generated = processSkillContent(coreContent, config.stripTraeOnly);
  if (config.formatCodex) {
    generated = convertToCodexFormat(generated);
  }

  if (originalContent === generated) {
    console.log(`[${platform}] \u2713 \u6821\u9a8c\u901a\u8fc7\uff08\u6587\u4ef6\u5185\u5bb9\u4e00\u81f4\uff09`);
    return true;
  } else {
    const existingLines = originalContent.split('\n');
    const generatedLines = generated.split('\n');
    console.log(`[${platform}] \u2717 \u6821\u9a8c\u5931\u8d25\uff01`);
    console.log(`  \u539f\u59cb\u6587\u4ef6: ${existingLines.length} \u884c`);
    console.log(`  \u751f\u6210\u6587\u4ef6: ${generatedLines.length} \u884c`);
    const maxLen = Math.max(existingLines.length, generatedLines.length);
    let firstDiff = -1;
    for (let i = 0; i < maxLen; i++) {
      if (existingLines[i] !== generatedLines[i]) {
        firstDiff = i + 1;
        break;
      }
    }
    if (firstDiff > 0) {
      console.log(`  \u9996\u4e2a\u5dee\u5f02\u884c: ${firstDiff}`);
      console.log(`  \u539f\u59cb: ${(existingLines[firstDiff - 1] || '').substring(0, 80)}`);
      console.log(`  \u751f\u6210: ${(generatedLines[firstDiff - 1] || '').substring(0, 80)}`);
    }
    return false;
  }
}

// ============================================================
// 主入口
// ============================================================

function main() {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
dev-flow \u8de8\u5e73\u53f0\u6784\u5efa\u811a\u672c

\u7528\u6cd5:
  node scripts/build.cjs              # \u751f\u6210\u6240\u6709\u5e73\u53f0\u6587\u4ef6
  node scripts/build.cjs <platform>   # \u4ec5\u751f\u6210\u6307\u5b9a\u5e73\u53f0
  node scripts/build.cjs --verify     # \u6821\u9a8c\u6240\u6709\u5e73\u53f0
  node scripts/build.cjs <p> --verify # \u6821\u9a8c\u6307\u5b9a\u5e73\u53f0

\u652f\u6301\u7684\u5e73\u53f0: ${Object.keys(PLATFORM_CONFIG).join(', ')}
    `);
    return;
  }

  const isVerify = args.includes('--verify');
  const targetPlatforms = args.filter(a => PLATFORM_CONFIG[a]);

  const platforms = targetPlatforms.length > 0
    ? Object.fromEntries(targetPlatforms.map(p => [p, PLATFORM_CONFIG[p]]))
    : PLATFORM_CONFIG;

  if (isVerify) {
    console.log('=== \u6821\u9a8c\u6a21\u5f0f ===\n');
    let allPassed = true;
    for (const [platform, config] of Object.entries(platforms)) {
      if (config.skipAutoGen) {
        console.log(`[${platform}] \u23ed \u8df3\u8fc7\uff08\u624b\u52a8\u7ef4\u62a4\u5e73\u53f0\uff09`);
        continue;
      }
      const outputDir = path.join(ROOT, config.outputDir);
      const outputFile = path.join(outputDir, config.outputFile);

      if (!fs.existsSync(outputFile)) {
        console.log(`[${platform}] \u26a0 \u6587\u4ef6\u4e0d\u5b58\u5728\uff0c\u8df3\u8fc7\u6821\u9a8c: ${outputFile}`);
        continue;
      }

      try {
        const originalContent = fs.readFileSync(outputFile, 'utf-8');
        const passed = verifyPlatform(platform, config, originalContent);
        if (!passed) allPassed = false;
      } catch (err) {
        console.log(`[${platform}] \u2717 \u9519\u8bef: ${err.message}`);
        allPassed = false;
      }
    }
    console.log(`\n=== \u6821\u9a8c\u7ed3\u679c: ${allPassed ? '\u5168\u90e8\u901a\u8fc7 \u2713' : '\u5b58\u5728\u5dee\u5f02 \u2717'} ===`);
  } else {
    console.log('=== dev-flow \u8de8\u5e73\u53f0\u6784\u5efa ===\n');
    console.log(`\u6838\u5fc3\u6587\u4ef6: ${CORE_SKILL}`);
    console.log(`\u76ee\u6807\u5e73\u53f0: ${Object.keys(platforms).join(', ')}\n`);

    for (const [platform, config] of Object.entries(platforms)) {
      if (config.skipAutoGen) {
        console.log(`[${platform}] \u23ed \u8df3\u8fc7\uff08\u624b\u52a8\u7ef4\u62a4\u5e73\u53f0\uff09`);
        continue;
      }
      try {
        generatePlatform(platform, config);
      } catch (err) {
        console.error(`[${platform}] \u2717 \u751f\u6210\u5931\u8d25: ${err.message}`);
      }
    }

    console.log('\n=== \u6784\u5efa\u5b8c\u6210 ===');
  }
}

main();
