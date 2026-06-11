/**
 * LogicCoverageAnalyzer — R5 逻辑覆盖率自动化
 *
 * 通过 AST 解析自动匹配 design step ↔ code block。
 * 当前版本使用简化正则（生产环境应使用完整 AST parser）。
 */
class LogicCoverageAnalyzer {
  constructor(options = {}) {
    this.language = options.language || 'java';
    this.confidenceThreshold = options.confidenceThreshold || 0.5;
  }

  /**
   * 分析单个代码文件与设计契约的覆盖率
   * @param {string} filePath - 代码文件路径
   * @param {object} contract - 设计契约对象
   * @returns {object} 覆盖率分析结果
   */
  analyze(filePath, contract) {
    const fs = require('fs');
    const content = fs.readFileSync(filePath, 'utf8');

    // 提取设计步骤
    const designSteps = (contract.methods?.[0]?.logicSteps || []).map((step, idx) => ({
      id: `step-${idx + 1}`,
      description: step.description,
      keywords: this.extractKeywords(step.description)
    }));

    if (designSteps.length === 0) {
      return { coverage: 1.0, matches: [], unmappedSteps: [], unmappedBlocks: [] };
    }

    // 提取代码控制流块
    const codeBlocks = this.extractControlFlow(content);

    const matches = [];
    const matchedBlocks = new Set();

    for (const step of designSteps) {
      const matchedBlock = this.findBestMatch(step, codeBlocks, matchedBlocks);
      matches.push({
        step: step.id,
        description: step.description,
        matched: matchedBlock !== null,
        confidence: matchedBlock ? matchedBlock.confidence : 0,
        codeLocation: matchedBlock ? matchedBlock.lines : null,
        matchedCode: matchedBlock ? matchedBlock.code : null
      });

      if (matchedBlock) {
        matchedBlocks.add(matchedBlock);
      }
    }

    const coverage = matches.filter(m => m.matched).length / matches.length;

    return {
      coverage,
      matches,
      unmappedSteps: matches.filter(m => !m.matched).map(m => m.step),
      unmappedBlocks: codeBlocks.filter(b => !matchedBlocks.has(b)).map(b => ({
        type: b.type,
        lines: b.lines
      }))
    };
  }

  /**
   * 从步骤描述中提取关键词
   * @param {string} description - 步骤描述
   * @returns {string[]} 关键词列表
   */
  extractKeywords(description) {
    const words = description
      .toLowerCase()
      .replace(/[，。！？、；：""''（）【】]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length >= 2);

    // 如果没有空格分隔的中文，按字符分词（2字以上）
    if (words.length === 1 && words[0].length > 4) {
      const chars = [];
      for (let i = 0; i < words[0].length - 1; i++) {
        chars.push(words[0].substring(i, i + 2));
      }
      return [...new Set(chars)];
    }

    return [...new Set(words)];
  }

