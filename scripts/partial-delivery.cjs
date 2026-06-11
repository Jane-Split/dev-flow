const fs = require('fs');
const path = require('path');

/**
 * PartialDelivery — 部分交付与挂起任务管理
 *
 * 当上下文不足以完成全部任务时，将已完成的任务交付，
 * 未完成的任务挂起并记录原因。
 */
class PartialDelivery {
  constructor(options = {}) {
    this.outputDir = options.outputDir || '.dev-flow/pending';
    this.ensureDir();
  }

  ensureDir() {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  /**
   * 生成部分交付报告
   * @param {Array} tasks — 任务列表
   * @param {Object} results — 各任务执行结果
   * @returns {Object} 交付报告
   */
  generateReport(tasks, results) {
    const report = {
      summary: {
        total: tasks.length,
        completed: 0,
        failed: 0,
        pending: 0
      },
      completed: [],
      failed: [],
      pending: []
    };

    for (const task of tasks) {
      const result = results[task.id] || { status: 'PENDING' };

      if (result.status === 'SUCCESS') {
        report.summary.completed++;
        report.completed.push({
          id: task.id,
          name: task.name,
          classification: task.classification,
          outputPath: task.outputPath
        });
      } else if (result.status === 'FAILED') {
        report.summary.failed++;
        report.failed.push({
          id: task.id,
          name: task.name,
          classification: task.classification,
          reason: result.reason || 'Unknown',
          outputPath: task.outputPath
        });
      } else {
        report.summary.pending++;
        report.pending.push({
          id: task.id,
          name: task.name,
          classification: task.classification,
          outputPath: task.outputPath
        });
      }
    }

    // 保存挂起任务清单
    this.savePendingManifest(report.failed);

    return {
      report,
      manifestPath: path.join(this.outputDir, 'pending-manifest.json')
    };
  }

  savePendingManifest(failedTasks) {
    const manifest = {
      createdAt: new Date().toISOString(),
      pendingTasks: failedTasks.map(t => ({
        id: t.id,
        name: t.name,
        classification: t.classification,
        reason: t.reason,
        outputPath: t.outputPath,
        resumeHint: this.generateResumeHint(t)
      }))
    };

    const manifestPath = path.join(this.outputDir, 'pending-manifest.json');
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  }

  generateResumeHint(task) {
    if (task.reason && task.reason.includes('Context')) {
      return '建议：增加上下文预算或拆分任务后重试';
    }
    if (task.classification === 'EDGE') {
      return '建议：EDGE 任务可延后处理';
    }
    return '建议：查看原始错误后重试';
  }

  /**
   * 加载挂起任务清单
   */
  loadPendingManifest() {
    const manifestPath = path.join(this.outputDir, 'pending-manifest.json');
    if (!fs.existsSync(manifestPath)) {
      return null;
    }
    return JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  }

  /**
   * 清除已完成的挂起任务
   */
  clearCompleted(taskId) {
    const manifest = this.loadPendingManifest();
    if (!manifest) return;

    manifest.pendingTasks = manifest.pendingTasks.filter(t => t.id !== taskId);
    manifest.updatedAt = new Date().toISOString();

    const manifestPath = path.join(this.outputDir, 'pending-manifest.json');
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  }
}

module.exports = { PartialDelivery };
