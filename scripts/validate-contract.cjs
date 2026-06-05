/**
 * dev-flow Design Contract 自动校验脚本
 *
 * 读取 design-contract.yaml 中定义的接口契约，与实际代码进行自动化对比，
 * 验证 Develop 阶段的产出是否严格遵循了设计契约。
 *
 * 用法：
 *   node scripts/validate-contract.cjs                     # 自动查找最新契约文件
 *   node scripts/validate-contract.cjs --contract <path>     # 指定契约文件
 *   node scripts/validate-contract.cjs --fix               # 自动修复简单不一致
 *   node scripts/validate-contract.cjs --help               # 显示帮助
 *
 * 零外部依赖，仅需 Node.js。
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DOCS_DIR = path.join(ROOT, '.dev-flow', 'docs');
const SRC_DIR = findSrcDir(ROOT);

// ============================================================
// 工具函数
// ============================================================

function findSrcDir(root) {
  const candidates = ['src/main/java', 'src', 'app', 'lib', 'pkg'];
  for (const c of candidates) {
    if (fs.existsSync(path.join(root, c))) return path.join(root, c);
  }
  return root;
}

function findContractFile(docsDir) {
  if (!fs.existsSync(docsDir)) return null;
  const files = fs.readdirSync(docsDir)
    .filter(f => f.includes('design-contract') && f.endsWith('.yaml'));
  if (files.length === 0) return null;
  // 返回最新的文件
  files.sort((a, b) => {
    const statA = fs.statSync(path.join(docsDir, a));
    const statB = fs.statSync(path.join(docsDir, b));
    return statB.mtime - statA.mtime;
  });
  return path.join(docsDir, files[0]);
}

function findJavaFiles(srcDir, className) {
  const results = [];
  function walk(dir) {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.endsWith('.java') && entry.name.includes(className)) {
        results.push(full);
      }
    }
  }
  walk(srcDir);
  return results;
}

// ============================================================
// 校验函数
// ============================================================

function validateEntity(contract, srcDir) {
  const results = [];

  for (const entity of contract.entities || []) {
    const files = findJavaFiles(srcDir, entity.name);
    if (files.length === 0) {
      results.push({ type: 'missing', entity: entity.name, message: `Entity ${entity.name} 未找到` });
      continue;
    }

    for (const filePath of files) {
      const content = fs.readFileSync(filePath, 'utf-8');

      // 验证字段
      for (const field of entity.fields || []) {
        if (!content.includes(field.name)) {
          results.push({
            type: 'missing_field',
            entity: entity.name,
            field: field.name,
            file: filePath,
            message: `Entity ${entity.name} 缺少字段 ${field.name}`,
          });
        }
      }

      // 验证 getter/setter 方法名
      for (const field of entity.fields || []) {
        const expectedGetter = field.getter;
        const expectedSetter = field.setter;
        if (expectedGetter && !content.includes(expectedGetter)) {
          results.push({
            type: 'method_mismatch',
            entity: entity.name,
            expected: expectedGetter,
            file: filePath,
            message: `Entity ${entity.name} 缺少 getter 方法 ${expectedGetter}`,
          });
        }
        if (expectedSetter && !content.includes(expectedSetter)) {
          results.push({
            type: 'method_mismatch',
            entity: entity.name,
            expected: expectedSetter,
            file: filePath,
            message: `Entity ${entity.name} 缺少 setter 方法 ${expectedSetter}`,
          });
        }
      }
    }
  }

  return results;
}

function validateServices(contract, srcDir) {
  const results = [];

  for (const service of contract.services || []) {
    const files = findJavaFiles(srcDir, service.name);
    if (files.length === 0) {
      results.push({ type: 'missing', service: service.name, message: `Service ${service.name} 未找到` });
      continue;
    }

    for (const filePath of files) {
      const content = fs.readFileSync(filePath, 'utf-8');

      for (const method of service.methods || []) {
        if (!content.includes(method.name)) {
          results.push({
            type: 'missing_method',
            service: service.name,
            method: method.name,
            file: filePath,
            message: `Service ${service.name} 缺少方法 ${method.name}`,
          });
        }
      }
    }
  }

  return results;
}

function validateControllers(contract, srcDir) {
  const results = [];

  for (const controller of contract.controllers || []) {
    const files = findJavaFiles(srcDir, controller.name);
    if (files.length === 0) {
      results.push({ type: 'missing', controller: controller.name, message: `Controller ${controller.name} 未找到` });
      continue;
    }

    for (const filePath of files) {
      const content = fs.readFileSync(filePath, 'utf-8');

      for (const api of controller.apis || []) {
        if (api.path && !content.includes(api.path)) {
          results.push({
            type: 'missing_api',
            controller: controller.name,
            path: api.path,
            file: filePath,
            message: `Controller ${controller.name} 缺少 API 路径 ${api.path}`,
          });
        }
      }
    }
  }

  return results;
}

function validateMappers(contract, srcDir) {
  const results = [];

  for (const mapper of contract.mappers || []) {
    const javaFiles = findJavaFiles(srcDir, mapper.name);
    if (javaFiles.length === 0) {
      results.push({ type: 'missing', mapper: mapper.name, message: `Mapper ${mapper.name} 未找到` });
      continue;
    }

    for (const filePath of javaFiles) {
      const content = fs.readFileSync(filePath, 'utf-8');

      for (const method of mapper.customMethods || []) {
        if (!content.includes(method.name)) {
          results.push({
            type: 'missing_method',
            mapper: mapper.name,
            method: method.name,
            file: filePath,
            message: `Mapper ${mapper.name} 缺少自定义方法 ${method.name}`,
          });
        }
      }
    }
  }

  return results;
}

function validateInterfaces(contract, srcDir) {
  const results = [];
  const contracts = contract.interfaces?.serviceContracts || [];

  for (const sc of contracts) {
    const files = findJavaFiles(srcDir, sc.name);
    if (files.length === 0) {
      results.push({ type: 'missing_interface', name: sc.name, message: `接口契约 ${sc.name} 未找到实现` });
      continue;
    }

    for (const filePath of files) {
      const content = fs.readFileSync(filePath, 'utf-8');

      for (const method of sc.methods || []) {
        if (!content.includes(method.name)) {
          results.push({
            type: 'contract_violation',
            contract: sc.name,
            method: method.name,
            file: filePath,
            message: `接口契约 ${sc.name} 的方法 ${method.name} 未实现`,
          });
        }
      }
    }
  }

  return results;
}

// ============================================================
// 主入口
// ============================================================

function main() {
  const args = process.argv.slice(2);

  if (args.includes('--help')) {
    console.log(`
dev-flow Design Contract 自动校验

用法：
  node scripts/validate-contract.cjs [--contract <path>] [--fix] [--help]

选项：
  --contract <path>  指定契约文件路径
  --fix             自动修复简单不一致（如添加缺失字段声明）
  --help            显示帮助

示例：
  node scripts/validate-contract.cjs
  node scripts/validate-contract.cjs --contract .dev-flow/docs/用户管理-design-contract.yaml
`);
    process.exit(0);
  }

  const contractArg = args.indexOf('--contract');
  const contractFile = contractArg >= 0 ? args[contractArg + 1] : findContractFile(DOCS_DIR);
  const shouldFix = args.includes('--fix');

  if (!contractFile || !fs.existsSync(contractFile)) {
    console.error('[ERROR] 未找到 Design Contract 文件');
    console.error('请确保 Design 阶段已输出 design-contract.yaml');
    process.exit(1);
  }

  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('  dev-flow Design Contract 校验');
  console.log('═══════════════════════════════════════════════════');
  console.log(`契约文件: ${contractFile}`);
  console.log(`源码目录: ${SRC_DIR}`);
  console.log('');

  // 简单解析 YAML（提取 entities/services/controllers/mappers/interfaces 段）
  const content = fs.readFileSync(contractFile, 'utf-8');
  const contract = parseSimpleYaml(content);

  // 执行校验
  const allResults = [
    ...validateEntity(contract, SRC_DIR),
    ...validateServices(contract, SRC_DIR),
    ...validateControllers(contract, SRC_DIR),
    ...validateMappers(contract, SRC_DIR),
    ...validateInterfaces(contract, SRC_DIR),
  ];

  // 输出结果
  const missing = allResults.filter(r => r.type === 'missing' || r.type === 'missing_interface');
  const warnings = allResults.filter(r => r.type !== 'missing' && r.type !== 'missing_interface');

  if (missing.length > 0) {
    console.log(`🔴 缺失项 (${missing.length}):`);
    for (const r of missing) {
      console.log(`   ❌ ${r.message}`);
    }
  }

  if (warnings.length > 0) {
    console.log(`\n⚠️  不一致项 (${warnings.length}):`);
    for (const r of warnings) {
      console.log(`   ⚠️ ${r.message} [${r.file || ''}]`);
    }
  }

  if (allResults.length === 0) {
    console.log('✅ Design Contract 校验通过：所有契约定义与实际代码一致');
  } else {
    console.log(`\n📊 校验结果：${allResults.length} 个问题（${missing.length} 个缺失，${warnings.length} 个不一致）`);
  }

  // 写入校验报告
  const reportFile = path.join(ROOT, '.dev-flow', 'runtime', 'contract-validation-report.yaml');
  const reportDir = path.dirname(reportFile);
  fs.mkdirSync(reportDir, { recursive: true });

  const report = [
    `# Design Contract 校验报告（自动生成）`,
    `# 时间: ${new Date().toISOString()}`,
    `# 契约文件: ${path.relative(ROOT, contractFile)}`,
    ``,
    `total_issues: ${allResults.length}`,
    `missing: ${missing.length}`,
    `inconsistencies: ${warnings.length}`,
    ``,
    `issues:`,
    ...allResults.map(r => `  - type: "${r.type}"\n    message: "${r.message}"\n    file: "${r.file || 'N/A'}"`),
  ].join('\n');

  fs.writeFileSync(reportFile, report, 'utf-8');
  console.log(`\n📄 校验报告已写入: ${reportFile}`);

  // 退出码
  process.exit(missing.length > 0 ? 1 : 0);
}

function parseSimpleYaml(content) {
  // 极简 YAML 段解析器，不追求完整 YAML 支持
  const result = { entities: [], services: [], controllers: [], mappers: [], interfaces: { serviceContracts: [] } };
  const lines = content.split('\n');
  let currentSection = null;
  let currentItem = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    if (/^entities:/.test(trimmed)) { currentSection = 'entities'; continue; }
    if (/^services:/.test(trimmed)) { currentSection = 'services'; continue; }
    if (/^controllers:/.test(trimmed)) { currentSection = 'controllers'; continue; }
    if (/^mappers:/.test(trimmed)) { currentSection = 'mappers'; continue; }
    if (/^interfaces:/.test(trimmed)) { currentSection = 'interfaces'; continue; }

    // 检测新条目
    const nameMatch = trimmed.match(/^-\s+name:\s*["']?(.+?)["']?\s*$/);
    if (nameMatch && currentSection) {
      currentItem = { name: nameMatch[1], fields: [], methods: [], apis: [], customMethods: [] };
      result[currentSection].push(currentItem);
      continue;
    }

    if (!currentItem) continue;

    const fieldMatch = trimmed.match(/^-\s+name:\s*["']?(.+?)["']?\s*$/);
    if (fieldMatch && (trimmed.includes('type:'))) {
      const field = { name: fieldMatch[1] };
      currentItem.fields.push(field);
      continue;
    }

    const getterMatch = trimmed.match(/^getter:\s*["']?(.+?)["']?\s*$/);
    if (getterMatch && currentItem.fields.length > 0) {
      currentItem.fields[currentItem.fields.length - 1].getter = getterMatch[1];
      continue;
    }

    const setterMatch = trimmed.match(/^setter:\s*["']?(.+?)["']?\s*$/);
    if (setterMatch && currentItem.fields.length > 0) {
      currentItem.fields[currentItem.fields.length - 1].setter = setterMatch[1];
      continue;
    }

    const methodMatch = trimmed.match(/^-\s+name:\s*["']?(.+?)["']?\s*$/);
    if (methodMatch && (trimmed.includes('params:') || trimmed.includes('returnType:'))) {
      currentItem.methods.push({ name: methodMatch[1] });
      continue;
    }

    const apiMatch = trimmed.match(/^-\s+path:\s*["']?(.+?)["']?\s*$/);
    if (apiMatch) {
      currentItem.apis.push({ path: apiMatch[1] });
      continue;
    }

    const customMethodMatch = trimmed.match(/^-\s+name:\s*["']?(.+?)["']?\s*$/);
    if (customMethodMatch && currentSection === 'mappers') {
      currentItem.customMethods.push({ name: customMethodMatch[1] });
      continue;
    }
  }

  return result;
}

main();
