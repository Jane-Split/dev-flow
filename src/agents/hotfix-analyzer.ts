// src/agents/hotfix-analyzer.ts
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { fileExists } from '../utils/fs-utils.js';

export type ErrorType = 'syntax' | 'logic' | 'type' | 'dependency' | 'config' | 'runtime';

export interface Fix {
  file: string;
  originalCode: string;
  fixedCode: string;
  explanation: string;
}

// 错误类型关键词映射
const ERROR_TYPE_PATTERNS: { pattern: RegExp; type: ErrorType }[] = [
  { pattern: /syntax\s*error|unexpected\s*token|unexpected\s*identifier|missing\s*\)|missing\s*\}|parsing\s*error/i, type: 'syntax' },
  { pattern: /cannot\s*find\s*module|module\s*not\s*found|resolve\s*failed|dependency\s*not\s*found|unresolved\s*import/i, type: 'dependency' },
  { pattern: /cannot\s*read\s*property|is\s*not\s*a\s*function|null\s*reference|undefined\s*is\s*not|null\s*pointer/i, type: 'runtime' },
  { pattern: /enoent|no\s*such\s*file|file\s*not\s*found|\.env|environment\s*variable|tsconfig|webpack|vite|rollup|config/i, type: 'config' },
  { pattern: /logic\s*error|wrong\s*result|incorrect|unexpected\s*behavior|off\s*by\s*one|infinite\s*loop|does\s*not\s*match/i, type: 'logic' },
  { pattern: /property\s*['"].*?['"]\s*does\s*not\s*exist|type\s*['"].*?['"]\s*is\s*not\s*assignable|cannot\s*assign|is\s*not\s*assignable|argument\s*of\s*type/i, type: 'type' },
  { pattern: /runtime\s*error|reference\s*error|type\s*error/i, type: 'runtime' },
];

/**
 * 从错误描述判断错误类型
 */
export function parseErrorType(description: string): ErrorType {
  const lower = description.toLowerCase();

  for (const { pattern, type } of ERROR_TYPE_PATTERNS) {
    if (pattern.test(lower)) {
      return type;
    }
  }

  // 默认归类为 runtime 错误
  return 'runtime';
}

/**
 * 从错误描述中提取文件名线索
 */
function extractFileClues(description: string): string[] {
  const clues: string[] = [];

  // 匹配常见文件路径模式: src/xxx.ts, ./xxx.ts, xxx/xxx.tsx
  const allExts = '(?:ts|tsx|js|jsx|vue|java|py|go|rs|rb|php|kt|cs)';
  const pathPatterns = [
    /(?:src|lib|app|pages|components|utils|services|api|hooks|models|controllers|routes|views)[/\\][\w./\\-]+\.(?:ts|tsx|js|jsx|vue)/gi,
    /(?:\.\/)?[\w./\\-]+\.(?:ts|tsx|js|jsx|vue)/gi,
    // Java 路径模式: src/main/java/com/xxx/XxxService.java
    /src\/main\/java\/[\w./\\-]+\.java/gi,
    /src\/main\/kotlin\/[\w./\\-]+\.kt/gi,
    /src\/test\/java\/[\w./\\-]+\.java/gi,
    // Python 路径模式: app/views.py, myapp/services/user_service.py
    /(?:app|myapp|src|lib|services|views|utils|handlers|routes|api)[/\\][\w./\\-]+\.py/gi,
    // Go 路径模式: cmd/xxx/main.go, pkg/xxx/xxx.go
    /(?:cmd|pkg|internal)[/\\][\w./\\-]+\.go/gi,
    // Rust 路径模式: src/main.rs, src/lib.rs
    /src\/[\w./\\-]+\.rs/gi,
    // 通用多语言路径模式
    new RegExp(`(?:src|lib|app)[/\\\\][\\w./\\\\-]+\\.${allExts}`, 'gi'),
    new RegExp(`(?:\\.\\/)?[\\w./\\\\-]+\\.${allExts}`, 'gi'),
  ];

  for (const pattern of pathPatterns) {
    const matches = description.match(pattern);
    if (matches) {
      clues.push(...matches.map(m => m.replace(/^\.\//, '')));
    }
  }

  return clues;
}

/**
 * 从错误描述中提取关键词用于文件搜索
 */
function extractKeywords(description: string): string[] {
  const keywords: string[] = [];

  // 提取驼峰/短横线命名的标识符
  const identifierPattern = /\b[a-zA-Z][a-zA-Z0-9]*(?:\s*[A-Z][a-zA-Z0-9]*)*\b/g;
  const identifiers = description.match(identifierPattern);
  if (identifiers) {
    // 过滤常见英文停用词和编程关键字
    const stopWords = new Set([
      'error', 'type', 'cannot', 'not', 'is', 'the', 'a', 'an', 'of', 'in',
      'to', 'for', 'and', 'or', 'but', 'with', 'from', 'at', 'by', 'on',
      'that', 'this', 'it', 'has', 'have', 'had', 'was', 'were', 'been',
      'function', 'class', 'const', 'let', 'var', 'return', 'import',
      'export', 'default', 'async', 'await', 'new', 'throw', 'try', 'catch',
      'undefined', 'null', 'string', 'number', 'boolean', 'object', 'array',
      'expected', 'found', 'missing', 'property', 'module', 'file',
    ]);

    for (const id of identifiers) {
      const lower = id.toLowerCase();
      if (id.length > 2 && !stopWords.has(lower) && /[A-Z]/.test(id)) {
        keywords.push(id);
      }
    }
  }

  return keywords;
}

/**
 * 递归搜索项目中的源文件
 */
async function findSourceFiles(projectRoot: string): Promise<string[]> {
  const extensions = ['.ts', '.tsx', '.js', '.jsx', '.vue', '.java', '.py', '.go', '.rs', '.rb', '.php', '.kt', '.cs'];
  const results: string[] = [];
  const excludeDirs = new Set([
    'node_modules', 'dist', '.git', '.next', '.nuxt', 'build', 'coverage',
    '.dev-flow', '.vscode', '.idea', 'target', 'bin', 'obj', '__pycache__',
    '.gradle', '.mvn', 'vendor', 'venv', '.venv',
  ]);

  async function walk(dir: string, depth: number): Promise<void> {
    if (depth > 10) return;

    let entries;
    try {
      entries = await fs.readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      if (entry.name.startsWith('.') && entry.name !== '.env') continue;

      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        if (!excludeDirs.has(entry.name)) {
          await walk(fullPath, depth + 1);
        }
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name);
        if (extensions.includes(ext)) {
          results.push(path.relative(projectRoot, fullPath));
        }
      }
    }
  }

  await walk(projectRoot, 0);
  return results;
}

/**
 * 查找可能受影响的文件
 */
export async function findAffectedFiles(projectRoot: string, description: string): Promise<string[]> {
  // 1. 从错误描述中直接提取文件路径
  const directClues = extractFileClues(description);
  const matched: string[] = [];

  for (const clue of directClues) {
    const fullPath = path.join(projectRoot, clue);
    if (await fileExists(fullPath)) {
      matched.push(clue);
    }
  }

  if (matched.length > 0) {
    return matched;
  }

  // 2. 基于关键词搜索文件内容
  const keywords = extractKeywords(description);
  if (keywords.length === 0) {
    return [];
  }

  const sourceFiles = await findSourceFiles(projectRoot);
  const scored: { file: string; score: number }[] = [];

  for (const file of sourceFiles) {
    let score = 0;
    const filePath = path.join(projectRoot, file);

    // 文件名匹配
    const fileName = path.basename(file, path.extname(file));
    for (const kw of keywords) {
      if (fileName.toLowerCase().includes(kw.toLowerCase())) {
        score += 3;
      }
    }

    // 文件路径匹配
    for (const kw of keywords) {
      if (file.toLowerCase().includes(kw.toLowerCase())) {
        score += 1;
      }
    }

    // 文件内容匹配（只读取前 200 行以提高性能）
    if (score === 0) {
      try {
        const content = await fs.readFile(filePath, 'utf-8');
        const headContent = content.split('\n').slice(0, 200).join('\n');
        for (const kw of keywords) {
          if (headContent.includes(kw)) {
            score += 2;
          }
        }
      } catch {
        // 忽略读取错误
      }
    }

    if (score > 0) {
      scored.push({ file, score });
    }
  }

  // 按分数降序排列，返回前 10 个
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, 10).map(s => s.file);
}

/**
 * 根据文件扩展名判断语言
 */
function getLanguage(ext: string): 'java' | 'python' | 'go' | 'typescript' {
  if (ext === '.java' || ext === '.kt') return 'java';
  if (ext === '.py') return 'python';
  if (ext === '.go') return 'go';
  return 'typescript';
}

/**
 * 根据错误类型生成标准化的修复建议
 */
export function generateFix(errorType: ErrorType, file: string, description: string): Fix {
  const ext = path.extname(file);
  const language = getLanguage(ext);

  // Java 特定修复
  if (language === 'java') {
    return generateJavaFix(errorType, file, ext, description);
  }

  // Python 特定修复
  if (language === 'python') {
    return generatePythonFix(errorType, file, ext, description);
  }

  // Go 特定修复
  if (language === 'go') {
    return generateGoFix(errorType, file, ext, description);
  }

  // TypeScript / 其他语言修复（保持原有逻辑）
  switch (errorType) {
    case 'syntax':
      return generateSyntaxFix(file, ext, description);
    case 'type':
      return generateTypeFix(file, ext, description);
    case 'dependency':
      return generateDependencyFix(file, ext, description);
    case 'config':
      return generateConfigFix(file, ext, description);
    case 'runtime':
      return generateRuntimeFix(file, ext, description);
    case 'logic':
      return generateLogicFix(file, ext, description);
    default:
      return generateRuntimeFix(file, ext, description);
  }
}

function generateSyntaxFix(file: string, ext: string, description: string): Fix {
  const lower = description.toLowerCase();
  let originalCode = '';
  let fixedCode = '';
  let explanation = '';

  if (lower.includes('unexpected token') || lower.includes('parsing error')) {
    if (lower.includes(')') || lower.includes('missing )')) {
      originalCode = 'someFunction(param1, param2';
      fixedCode = 'someFunction(param1, param2)';
      explanation = '补全缺失的右括号';
    } else if (lower.includes('}') || lower.includes('missing }')) {
      originalCode = 'if (condition) {\n  doSomething();\n';
      fixedCode = 'if (condition) {\n  doSomething();\n}';
      explanation = '补全缺失的右花括号';
    } else if (lower.includes(']') || lower.includes('missing ]')) {
      originalCode = 'const items = [1, 2, 3';
      fixedCode = 'const items = [1, 2, 3]';
      explanation = '补全缺失的右方括号';
    } else {
      originalCode = '// 检查该行附近的语法';
      fixedCode = '// 修复: 请检查该文件中的语法错误，常见原因包括缺少括号、引号未闭合、逗号遗漏等';
      explanation = '语法错误修复建议：请检查错误行附近的括号、引号、分号等是否正确闭合';
    }
  } else if (lower.includes('unexpected identifier')) {
    originalCode = 'const myVar = "hello\nconsole.log(myVar)';
    fixedCode = 'const myVar = "hello";\nconsole.log(myVar);';
    explanation = '修复字符串未正确闭合导致的语法错误';
  } else {
    originalCode = '// 请检查语法错误';
    fixedCode = '// 修复: 请根据错误提示检查该文件中的语法问题';
    explanation = '通用语法修复：检查括号匹配、引号闭合、分号完整性等';
  }

  return { file, originalCode, fixedCode, explanation };
}

function generateTypeFix(file: string, ext: string, description: string): Fix {
  const lower = description.toLowerCase();
  let originalCode = '';
  let fixedCode = '';
  let explanation = '';

  if (lower.includes('is not assignable') || lower.includes('cannot assign')) {
    originalCode = 'const value: string = 42;';
    fixedCode = 'const value: number = 42;';
    explanation = '修正变量类型声明，使其与赋值类型一致';
  } else if (lower.includes('is not a function') || lower.includes('not assignable to parameter')) {
    originalCode = 'function processData(data: any) {\n  return data;\n}';
    fixedCode = 'function processData(data: unknown): unknown {\n  if (typeof data === "object" && data !== null) {\n    return data;\n  }\n  return data;\n}';
    explanation = '添加适当的类型注解和类型守卫';
  } else if (lower.includes('implicitly has an') || lower.includes("implicit 'any'")) {
    originalCode = 'function greet(name) {\n  return `Hello, ${name}!`;\n}';
    fixedCode = 'function greet(name: string): string {\n  return `Hello, ${name}!`;\n}';
    explanation = '为函数参数和返回值添加明确的类型注解';
  } else if (lower.includes('property') && lower.includes('does not exist')) {
    originalCode = 'const obj = getData();\nconsole.log(obj.missingProp);';
    fixedCode = 'const obj = getData();\nconsole.log((obj as Record<string, unknown>).missingProp);';
    explanation = '使用类型断言或扩展类型定义来访问属性';
  } else {
    originalCode = '// 类型错误位置';
    fixedCode = '// 修复: 请根据 TypeScript 编译器的类型错误提示调整类型声明';
    explanation = '通用类型修复：检查类型声明是否与实际使用一致，必要时使用类型断言或类型守卫';
  }

  return { file, originalCode, fixedCode, explanation };
}

function generateDependencyFix(file: string, ext: string, description: string): Fix {
  const lower = description.toLowerCase();
  let originalCode = '';
  let fixedCode = '';
  let explanation = '';

  if (lower.includes('cannot find module') || lower.includes('module not found')) {
    const moduleMatch = description.match(/['"]([^'"]+)['"]/);
    const moduleName = moduleMatch ? moduleMatch[1] : 'missing-module';
    originalCode = `import { something } from '${moduleName}';`;
    fixedCode = `// 请先安装依赖: npm install ${moduleName}\n// 或: yarn add ${moduleName}\n// 然后取消下面的注释\n// import { something } from '${moduleName}';`;
    explanation = `模块 '${moduleName}' 未找到，请先安装对应的依赖包`;
  } else if (lower.includes('resolve failed') || lower.includes('unresolved import')) {
    originalCode = "import { Component } from './MyComponent';";
    fixedCode = "// 检查导入路径是否正确，确认文件是否存在\nimport { Component } from './MyComponent'; // 请验证此路径";
    explanation = '导入路径解析失败，请检查文件路径和文件扩展名是否正确';
  } else {
    originalCode = '// 依赖相关错误';
    fixedCode = '// 修复: 请运行 npm install 或 yarn install 安装缺失的依赖';
    explanation = '通用依赖修复：请确保所有依赖已正确安装，检查 package.json 中的依赖声明';
  }

  return { file, originalCode, fixedCode, explanation };
}

function generateConfigFix(file: string, ext: string, description: string): Fix {
  const lower = description.toLowerCase();
  let originalCode = '';
  let fixedCode = '';
  let explanation = '';

  if (lower.includes('tsconfig') || lower.includes('typescript')) {
    originalCode = '{\n  "compilerOptions": {\n    "target": "es5"\n  }\n}';
    fixedCode = '{\n  "compilerOptions": {\n    "target": "ES2022",\n    "module": "ESNext",\n    "moduleResolution": "bundler",\n    "strict": true\n  }\n}';
    explanation = '更新 TypeScript 配置以匹配项目需求';
  } else if (lower.includes('env') || lower.includes('environment')) {
    originalCode = 'const API_URL = process.env.API_URL;';
    fixedCode = 'const API_URL = process.env.API_URL ?? "http://localhost:3000";\n\n// 确保 .env 文件中定义了 API_URL 变量';
    explanation = '为环境变量提供默认值，并确保 .env 文件中定义了所需变量';
  } else if (lower.includes('webpack') || lower.includes('vite') || lower.includes('rollup')) {
    originalCode = '// 构建配置错误';
    fixedCode = '// 修复: 请检查构建工具配置文件，确保路径别名、插件配置等正确设置';
    explanation = '构建工具配置错误，请检查对应的配置文件（webpack.config.js / vite.config.ts 等）';
  } else {
    originalCode = '// 配置错误位置';
    fixedCode = '// 修复: 请根据错误提示检查相关配置文件';
    explanation = '通用配置修复：检查项目配置文件中的相关设置项';
  }

  return { file, originalCode, fixedCode, explanation };
}

function generateRuntimeFix(file: string, ext: string, description: string): Fix {
  const lower = description.toLowerCase();
  let originalCode = '';
  let fixedCode = '';
  let explanation = '';

  if (lower.includes('cannot read property') || lower.includes('cannot read') || lower.includes('null reference')) {
    originalCode = 'const name = user.profile.name;';
    fixedCode = 'const name = user?.profile?.name ?? "";\n// 或添加空值检查:\n// if (user && user.profile) {\n//   const name = user.profile.name;\n// }';
    explanation = '添加可选链操作符 (?.) 和空值合并操作符 (??) 防止空值访问错误';
  } else if (lower.includes('is not a function')) {
    originalCode = 'const result = data.map(item => item.id);';
    fixedCode = 'const result = Array.isArray(data) ? data.map(item => item.id) : [];\n// 或添加类型检查:\n// if (typeof data === "function") {\n//   const result = data();\n// }';
    explanation = '添加类型检查，确保变量具有预期的方法或类型';
  } else if (lower.includes('reference') && lower.includes('not defined')) {
    originalCode = 'console.log(myVariable);';
    fixedCode = '// 确保变量在使用前已声明\nconst myVariable = "default value";\nconsole.log(myVariable);';
    explanation = '确保变量在使用前已正确声明和初始化';
  } else if (lower.includes('undefined is not') || lower.includes('undefined')) {
    originalCode = 'const length = items.length;';
    fixedCode = 'const items = items ?? [];\nconst length = items.length;\n// 或添加防御性检查:\n// const length = items?.length ?? 0;';
    explanation = '添加空值检查和默认值，防止对 undefined 进行属性访问';
  } else {
    originalCode = '// 运行时错误位置';
    fixedCode = '// 修复: 请根据运行时错误堆栈定位问题代码，添加适当的错误处理和空值检查';
    explanation = '通用运行时修复：添加 try-catch 错误处理、空值检查和类型守卫';
  }

  return { file, originalCode, fixedCode, explanation };
}

function generateLogicFix(file: string, ext: string, description: string): Fix {
  const lower = description.toLowerCase();
  let originalCode = '';
  let fixedCode = '';
  let explanation = '';

  if (lower.includes('off by one') || lower.includes('boundary') || lower.includes('index')) {
    originalCode = 'for (let i = 0; i <= array.length; i++) {\n  process(array[i]);\n}';
    fixedCode = 'for (let i = 0; i < array.length; i++) {\n  process(array[i]);\n}';
    explanation = '修正循环边界条件，将 <= 改为 < 避免数组越界';
  } else if (lower.includes('infinite loop') || lower.includes('endless')) {
    originalCode = 'let i = 0;\nwhile (i < 10) {\n  // 缺少 i++\n  process(i);\n}';
    fixedCode = 'let i = 0;\nwhile (i < 10) {\n  process(i);\n  i++; // 添加递增条件\n}';
    explanation = '在循环体中添加递增/递减条件，避免无限循环';
  } else if (lower.includes('wrong result') || lower.includes('incorrect')) {
    originalCode = 'const total = price * discount; // 错误: 应该是除法';
    fixedCode = 'const total = price * (1 - discount); // 正确: 应用折扣\n// 或: const total = price / (1 + taxRate); // 计算含税价格';
    explanation = '检查业务逻辑计算公式是否正确，建议添加单元测试验证';
  } else {
    originalCode = '// 逻辑错误位置';
    fixedCode = '// 修复: 请根据预期行为检查算法逻辑，建议添加单元测试验证修复效果';
    explanation = '通用逻辑修复：建议添加调试日志或单元测试来定位和验证逻辑问题';
  }

  return { file, originalCode, fixedCode, explanation };
}

// ==================== Java 修复生成 ====================

function generateJavaFix(errorType: ErrorType, file: string, ext: string, description: string): Fix {
  const lower = description.toLowerCase();

  switch (errorType) {
    case 'runtime':
      if (lower.includes('nullpointer') || lower.includes('null pointer') || lower.includes('cannot read') || lower.includes('null reference')) {
        return {
          file,
          originalCode: 'String name = user.getProfile().getName();',
          fixedCode: 'String name = "default";\nif (user != null && user.getProfile() != null) {\n    name = user.getProfile().getName();\n}\n// 或使用 Optional:\n// String name = Optional.ofNullable(user)\n//     .map(User::getProfile)\n//     .map(Profile::getName)\n//     .orElse("default");',
          explanation: '添加 null 检查防止 NullPointerException，或使用 Optional 进行安全的链式调用',
        };
      } else if (lower.includes('is not a function') || lower.includes('method not found')) {
        return {
          file,
          originalCode: 'Object result = data.process();',
          fixedCode: 'if (data instanceof Processor) {\n    Object result = ((Processor) data).process();\n} else {\n    throw new IllegalArgumentException("data is not a Processor");\n}',
          explanation: '使用 instanceof 检查类型，确保对象具有预期的方法',
        };
      }
      return {
        file,
        originalCode: '// 运行时错误位置',
        fixedCode: 'try {\n    // 可能出错的代码\n} catch (Exception e) {\n    logger.error("操作失败: {}", e.getMessage(), e);\n    throw new RuntimeException("操作失败", e);\n}',
        explanation: '添加 try-catch 异常处理，记录错误日志并适当处理异常',
      };

    case 'syntax':
      if (lower.includes('unexpected token') || lower.includes('parsing error') || lower.includes(';') || lower.includes('missing')) {
        return {
          file,
          originalCode: 'String message = "hello\nSystem.out.println(message)',
          fixedCode: 'String message = "hello";\nSystem.out.println(message);',
          explanation: '修复语法错误：确保语句以分号结尾，字符串正确闭合',
        };
      }
      return {
        file,
        originalCode: '// 请检查语法错误',
        fixedCode: '// 修复: 请根据编译器错误提示检查语法问题\n// 常见原因: 缺少分号、括号不匹配、缺少返回语句等',
        explanation: '通用 Java 语法修复：检查分号、括号匹配、访问修饰符等',
      };

    case 'type':
      if (lower.includes('cannot assign') || lower.includes('incompatible types') || lower.includes('is not assignable')) {
        return {
          file,
          originalCode: 'String value = 42;',
          fixedCode: 'int value = 42;\n// 如需字符串: String value = String.valueOf(42);',
          explanation: '修正变量类型声明，使其与赋值类型一致',
        };
      } else if (lower.includes('classcastexception') || lower.includes('cannot be cast')) {
        return {
          file,
          originalCode: 'User user = (User) obj;',
          fixedCode: 'if (obj instanceof User) {\n    User user = (User) obj;\n} else {\n    logger.warn("对象类型不匹配: {}", obj.getClass().getName());\n}',
          explanation: '使用 instanceof 检查后再进行类型转换，避免 ClassCastException',
        };
      }
      return {
        file,
        originalCode: '// 类型错误位置',
        fixedCode: '// 修复: 请根据编译器类型错误提示调整类型声明\n// 必要时使用泛型或类型转换',
        explanation: '通用 Java 类型修复：检查泛型使用、类型转换和类型声明',
      };

    case 'dependency':
      return {
        file,
        originalCode: 'import com.example.missing.Service;',
        fixedCode: '// 请在 pom.xml 或 build.gradle 中添加依赖:\n' +
          '// Maven: <dependency><groupId>com.example</groupId><artifactId>missing-lib</artifactId></dependency>\n' +
          '// Gradle: implementation "com.example:missing-lib:1.0.0"\n' +
          '// 然后重新导入',
        explanation: 'Java 依赖缺失，请在构建配置文件（pom.xml / build.gradle）中添加对应依赖',
      };

    case 'config':
      return {
        file,
        originalCode: '// 配置错误位置',
        fixedCode: '// 修复: 检查 application.properties / application.yml 配置\n// 确保 @Value 或 @ConfigurationProperties 绑定的属性已定义',
        explanation: 'Java 配置修复：检查 application.properties/yml 中的配置项是否正确',
      };

    case 'logic':
      if (lower.includes('off by one') || lower.includes('boundary') || lower.includes('index')) {
        return {
          file,
          originalCode: 'for (int i = 0; i <= list.size(); i++) {\n    process(list.get(i));\n}',
          fixedCode: 'for (int i = 0; i < list.size(); i++) {\n    process(list.get(i));\n}',
          explanation: '修正循环边界条件，将 <= 改为 < 避免数组越界 (IndexOutOfBoundsException)',
        };
      } else if (lower.includes('infinite loop') || lower.includes('endless')) {
        return {
          file,
          originalCode: 'int i = 0;\nwhile (i < 10) {\n    // 缺少 i++\n    process(i);\n}',
          fixedCode: 'int i = 0;\nwhile (i < 10) {\n    process(i);\n    i++; // 添加递增条件\n}',
          explanation: '在循环体中添加递增/递减条件，避免无限循环',
        };
      }
      return {
        file,
        originalCode: '// 逻辑错误位置',
        fixedCode: '// 修复: 请根据预期行为检查算法逻辑\n// 建议编写 JUnit 测试用例验证修复效果',
        explanation: '通用 Java 逻辑修复：建议添加 JUnit 单元测试来定位和验证逻辑问题',
      };

    default:
      return {
        file,
        originalCode: '// 错误位置',
        fixedCode: 'try {\n    // 可能出错的代码\n} catch (Exception e) {\n    logger.error("操作失败", e);\n    throw e;\n}',
        explanation: '添加 try-catch 异常处理并记录日志',
      };
  }
}

// ==================== Python 修复生成 ====================

function generatePythonFix(errorType: ErrorType, file: string, ext: string, description: string): Fix {
  const lower = description.toLowerCase();

  switch (errorType) {
    case 'runtime':
      if (lower.includes('nonetype') || lower.includes('none ') || lower.includes('cannot read') || lower.includes('null reference') || lower.includes('attributeerror')) {
        return {
          file,
          originalCode: 'name = user.profile.name',
          fixedCode: 'name = "default"\nif user is not None and user.profile is not None:\n    name = user.profile.name\n# 或使用 getattr:\n# name = getattr(getattr(user, "profile", None), "name", "default")',
          explanation: '添加 None 检查防止 AttributeError，或使用 getattr 提供默认值',
        };
      } else if (lower.includes('keyerror') || lower.includes('key error')) {
        return {
          file,
          originalCode: 'value = data["key"]',
          fixedCode: 'value = data.get("key", None)\n# 或使用 defaultdict:\n# from collections import defaultdict\n# data = defaultdict(lambda: None, data)',
          explanation: '使用 dict.get() 方法提供默认值，避免 KeyError',
        };
      } else if (lower.includes('indexerror') || lower.includes('index out of') || lower.includes('list index')) {
        return {
          file,
          originalCode: 'item = items[10]',
          fixedCode: 'item = items[10] if len(items) > 10 else None\n# 或使用 try-except:\n# try:\n#     item = items[10]\n# except IndexError:\n#     item = None',
          explanation: '添加索引边界检查，防止 IndexError',
        };
      } else if (lower.includes('is not a function') || lower.includes('not callable') || lower.includes('typeerror')) {
        return {
          file,
          originalCode: 'result = data.process()',
          fixedCode: 'if callable(data):\n    result = data()\nelif hasattr(data, "process"):\n    result = data.process()\nelse:\n    raise TypeError(f"data 类型 {type(data)} 不支持此操作")',
          explanation: '使用 callable() 或 hasattr() 检查类型，确保对象可调用或具有预期方法',
        };
      }
      return {
        file,
        originalCode: '# 运行时错误位置',
        fixedCode: 'try:\n    # 可能出错的代码\n    result = risky_operation()\nexcept Exception as e:\n    logger.error(f"操作失败: {e}")\n    raise',
        explanation: '添加 try-except 异常处理，记录错误日志',
      };

    case 'syntax':
      if (lower.includes('indentation') || lower.includes('indent')) {
        return {
          file,
          originalCode: 'def my_function():\nresult = 1\nreturn result',
          fixedCode: 'def my_function():\n    result = 1\n    return result',
          explanation: '修复 Python 缩进错误，确保使用一致的缩进（4个空格）',
        };
      } else if (lower.includes('unexpected token') || lower.includes('syntax error') || lower.includes('eol') || lower.includes('eof')) {
        return {
          file,
          originalCode: 'message = "hello\nprint(message)',
          fixedCode: 'message = "hello"\nprint(message)',
          explanation: '修复语法错误：确保字符串正确闭合、语句完整',
        };
      } else if (lower.includes('colon') || lower.includes(':')) {
        return {
          file,
          originalCode: 'if condition\n    do_something()',
          fixedCode: 'if condition:\n    do_something()',
          explanation: '在 if/for/while/def/class 等语句末尾添加冒号',
        };
      }
      return {
        file,
        originalCode: '# 请检查语法错误',
        fixedCode: '# 修复: 请根据 Python 解释器的语法错误提示检查问题\n# 常见原因: 缩进错误、缺少冒号、括号不匹配等',
        explanation: '通用 Python 语法修复：检查缩进、冒号、括号匹配等',
      };

    case 'type':
      if (lower.includes('typeerror') || lower.includes('unsupported operand') || lower.includes('cannot assign')) {
        return {
          file,
          originalCode: 'result = "hello" + 42',
          fixedCode: 'result = "hello" + str(42)\n# 或使用 f-string:\n# result = f"hello{42}"',
          explanation: '确保操作数类型一致，使用 str() 或 f-string 进行类型转换',
        };
      } else if (lower.includes('isinstance') || lower.includes('type check')) {
        return {
          file,
          originalCode: 'def process(data):\n    return data.items()',
          fixedCode: 'def process(data: dict) -> list:\n    if isinstance(data, dict):\n        return list(data.items())\n    raise TypeError(f"预期 dict 类型，实际得到 {type(data).__name__}")',
          explanation: '使用 isinstance() 进行类型检查，添加类型注解',
        };
      }
      return {
        file,
        originalCode: '# 类型错误位置',
        fixedCode: '# 修复: 使用 isinstance() 进行类型检查\n# 添加类型注解帮助 IDE 和 mypy 检测类型问题',
        explanation: '通用 Python 类型修复：使用 isinstance() 检查类型，添加类型注解',
      };

    case 'dependency':
      return {
        file,
        originalCode: 'import missing_module',
        fixedCode: '# 请先安装依赖: pip install missing-module\n# 或在 requirements.txt 中添加: missing-module\n# 然后取消下面的注释\n# import missing_module',
        explanation: 'Python 模块未找到，请使用 pip install 安装对应依赖',
      };

    case 'config':
      return {
        file,
        originalCode: 'api_url = os.environ["API_URL"]',
        fixedCode: 'import os\napi_url = os.environ.get("API_URL", "http://localhost:8000")\n# 确保 .env 文件中定义了 API_URL，或使用 python-dotenv 加载',
        explanation: '使用 os.environ.get() 为环境变量提供默认值',
      };

    case 'logic':
      if (lower.includes('off by one') || lower.includes('boundary') || lower.includes('index')) {
        return {
          file,
          originalCode: 'for i in range(len(items) + 1):\n    process(items[i])',
          fixedCode: 'for i in range(len(items)):\n    process(items[i])',
          explanation: '修正循环范围，避免索引越界',
        };
      } else if (lower.includes('infinite loop') || lower.includes('endless')) {
        return {
          file,
          originalCode: 'i = 0\nwhile i < 10:\n    # 缺少 i += 1\n    process(i)',
          fixedCode: 'i = 0\nwhile i < 10:\n    process(i)\n    i += 1  # 添加递增条件',
          explanation: '在循环体中添加递增/递减条件，避免无限循环',
        };
      }
      return {
        file,
        originalCode: '# 逻辑错误位置',
        fixedCode: '# 修复: 请根据预期行为检查算法逻辑\n# 建议使用 pytest 编写测试用例验证修复效果',
        explanation: '通用 Python 逻辑修复：建议添加 pytest 单元测试来定位和验证逻辑问题',
      };

    default:
      return {
        file,
        originalCode: '# 错误位置',
        fixedCode: 'try:\n    # 可能出错的代码\n    result = risky_operation()\nexcept Exception as e:\n    logger.exception(f"操作失败: {e}")\n    raise',
        explanation: '添加 try-except 异常处理并记录日志',
      };
  }
}

// ==================== Go 修复生成 ====================

function generateGoFix(errorType: ErrorType, file: string, ext: string, description: string): Fix {
  const lower = description.toLowerCase();

  switch (errorType) {
    case 'runtime':
      if (lower.includes('nil') || lower.includes('null pointer') || lower.includes('panic') || lower.includes('invalid memory')) {
        return {
          file,
          originalCode: 'name := user.Profile.Name',
          fixedCode: 'var name string\nif user != nil && user.Profile != nil {\n    name = user.Profile.Name\n} else {\n    name = "default"\n}',
          explanation: '添加 nil 检查防止 panic: invalid memory address or nil pointer dereference',
        };
      } else if (lower.includes('index out of') || lower.includes('slice bounds') || lower.includes('range')) {
        return {
          file,
          originalCode: 'item := items[10]',
          fixedCode: 'var item Item\nif len(items) > 10 {\n    item = items[10]\n} else {\n    // 处理索引越界情况\n    return fmt.Errorf("索引越界: 长度 %d, 请求索引 10", len(items))\n}',
          explanation: '添加切片边界检查，防止 index out of range panic',
        };
      }
      return {
        file,
        originalCode: '// 运行时错误位置',
        fixedCode: 'func doSomething() (err error) {\n    defer func() {\n        if r := recover(); r != nil {\n            err = fmt.Errorf("panic recovered: %v", r)\n        }\n    }()\n    // 可能出错的代码\n    return nil\n}',
        explanation: '使用 defer + recover 捕获 panic，防止程序崩溃',
      };

    case 'syntax':
      if (lower.includes('unexpected token') || lower.includes('syntax error') || lower.includes('expected')) {
        return {
          file,
          originalCode: 'fmt.Println("hello"\n',
          fixedCode: 'fmt.Println("hello")\n',
          explanation: '修复 Go 语法错误：确保括号正确闭合，语句完整',
        };
      } else if (lower.includes('import') || lower.includes('unused')) {
        return {
          file,
          originalCode: 'import (\n    "fmt"\n    "os"\n    "unused"\n)',
          fixedCode: 'import (\n    "fmt"\n    "os"\n    _ "unused" // 使用空白标识符忽略未使用的导入\n)',
          explanation: '移除未使用的导入，或使用空白标识符 _ 来忽略',
        };
      }
      return {
        file,
        originalCode: '// 请检查语法错误',
        fixedCode: '// 修复: 请根据 go build/vet 的错误提示检查语法问题\n// 常见原因: 缺少括号、未使用的导入、未使用的变量等',
        explanation: '通用 Go 语法修复：检查括号匹配、导入声明、变量使用等',
      };

    case 'type':
      if (lower.includes('cannot assign') || lower.includes('mismatched') || lower.includes('cannot use')) {
        return {
          file,
          originalCode: 'var value string = 42',
          fixedCode: 'var value int = 42\n// 如需字符串: value := strconv.Itoa(42)\n// 或: value := fmt.Sprintf("%d", 42)',
          explanation: '修正变量类型声明，使其与赋值类型一致',
        };
      } else if (lower.includes('interface') || lower.includes('does not implement')) {
        return {
          file,
          originalCode: 'var s Service = &MyStruct{}',
          fixedCode: '// 确保 MyStruct 实现了 Service 接口的所有方法\n// type Service interface {\n//     DoSomething() error\n// }\n// func (m *MyStruct) DoSomething() error { return nil }',
          explanation: '确保结构体实现了接口要求的所有方法，检查方法签名是否匹配',
        };
      }
      return {
        file,
        originalCode: '// 类型错误位置',
        fixedCode: '// 修复: 请根据 Go 编译器的类型错误提示调整类型声明\n// 必要时使用类型断言: value := obj.(TargetType)',
        explanation: '通用 Go 类型修复：检查类型声明、接口实现和类型断言',
      };

    case 'dependency':
      return {
        file,
        originalCode: 'import "github.com/example/missing"',
        fixedCode: '// 请先安装依赖:\n// go get github.com/example/missing\n// 或在 go.mod 中添加 require 指令',
        explanation: 'Go 模块未找到，请使用 go get 安装对应依赖',
      };

    case 'config':
      return {
        file,
        originalCode: 'apiKey := os.Getenv("API_KEY")',
        fixedCode: 'apiKey := os.Getenv("API_KEY")\nif apiKey == "" {\n    log.Fatal("API_KEY 环境变量未设置")\n}\n// 或提供默认值:\n// apiKey := os.Getenv("API_KEY")\n// if apiKey == "" {\n//     apiKey = "default-key"\n// }',
        explanation: '添加环境变量空值检查，防止使用空配置值',
      };

    case 'logic':
      if (lower.includes('off by one') || lower.includes('boundary') || lower.includes('index')) {
        return {
          file,
          originalCode: 'for i := 0; i <= len(items); i++ {\n    process(items[i])\n}',
          fixedCode: 'for i := 0; i < len(items); i++ {\n    process(items[i])\n}',
          explanation: '修正循环边界条件，将 <= 改为 < 避免切片越界',
        };
      } else if (lower.includes('infinite loop') || lower.includes('endless') || lower.includes('deadlock')) {
        return {
          file,
          originalCode: 'i := 0\nfor i < 10 {\n    // 缺少 i++\n    process(i)\n}',
          fixedCode: 'for i := 0; i < 10; i++ {\n    process(i)\n}',
          explanation: '使用 for 循环的标准三段式写法，避免无限循环',
        };
      } else if (lower.includes('goroutine') || lower.includes('race') || lower.includes('deadlock')) {
        return {
          file,
          originalCode: 'go func() {\n    // 并发操作共享数据\n    counter++\n}()',
          fixedCode: 'go func() {\n    // 使用 channel 或 mutex 保护共享数据\n    mu.Lock()\n    defer mu.Unlock()\n    counter++\n}()',
          explanation: '使用 sync.Mutex 或 channel 保护并发访问的共享数据，避免 data race',
        };
      }
      return {
        file,
        originalCode: '// 逻辑错误位置',
        fixedCode: '// 修复: 请根据预期行为检查算法逻辑\n// 建议使用 go test 编写测试用例验证修复效果\n// 运行: go test -v ./...',
        explanation: '通用 Go 逻辑修复：建议添加 go test 单元测试来定位和验证逻辑问题',
      };

    default:
      return {
        file,
        originalCode: '// 错误位置',
        fixedCode: 'func doSomething() error {\n    // 可能出错的代码\n    if err := riskyOperation(); err != nil {\n        return fmt.Errorf("操作失败: %w", err)\n    }\n    return nil\n}',
        explanation: '添加错误检查 if err != nil，使用 fmt.Errorf 包装错误信息',
      };
  }
}

/**
 * 生成验证步骤
 */
export function generateVerification(errorType: ErrorType, description: string): { steps: string[]; expectedBehavior: string } {
  const steps: string[] = [];
  let expectedBehavior = '';

  switch (errorType) {
    case 'syntax':
      steps.push('运行 TypeScript 编译器检查: npx tsc --noEmit');
      steps.push('确认没有语法错误输出');
      expectedBehavior = 'TypeScript 编译器不再报告语法错误';
      break;
    case 'type':
      steps.push('运行 TypeScript 类型检查: npx tsc --noEmit');
      steps.push('检查修复后的类型是否正确');
      steps.push('运行相关单元测试验证');
      expectedBehavior = '类型检查通过，无类型错误';
      break;
    case 'dependency':
      steps.push('安装缺失的依赖: npm install');
      steps.push('确认 node_modules 中包含所需模块');
      steps.push('重新运行构建或启动命令');
      expectedBehavior = '依赖模块正确加载，无模块未找到错误';
      break;
    case 'config':
      steps.push('检查相关配置文件内容');
      steps.push('重启开发服务器: npm run dev');
      steps.push('确认配置变更生效');
      expectedBehavior = '项目正常启动，配置项生效';
      break;
    case 'runtime':
      steps.push('重新运行触发错误的操作');
      steps.push('检查控制台无报错');
      steps.push('运行相关测试用例');
      expectedBehavior = '运行时不再抛出错误，程序正常执行';
      break;
    case 'logic':
      steps.push('编写或运行相关单元测试');
      steps.push('使用边界值测试修复效果');
      steps.push('对比修复前后的输出结果');
      expectedBehavior = '逻辑输出符合预期，测试用例通过';
      break;
  }

  return { steps, expectedBehavior };
}
