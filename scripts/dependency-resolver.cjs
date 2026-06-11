const fs = require('fs');
const path = require('path');

/**
 * DependencyResolver — 多候选依赖解析
 *
 * 当存在多个同名类时，通过置信度评分选择最可能的目标。
 */
class DependencyResolver {
  constructor(options = {}) {
    this.projectRoot = options.projectRoot || process.cwd();
    this.minConfidence = options.minConfidence || 0.8;
  }

  resolve(className, context = {}) {
    const candidates = this.findAllCandidates(className);

    if (candidates.length === 0) {
      return { status: 'NOT_FOUND', candidates: [] };
    }

    if (candidates.length === 1) {
      return {
        status: 'UNIQUE',
        candidate: candidates[0],
        confidence: 1.0
      };
    }

    const scored = candidates.map(c => ({
      path: c,
      confidence: this.calculateConfidence(className, c, context)
    })).sort((a, b) => b.confidence - a.confidence);

    if (scored[0].confidence >= this.minConfidence) {
      return {
        status: 'HIGH_CONFIDENCE',
        candidate: scored[0].path,
        confidence: scored[0].confidence,
        alternatives: scored.slice(1, 3)
      };
    }

    return {
      status: 'AMBIGUOUS',
      candidates: scored.slice(0, 5),
      disambiguationHint: this.generateDisambiguationHint(scored, context)
    };
  }

  findAllCandidates(className) {
    const results = [];
    const extensions = ['.java', '.ts', '.tsx', '.js', '.py', '.go'];

    const walk = (dir, depth = 0) => {
      if (depth > 15) return;

      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          if (['node_modules', '.git', 'target', 'build', 'dist'].includes(entry.name)) {
            continue;
          }
          walk(fullPath, depth + 1);
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name);
          const base = path.basename(entry.name, ext);
          if (base === className && extensions.includes(ext)) {
            results.push(fullPath);
          }
        }
      }
    };

    walk(this.projectRoot);
    return results;
  }

  calculateConfidence(className, candidatePath, context) {
    let score = 0;
    const pathParts = candidatePath.split(path.sep);
    const classLower = className.toLowerCase();

    // 1. 路径语义匹配（40%）
    const semanticMatch = pathParts.some(p =>
      p.toLowerCase().includes(classLower.replace(/service|controller|entity|mapper/g, ''))
    );
    score += (semanticMatch ? 1 : 0) * 0.4;

    // 2. 引用频率（30%）
    const refCount = this.getReferenceCount(candidatePath);
    score += Math.min(refCount / 10, 1) * 0.3;

    // 3. 最近修改（15%）
    const recency = this.getRecencyScore(candidatePath);
    score += recency * 0.15;

    // 4. 与当前文件关联度（15%）
    if (context.currentFile) {
      const currentDir = path.dirname(context.currentFile);
      const candidateDir = path.dirname(candidatePath);
      const similarity = this.pathSimilarity(currentDir, candidateDir);
      score += similarity * 0.15;
    }

    return Math.min(score, 1.0);
  }

  getReferenceCount(filePath) {
    try {
      const className = path.basename(filePath, path.extname(filePath));
      return 0; // Placeholder for actual implementation
    } catch {
      return 0;
    }
  }

  getRecencyScore(filePath) {
    try {
      const stats = fs.statSync(filePath);
      const ageDays = (Date.now() - stats.mtimeMs) / (1000 * 60 * 60 * 24);
      return Math.max(0, 1 - ageDays / 30);
    } catch {
      return 0;
    }
  }

  pathSimilarity(path1, path2) {
    const parts1 = path1.split(path.sep);
    const parts2 = path2.split(path.sep);
    const common = parts1.filter((p, i) => parts2[i] === p).length;
    return common / Math.max(parts1.length, parts2.length);
  }

  generateDisambiguationHint(scored, context) {
    const lines = ['多个候选类发现，请确认：'];

    for (let i = 0; i < Math.min(scored.length, 3); i++) {
      const c = scored[i];
      lines.push(`${i + 1}. ${c.path} (置信度: ${(c.confidence * 100).toFixed(1)}%)`);
    }

    lines.push('');
    lines.push('确认命令:');
    lines.push(`Read: {"file_path": "${scored[0].path}", "limit": 30}`);

    return lines.join('\n');
  }
}

module.exports = { DependencyResolver };

if (require.main === module) {
  const [className, projectRoot] = process.argv.slice(2);
  if (!className) {
    console.error('Usage: node dependency-resolver.cjs <ClassName> [projectRoot]');
    process.exit(1);
  }

  const resolver = new DependencyResolver({ projectRoot: projectRoot || '.' });
  const result = resolver.resolve(className);
  console.log(JSON.stringify(result, null, 2));
}
