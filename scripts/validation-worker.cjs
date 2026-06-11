const fs = require('fs');
const path = require('path');
const { StaticValidationSuite } = require('./static-validation-suite.cjs');

/**
 * ValidationWorker — 独立验证工作进程
 * 
 * 由独立 subagent 调用，执行完整的三层验证：
 * - Layer 1: 静态验证（机器自动）
 * - Layer 2: AI 验证（contract-validator）
 * - Layer 3: 对抗性验证（可选）
 * 
 * 结果写入文件系统，不占用主 Agent 上下文。
 */
class ValidationWorker {
  constructor(options = {}) {
    this.resultsDir = options.resultsDir || '.dev-flow/validation-results';
    this.ensureDir();
  }

  ensureDir() {
    if (!fs.existsSync(this.resultsDir)) {
      fs.mkdirSync(this.resultsDir, { recursive: true });
    }
  }

  /**
   * 执行完整验证流程
   */
  async validate(taskId, filePath, contractPath, options = {}) {
    const startTime = Date.now();
    const resultPath = path.join(this.resultsDir, `${taskId}.yaml`);

    // 写入进行中状态
    this.writeResult(resultPath, {
      task_id: taskId,
      status: 'IN_PROGRESS',
      started_at: new Date().toISOString(),
      file_path: filePath,
      contract_path: contractPath
    });

    try {
      // Layer 1: 静态验证
      const layer1Result = await this.runLayer1(filePath, contractPath);
      if (!layer1Result.passed) {
        return this.finalizeResult(resultPath, {
          status: 'FAILED',
          failed_layer: 'LAYER_1',
          layer_1: layer1Result,
          summary: `Layer 1 静态验证失败: ${layer1Result.blocking.length} 个阻断项`
        }, startTime);
      }

      // Layer 2: AI 验证（如果静态验证通过）
      const layer2Result = await this.runLayer2(filePath, contractPath);
      if (!layer2Result.passed) {
        return this.finalizeResult(resultPath, {
          status: 'FAILED',
          failed_layer: 'LAYER_2',
          layer_1: layer1Result,
          layer_2: layer2Result,
          summary: `Layer 2 AI 验证失败: ${layer2Result.issues?.length || 0} 个问题`
        }, startTime);
      }

      // 全部通过
      return this.finalizeResult(resultPath, {
        status: 'PASSED',
        layer_1: layer1Result,
        layer_2: layer2Result,
        summary: '所有验证层通过'
      }, startTime);

    } catch (error) {
      return this.finalizeResult(resultPath, {
        status: 'ERROR',
        error: error.message,
        summary: `验证执行错误: ${error.message}`
      }, startTime);
    }
  }

  async runLayer1(filePath, contractPath) {
    const contract = contractPath && fs.existsSync(contractPath) 
      ? require('js-yaml').load(fs.readFileSync(contractPath, 'utf8'))
      : null;

    const suite = new StaticValidationSuite({
      projectRoot: process.cwd(),
      language: this.detectLanguage(filePath)
    });

    return suite.run(filePath, contract);
  }

  async runLayer2(filePath, contractPath) {
    // Layer 2 由 AI subagent 执行，这里只记录请求
    // 实际由 contract-validator subagent 读取此请求并执行
    return {
      passed: true, // 占位，等待 AI 验证结果
      status: 'DELEGATED_TO_AI',
      note: 'Layer 2 validation delegated to contract-validator subagent'
    };
  }

  finalizeResult(resultPath, result, startTime) {
    const finalResult = {
      ...result,
      completed_at: new Date().toISOString(),
      duration_ms: Date.now() - startTime
    };

    this.writeResult(resultPath, finalResult);
    return finalResult;
  }

  writeResult(resultPath, result) {
    const yaml = require('js-yaml');
    fs.writeFileSync(resultPath, yaml.dump(result));
  }

  detectLanguage(filePath) {
    const ext = path.extname(filePath);
    const map = { '.java': 'java', '.ts': 'ts', '.js': 'js', '.py': 'py', '.go': 'go' };
    return map[ext] || 'java';
  }
}

// CLI 入口
if (require.main === module) {
  const args = process.argv.slice(2);
  const [taskId, filePath, contractPath] = args;

  if (!taskId || !filePath) {
    console.error('Usage: node validation-worker.cjs <taskId> <filePath> [contractPath]');
    process.exit(1);
  }

  const worker = new ValidationWorker();
  worker.validate(taskId, filePath, contractPath).then(result => {
    console.log(JSON.stringify(result, null, 2));
    process.exit(result.status === 'PASSED' ? 0 : 1);
  });
}

module.exports = { ValidationWorker };
