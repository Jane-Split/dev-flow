// src/agents/hotfix-analyzer.ts
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { fileExists } from '../utils/fs-utils.js';
// 错误类型关键词映射
const ERROR_TYPE_PATTERNS = [
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
export function parseErrorType(description) {
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
function extractFileClues(description) {
    const clues = [];
    // 匹配常见文件路径模式: src/xxx.ts, ./xxx.ts, xxx/xxx.tsx
    const pathPatterns = [
        /(?:src|lib|app|pages|components|utils|services|api|hooks|models)[/\\][\w./\\-]+\.(?:ts|tsx|js|jsx|vue)/gi,
        /(?:\.\/)?[\w./\\-]+\.(?:ts|tsx|js|jsx|vue)/gi,
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
function extractKeywords(description) {
    const keywords = [];
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
async function findSourceFiles(projectRoot) {
    const extensions = ['.ts', '.tsx', '.js', '.jsx', '.vue'];
    const results = [];
    const excludeDirs = new Set([
        'node_modules', 'dist', '.git', '.next', '.nuxt', 'build', 'coverage',
        '.dev-flow', '.vscode', '.idea',
    ]);
    async function walk(dir, depth) {
        if (depth > 10)
            return;
        let entries;
        try {
            entries = await fs.readdir(dir, { withFileTypes: true });
        }
        catch {
            return;
        }
        for (const entry of entries) {
            if (entry.name.startsWith('.') && entry.name !== '.env')
                continue;
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                if (!excludeDirs.has(entry.name)) {
                    await walk(fullPath, depth + 1);
                }
            }
            else if (entry.isFile()) {
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
export async function findAffectedFiles(projectRoot, description) {
    // 1. 从错误描述中直接提取文件路径
    const directClues = extractFileClues(description);
    const matched = [];
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
    const scored = [];
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
            }
            catch {
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
 * 根据错误类型生成标准化的修复建议
 */
export function generateFix(errorType, file, description) {
    const ext = path.extname(file);
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
function generateSyntaxFix(file, ext, description) {
    const lower = description.toLowerCase();
    let originalCode = '';
    let fixedCode = '';
    let explanation = '';
    if (lower.includes('unexpected token') || lower.includes('parsing error')) {
        if (lower.includes(')') || lower.includes('missing )')) {
            originalCode = 'someFunction(param1, param2';
            fixedCode = 'someFunction(param1, param2)';
            explanation = '补全缺失的右括号';
        }
        else if (lower.includes('}') || lower.includes('missing }')) {
            originalCode = 'if (condition) {\n  doSomething();\n';
            fixedCode = 'if (condition) {\n  doSomething();\n}';
            explanation = '补全缺失的右花括号';
        }
        else if (lower.includes(']') || lower.includes('missing ]')) {
            originalCode = 'const items = [1, 2, 3';
            fixedCode = 'const items = [1, 2, 3]';
            explanation = '补全缺失的右方括号';
        }
        else {
            originalCode = '// 检查该行附近的语法';
            fixedCode = '// 修复: 请检查该文件中的语法错误，常见原因包括缺少括号、引号未闭合、逗号遗漏等';
            explanation = '语法错误修复建议：请检查错误行附近的括号、引号、分号等是否正确闭合';
        }
    }
    else if (lower.includes('unexpected identifier')) {
        originalCode = 'const myVar = "hello\nconsole.log(myVar)';
        fixedCode = 'const myVar = "hello";\nconsole.log(myVar);';
        explanation = '修复字符串未正确闭合导致的语法错误';
    }
    else {
        originalCode = '// 请检查语法错误';
        fixedCode = '// 修复: 请根据错误提示检查该文件中的语法问题';
        explanation = '通用语法修复：检查括号匹配、引号闭合、分号完整性等';
    }
    return { file, originalCode, fixedCode, explanation };
}
function generateTypeFix(file, ext, description) {
    const lower = description.toLowerCase();
    let originalCode = '';
    let fixedCode = '';
    let explanation = '';
    if (lower.includes('is not assignable') || lower.includes('cannot assign')) {
        originalCode = 'const value: string = 42;';
        fixedCode = 'const value: number = 42;';
        explanation = '修正变量类型声明，使其与赋值类型一致';
    }
    else if (lower.includes('is not a function') || lower.includes('not assignable to parameter')) {
        originalCode = 'function processData(data: any) {\n  return data;\n}';
        fixedCode = 'function processData(data: unknown): unknown {\n  if (typeof data === "object" && data !== null) {\n    return data;\n  }\n  return data;\n}';
        explanation = '添加适当的类型注解和类型守卫';
    }
    else if (lower.includes('implicitly has an') || lower.includes("implicit 'any'")) {
        originalCode = 'function greet(name) {\n  return `Hello, ${name}!`;\n}';
        fixedCode = 'function greet(name: string): string {\n  return `Hello, ${name}!`;\n}';
        explanation = '为函数参数和返回值添加明确的类型注解';
    }
    else if (lower.includes('property') && lower.includes('does not exist')) {
        originalCode = 'const obj = getData();\nconsole.log(obj.missingProp);';
        fixedCode = 'const obj = getData();\nconsole.log((obj as Record<string, unknown>).missingProp);';
        explanation = '使用类型断言或扩展类型定义来访问属性';
    }
    else {
        originalCode = '// 类型错误位置';
        fixedCode = '// 修复: 请根据 TypeScript 编译器的类型错误提示调整类型声明';
        explanation = '通用类型修复：检查类型声明是否与实际使用一致，必要时使用类型断言或类型守卫';
    }
    return { file, originalCode, fixedCode, explanation };
}
function generateDependencyFix(file, ext, description) {
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
    }
    else if (lower.includes('resolve failed') || lower.includes('unresolved import')) {
        originalCode = "import { Component } from './MyComponent';";
        fixedCode = "// 检查导入路径是否正确，确认文件是否存在\nimport { Component } from './MyComponent'; // 请验证此路径";
        explanation = '导入路径解析失败，请检查文件路径和文件扩展名是否正确';
    }
    else {
        originalCode = '// 依赖相关错误';
        fixedCode = '// 修复: 请运行 npm install 或 yarn install 安装缺失的依赖';
        explanation = '通用依赖修复：请确保所有依赖已正确安装，检查 package.json 中的依赖声明';
    }
    return { file, originalCode, fixedCode, explanation };
}
function generateConfigFix(file, ext, description) {
    const lower = description.toLowerCase();
    let originalCode = '';
    let fixedCode = '';
    let explanation = '';
    if (lower.includes('tsconfig') || lower.includes('typescript')) {
        originalCode = '{\n  "compilerOptions": {\n    "target": "es5"\n  }\n}';
        fixedCode = '{\n  "compilerOptions": {\n    "target": "ES2022",\n    "module": "ESNext",\n    "moduleResolution": "bundler",\n    "strict": true\n  }\n}';
        explanation = '更新 TypeScript 配置以匹配项目需求';
    }
    else if (lower.includes('env') || lower.includes('environment')) {
        originalCode = 'const API_URL = process.env.API_URL;';
        fixedCode = 'const API_URL = process.env.API_URL ?? "http://localhost:3000";\n\n// 确保 .env 文件中定义了 API_URL 变量';
        explanation = '为环境变量提供默认值，并确保 .env 文件中定义了所需变量';
    }
    else if (lower.includes('webpack') || lower.includes('vite') || lower.includes('rollup')) {
        originalCode = '// 构建配置错误';
        fixedCode = '// 修复: 请检查构建工具配置文件，确保路径别名、插件配置等正确设置';
        explanation = '构建工具配置错误，请检查对应的配置文件（webpack.config.js / vite.config.ts 等）';
    }
    else {
        originalCode = '// 配置错误位置';
        fixedCode = '// 修复: 请根据错误提示检查相关配置文件';
        explanation = '通用配置修复：检查项目配置文件中的相关设置项';
    }
    return { file, originalCode, fixedCode, explanation };
}
function generateRuntimeFix(file, ext, description) {
    const lower = description.toLowerCase();
    let originalCode = '';
    let fixedCode = '';
    let explanation = '';
    if (lower.includes('cannot read property') || lower.includes('cannot read') || lower.includes('null reference')) {
        originalCode = 'const name = user.profile.name;';
        fixedCode = 'const name = user?.profile?.name ?? "";\n// 或添加空值检查:\n// if (user && user.profile) {\n//   const name = user.profile.name;\n// }';
        explanation = '添加可选链操作符 (?.) 和空值合并操作符 (??) 防止空值访问错误';
    }
    else if (lower.includes('is not a function')) {
        originalCode = 'const result = data.map(item => item.id);';
        fixedCode = 'const result = Array.isArray(data) ? data.map(item => item.id) : [];\n// 或添加类型检查:\n// if (typeof data === "function") {\n//   const result = data();\n// }';
        explanation = '添加类型检查，确保变量具有预期的方法或类型';
    }
    else if (lower.includes('reference') && lower.includes('not defined')) {
        originalCode = 'console.log(myVariable);';
        fixedCode = '// 确保变量在使用前已声明\nconst myVariable = "default value";\nconsole.log(myVariable);';
        explanation = '确保变量在使用前已正确声明和初始化';
    }
    else if (lower.includes('undefined is not') || lower.includes('undefined')) {
        originalCode = 'const length = items.length;';
        fixedCode = 'const items = items ?? [];\nconst length = items.length;\n// 或添加防御性检查:\n// const length = items?.length ?? 0;';
        explanation = '添加空值检查和默认值，防止对 undefined 进行属性访问';
    }
    else {
        originalCode = '// 运行时错误位置';
        fixedCode = '// 修复: 请根据运行时错误堆栈定位问题代码，添加适当的错误处理和空值检查';
        explanation = '通用运行时修复：添加 try-catch 错误处理、空值检查和类型守卫';
    }
    return { file, originalCode, fixedCode, explanation };
}
function generateLogicFix(file, ext, description) {
    const lower = description.toLowerCase();
    let originalCode = '';
    let fixedCode = '';
    let explanation = '';
    if (lower.includes('off by one') || lower.includes('boundary') || lower.includes('index')) {
        originalCode = 'for (let i = 0; i <= array.length; i++) {\n  process(array[i]);\n}';
        fixedCode = 'for (let i = 0; i < array.length; i++) {\n  process(array[i]);\n}';
        explanation = '修正循环边界条件，将 <= 改为 < 避免数组越界';
    }
    else if (lower.includes('infinite loop') || lower.includes('endless')) {
        originalCode = 'let i = 0;\nwhile (i < 10) {\n  // 缺少 i++\n  process(i);\n}';
        fixedCode = 'let i = 0;\nwhile (i < 10) {\n  process(i);\n  i++; // 添加递增条件\n}';
        explanation = '在循环体中添加递增/递减条件，避免无限循环';
    }
    else if (lower.includes('wrong result') || lower.includes('incorrect')) {
        originalCode = 'const total = price * discount; // 错误: 应该是除法';
        fixedCode = 'const total = price * (1 - discount); // 正确: 应用折扣\n// 或: const total = price / (1 + taxRate); // 计算含税价格';
        explanation = '检查业务逻辑计算公式是否正确，建议添加单元测试验证';
    }
    else {
        originalCode = '// 逻辑错误位置';
        fixedCode = '// 修复: 请根据预期行为检查算法逻辑，建议添加单元测试验证修复效果';
        explanation = '通用逻辑修复：建议添加调试日志或单元测试来定位和验证逻辑问题';
    }
    return { file, originalCode, fixedCode, explanation };
}
/**
 * 生成验证步骤
 */
export function generateVerification(errorType, description) {
    const steps = [];
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
//# sourceMappingURL=hotfix-analyzer.js.map