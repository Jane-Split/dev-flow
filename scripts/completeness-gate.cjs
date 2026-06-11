const fs = require('fs');
const path = require('path');

/**
 * CompletenessGate — 完整性门控
 * 
 * 在 prepare-context 生成 task-brief 后执行，检查：
 * 1. 无截断的依赖文件
 * 2. 无缺失的核心依赖
 * 3. 设计契约结构完整
 */
class CompletenessGate {
  constructor(options = {}) {
    this.maxFileSizeKB = options.maxFileSizeKB || 30;
    this.truncatedMarker = options.truncatedMarker || '/* 文件过大';
    this.truncatedMarkerEn = options.truncatedMarkerEn || '/* File too large';
    this.corePatterns = [
      /Service\.(java|ts|js|py|go)$/,
      /Controller\.(java|ts|js|py|go)$/,
      /Entity\.(java|ts|js|py|go)$/,
      /Mapper\.(java|ts|js|py|go)$/,
      /Repository\.(java|ts|js|py|go)$/
    ];
  }

  check({ taskBrief, dependencies, contractContent }) {
    const issues = [];

    // Check 1: 截断文件检测
    for (const dep of dependencies || []) {
      if (this.isTruncated(dep.content)) {
        issues.push({
          type: 'TRUNCATED_DEPENDENCY',
          file: dep.path,
          size: dep.originalSize || 0,
          severity: 'BLOCKING'
        });
      }
    }

    // Check 2: 核心依赖缺失检测
    for (const dep of dependencies || []) {
      if (dep.content === null && this.isCoreDependency(dep.path)) {
        issues.push({
          type: 'MISSING_CORE_DEPENDENCY',
          file: dep.path,
          severity: 'BLOCKING'
        });
      }
    }

    // Check 3: 契约完整性（如果提供）
    if (contractContent) {
      const contractCheck = this.validateContractStructure(contractContent);
      if (!contractCheck.valid) {
        issues.push({
          type: 'INVALID_CONTRACT_STRUCTURE',
          details: contractCheck.errors,
          severity: 'WARNING'
        });
      }
    }

    const blockingIssues = issues.filter(i => i.severity === 'BLOCKING');
    const passed = blockingIssues.length === 0;

    return {
      passed,
      issues,
      recommendation: passed ? null : this.generateRecommendation(issues)
    };
  }

  isTruncated(content) {
    if (!content || typeof content !== 'string') return false;
    return content.includes(this.truncatedMarker) || 
           content.includes(this.truncatedMarkerEn);
  }

  isCoreDependency(filePath) {
    return this.corePatterns.some(pattern => pattern.test(filePath));
  }

  validateContractStructure(content) {
    const requiredSections = ['class', 'methods'];
    const errors = [];
    
    for (const section of requiredSections) {
      if (!content.includes(`${section}:`)) {
        errors.push(`Missing required section: ${section}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  generateRecommendation(issues) {
    const truncated = issues.filter(i => i.type === 'TRUNCATED_DEPENDENCY');
    const missing = issues.filter(i => i.type === 'MISSING_CORE_DEPENDENCY');

    if (truncated.length > 0) {
      const totalOversized = truncated.reduce((sum, t) => sum + (t.size || 0), 0);
      const avgSize = totalOversized / truncated.length;

      if (truncated.length >= 2 || avgSize > 100 * 1024) {
        return {
          action: 'SPLIT_TASK',
          reason: `任务依赖 ${truncated.length} 个超大文件（平均 ${Math.round(avgSize/1024)}KB），建议拆分任务`,
          details: truncated.map(t => ({ file: t.file, size: t.size }))
        };
      }

      return {
        action: 'ON_DEMAND_LOAD',
        reason: `单个文件 ${truncated[0].file} (${Math.round(truncated[0].size/1024)}KB) 超过限制，建议按需加载`,
        files: truncated.map(t => t.file)
      };
    }

    if (missing.length > 0) {
      return {
        action: 'EXPAND_SEARCH',
        reason: `${missing.length} 个核心依赖未找到，建议扩展搜索范围`,
        files: missing.map(m => m.file)
      };
    }

    return {
      action: 'HUMAN_REVIEW',
      reason: '存在非标准问题，建议人工审查',
      issues
    };
  }
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const briefPath = args[0];
  
  if (!briefPath) {
    console.error('Usage: node completeness-gate.cjs <task-brief.yaml>');
    process.exit(1);
  }

  const brief = require('js-yaml').load(fs.readFileSync(briefPath, 'utf8'));
  const gate = new CompletenessGate();
  const result = gate.check({
    taskBrief: brief,
    dependencies: brief.dependencies || []
  });

  console.log(JSON.stringify(result, null, 2));
  process.exit(result.passed ? 0 : 1);
}

module.exports = { CompletenessGate };