  /**
   * 提取代码中的控制流块
   * @param {string} content - 代码内容
   * @returns {object[]} 控制流块列表
   */
  extractControlFlow(content) {
    const blocks = [];
    const lines = content.split('\n');

    const patterns = [
      { type: 'if', regex: /if\s*\(/ },
      { type: 'for', regex: /for\s*\(/ },
      { type: 'while', regex: /while\s*\(/ },
      { type: 'try', regex: /try\s*\{/ },
      { type: 'catch', regex: /catch\s*\(/ },
      { type: 'method_call', regex: /(?:\b|\.|\bnew\s+)(\w+)\s*\(/ }
    ];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      for (const { type, regex } of patterns) {
        const match = line.match(regex);
        if (match) {
          blocks.push({
            type,
            code: line.substring(0, 100),
            lines: [i + 1, i + 1],
            condition: type === 'if' ? line : null,
            name: type === 'method_call' ? match[1] : null
          });
        }
      }
    }

    return blocks;
  }

  /**
   * 为设计步骤寻找最佳匹配的代码块
   * @param {object} step - 设计步骤
   * @param {object[]} codeBlocks - 代码块列表
   * @param {Set} alreadyMatched - 已匹配的代码块集合
   * @returns {object|null} 最佳匹配结果
   */
  findBestMatch(step, codeBlocks, alreadyMatched) {
    let best = null;
    let bestScore = 0;

    for (const block of codeBlocks) {
      if (alreadyMatched.has(block)) continue;

      const score = this.calculateMatchScore(step, block);
      if (score > bestScore && score >= this.confidenceThreshold) {
        best = block;
        bestScore = score;
      }
    }

    if (best) {
      best.confidence = bestScore;
      return best;
    }
    return null;
  }

  /**
   * 计算步骤与代码块的匹配分数
   * @param {object} step - 设计步骤
   * @param {object} block - 代码块
   * @returns {number} 匹配分数（0-1）
   */
  calculateMatchScore(step, block) {
    let score = 0;

    // 关键词匹配（权重 50%）
    const keywordMatch = step.keywords.filter(k =>
      block.code?.toLowerCase().includes(k) ||
      block.name?.toLowerCase().includes(k)
    ).length / Math.max(step.keywords.length, 1);
    score += keywordMatch * 0.5;

    // 语义对齐（权重 30%）
    const semanticMatch = this.checkSemanticAlignment(step, block);
    score += semanticMatch * 0.3;

    // 位置对齐（权重 20%）
    const positionMatch = this.checkPositionAlignment(step, block);
    score += positionMatch * 0.2;

    // 名称直接映射加分：方法名与描述中的英文关键词匹配
    const nameBonus = this.checkNameMapping(step, block);
    score += nameBonus * 0.2;

    return Math.min(score, 1.0);
  }

  /**
   * 检查方法名与步骤描述的直接映射关系
   * @param {object} step - 设计步骤
   * @param {object} block - 代码块
   * @returns {number} 映射分数
   */
  checkNameMapping(step, block) {
    const name = (block.name || '').toLowerCase();
    if (!name) return 0;

    const desc = step.description.toLowerCase();

    const mappings = [
      { keywords: ['校验', '验证', '检查', 'validate'], names: ['validate', 'check', 'verify', 'assert'] },
      { keywords: ['查询', '获取', '查找', 'get'], names: ['get', 'find', 'query', 'select', 'search', 'fetch'] },
      { keywords: ['保存', '写入', '存储', 'save'], names: ['save', 'insert', 'update', 'persist', 'store', 'write'] },
      { keywords: ['计算', '算出', 'calculate'], names: ['calculate', 'compute', 'count', 'sum', 'avg'] },
      { keywords: ['删除', 'remove', 'delete'], names: ['delete', 'remove', 'del', 'drop'] },
      { keywords: ['创建', '新建', 'create'], names: ['create', 'new', 'build', 'init'] }
    ];

    for (const mapping of mappings) {
      const descMatch = mapping.keywords.some(k => desc.includes(k));
      const nameMatch = mapping.names.some(n => name.includes(n));
      if (descMatch && nameMatch) {
        return 1.0;
      }
    }

    return 0;
  }

  /**
   * 检查步骤描述与代码块的语义对齐程度
   * @param {object} step - 设计步骤
   * @param {object} block - 代码块
   * @returns {number} 语义对齐分数
   */
  checkSemanticAlignment(step, block) {
    const desc = step.description.toLowerCase();
    const name = (block.name || '').toLowerCase();

    // 校验/验证类步骤 → if / try / 含 validate/check/verify 的方法调用
    if ((desc.includes('校验') || desc.includes('验证') || desc.includes('检查') || desc.includes('validate')) &&
        (block.type === 'if' || block.type === 'try' ||
         (block.type === 'method_call' && (name.includes('validate') || name.includes('check') || name.includes('verify'))))) {
      return 0.9;
    }

    // 查询/获取类步骤 → 方法调用
    if ((desc.includes('查询') || desc.includes('获取') || desc.includes('查找') || desc.includes('get')) &&
        block.type === 'method_call') {
      return 0.8;
    }

    // 保存/写入类步骤 → 含 save/insert/update/persist 的方法调用
    if ((desc.includes('保存') || desc.includes('写入') || desc.includes('存储') || desc.includes('save')) &&
        block.type === 'method_call' &&
        (name.includes('save') || name.includes('insert') || name.includes('update') || name.includes('persist'))) {
      return 0.85;
    }

    // 计算类步骤 → 含 calculate/compute 的方法调用
    if ((desc.includes('计算') || desc.includes('算出') || desc.includes('calculate')) &&
        block.type === 'method_call' &&
        (name.includes('calculate') || name.includes('compute') || name.includes('count'))) {
      return 0.85;
    }

    return 0.3;
  }

  /**
   * 检查位置对齐程度（简化版，返回固定分数）
   * @returns {number} 位置对齐分数
   */
  checkPositionAlignment() {
    return 0.5;
  }
}

module.exports = { LogicCoverageAnalyzer };

// CLI 入口
if (require.main === module) {
  const fs = require('fs');
  const yaml = require('js-yaml');

  const [filePath, contractPath] = process.argv.slice(2);
  if (!filePath || !contractPath) {
    console.error('Usage: node logic-coverage-auto.cjs <file> <contract.yaml>');
    process.exit(1);
  }

  const contract = yaml.load(fs.readFileSync(contractPath, 'utf8'));
  const analyzer = new LogicCoverageAnalyzer();
  const result = analyzer.analyze(filePath, contract);

  console.log(`Coverage: ${(result.coverage * 100).toFixed(1)}%`);
  console.log(JSON.stringify(result, null, 2));
}
