const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * StaticValidationSuite — Layer 1 静态验证
 *
 * 机器自动执行，不依赖 AI：
 * 1. 文件存在且非空
 * 2. 无 TODO/FIXME/NotImplemented
 * 3. 无空方法体
 * 4. 语法正确（快速编译检查）
 * 5. 设计契约签名匹配
 * 6. 导入完整性
 */
class StaticValidationSuite {
  constructor(options = {}) {
    this.projectRoot = options.projectRoot || process.cwd();
    this.language = options.language || 'java';
  }

  run(filePath, contract) {
    const results = [];

    results.push(this.checkFileExists(filePath));
    results.push(this.checkNoPlaceholders(filePath));
    results.push(this.checkNoEmptyMethods(filePath));
    results.push(this.checkSyntax(filePath));

    if (contract) {
      results.push(this.checkContractSignatures(filePath, contract));
    }

    results.push(this.checkImports(filePath));

    const blocking = results.filter(r => !r.passed && r.severity === 'BLOCKING');
    const warnings = results.filter(r => !r.passed && r.severity === 'WARNING');

    return {
      passed: blocking.length === 0,
      results,
      blocking,
      warnings,
      summary: {
        total: results.length,
        passed: results.filter(r => r.passed).length,
        failed: results.filter(r => !r.passed).length
      }
    };
  }

  checkFileExists(filePath) {
    const exists = fs.existsSync(filePath);
    const nonEmpty = exists ? fs.statSync(filePath).size > 0 : false;

    return {
      name: 'FILE_EXISTS_AND_NON_EMPTY',
      passed: exists && nonEmpty,
      severity: 'BLOCKING',
      details: { exists, size: exists ? fs.statSync(filePath).size : 0 }
    };
  }

  checkNoPlaceholders(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const placeholders = [];

    const patterns = [
      /TODO[:\s]/gi,
      /FIXME[:\s]/gi,
      /NotImplemented/gi,
      /throw new\s+\w*Exception\s*\(\s*["']not implemented/gi
    ];

    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      for (const pattern of patterns) {
        if (pattern.test(lines[i])) {
          placeholders.push({ line: i + 1, text: lines[i].trim() });
        }
      }
    }

    return {
      name: 'NO_PLACEHOLDERS',
      passed: placeholders.length === 0,
      severity: 'BLOCKING',
      details: { placeholders }
    };
  }

  checkNoEmptyMethods(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const emptyMethods = [];

    const patterns = {
      java: /(?:public|private|protected)\s+[\w<>\[\]]+\s+\w+\s*\([^)]*\)\s*\{\s*\}/g,
      ts: /(?:public|private|protected)?\s*[\w<>\[\]]+\s+\w+\s*\([^)]*\)\s*\{\s*\}/g,
      js: /\w+\s*\([^)]*\)\s*\{\s*\}/g,
      py: /def\s+\w+\s*\([^)]*\):\s*\n\s*pass/g,
      go: /func\s+\w+\s*\([^)]*\)\s*[\w<>\[\]]*\s*\{\s*\}/g
    };

    const pattern = patterns[this.language] || patterns.java;
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const lineNum = content.substring(0, match.index).split('\n').length;
      emptyMethods.push({ line: lineNum, signature: match[0].substring(0, 80) });
    }

    return {
      name: 'NO_EMPTY_METHODS',
      passed: emptyMethods.length === 0,
      severity: 'BLOCKING',
      details: { emptyMethods }
    };
  }

  checkSyntax(filePath) {
    const commands = {
      java: `javac -d /tmp/compiled -sourcepath ${this.projectRoot}/src/main/java ${filePath} 2>&1`,
      ts: `npx tsc --noEmit ${filePath} 2>&1`,
      js: `node --check ${filePath} 2>&1`,
      py: `python -m py_compile ${filePath} 2>&1`,
      go: `go build -o /dev/null ${filePath} 2>&1`
    };

    const command = commands[this.language];
    if (!command) {
      return {
        name: 'SYNTAX_CHECK',
        passed: true,
        severity: 'WARNING',
        details: { message: `No syntax checker for language: ${this.language}` }
      };
    }

    try {
      const output = execSync(command, { encoding: 'utf8', timeout: 30000 });
      return {
        name: 'SYNTAX_CHECK',
        passed: true,
        severity: 'BLOCKING',
        details: { output }
      };
    } catch (error) {
      return {
        name: 'SYNTAX_CHECK',
        passed: false,
        severity: 'BLOCKING',
        details: { error: error.stdout || error.message }
      };
    }
  }

  checkContractSignatures(filePath, contract) {
    const content = fs.readFileSync(filePath, 'utf8');
    const issues = [];

    for (const method of contract.methods || []) {
      const methodPattern = new RegExp(
        `(?:public|private|protected)?\\s*` +
        `${method.returnType.replace(/[\[\]]/g, '\\$&')}\\s+` +
        `${method.name}\\s*\\(`,
        'g'
      );

      if (!methodPattern.test(content)) {
        issues.push({
          type: 'METHOD_NOT_FOUND',
          method: method.name,
          expected: `${method.returnType} ${method.name}(...)`
        });
      }
    }

    return {
      name: 'CONTRACT_SIGNATURE_MATCH',
      passed: issues.length === 0,
      severity: 'BLOCKING',
      details: { issues }
    };
  }

  checkImports(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const unresolved = [];

    const importPatterns = {
      java: /import\s+([\w.]+);/g,
      ts: /import\s+.*?from\s+['"]([^'"]+)['"];?/g,
      js: /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
      py: /import\s+([\w.]+)|from\s+([\w.]+)\s+import/g,
      go: /import\s+["']([^"']+)["']/g
    };

    const pattern = importPatterns[this.language];
    if (pattern) {
      const imports = [];
      let match;
      while ((match = pattern.exec(content)) !== null) {
        imports.push(match[1] || match[2]);
      }

      for (const imp of imports) {
        const resolved = this.resolveImport(imp, filePath);
        if (!resolved.found) {
          unresolved.push({ import: imp, reason: resolved.reason });
        }
      }
    }

    return {
      name: 'IMPORT_RESOLUTION',
      passed: unresolved.length === 0,
      severity: 'WARNING',
      details: { unresolved }
    };
  }

  resolveImport(importPath, currentFile) {
    const possiblePaths = [
      path.join(this.projectRoot, 'src', 'main', this.language, importPath.replace(/\./g, '/') + '.java'),
      path.join(this.projectRoot, 'node_modules', importPath),
      path.join(path.dirname(currentFile), importPath)
    ];

    for (const p of possiblePaths) {
      if (fs.existsSync(p) || fs.existsSync(p + '.js') || fs.existsSync(p + '.ts')) {
        return { found: true, path: p };
      }
    }

    return { found: false, reason: 'File not found in project' };
  }
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const filePath = args[0];
  const contractPath = args[1];

  if (!filePath) {
    console.error('Usage: node static-validation-suite.cjs <file> [contract.yaml]');
    process.exit(1);
  }

  let contract = null;
  if (contractPath) {
    contract = require('js-yaml').load(fs.readFileSync(contractPath, 'utf8'));
  }

  const suite = new StaticValidationSuite({
    projectRoot: process.cwd(),
    language: path.extname(filePath).replace('.', '') === 'ts' ? 'ts' : 'java'
  });

  const result = suite.run(filePath, contract);
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.passed ? 0 : 1);
}

module.exports = { StaticValidationSuite };
