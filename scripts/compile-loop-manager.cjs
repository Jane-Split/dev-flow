const fs = require('fs');
const path = require('path');

/**
 * CompileLoopManager — 编译循环上下文管理
 * 
 * 管理编译修复循环中的上下文清理：
 * - Round 1: 保留完整错误日志
 * - Round 2: 压缩 Round 1 日志
 * - Round 3: 完全清理历史日志
 * - Round 3 失败: 触发降级策略
 */
class CompileLoopManager {
  constructor(options = {}) {
    this.taskId = options.taskId || 'default';
    this.logsDir = options.logsDir || '.dev-flow/compilation-logs';
    this.maxRounds = options.maxRounds || 3;
    this.currentRound = 0;
    this.ensureDir();
  }

  ensureDir() {
    const dir = path.join(this.logsDir, this.taskId);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  /**
   * 开始新一轮编译修复
   */
  startRound(errorLog) {
    this.currentRound++;
    
    if (this.currentRound > this.maxRounds) {
      return {
        canContinue: false,
        reason: `Maximum rounds (${this.maxRounds}) reached`,
        recommendation: 'ESCALATE_TO_HUMAN'
      };
    }

    // 根据轮次执行不同的清理策略
    const strategy = this.getCleanupStrategy();
    const cleanedContext = this.applyCleanup(strategy);

    // 保存当前轮次日志
    const logPath = path.join(this.logsDir, this.taskId, `round-${this.currentRound}.log`);
    fs.writeFileSync(logPath, errorLog);

    return {
      canContinue: true,
      round: this.currentRound,
      strategy: strategy.name,
      contextSize: cleanedContext.size,
      contextLimit: cleanedContext.limit,
      warning: strategy.warning
    };
  }

  getCleanupStrategy() {
    switch (this.currentRound) {
      case 1:
        return {
          name: 'KEEP_FULL',
          description: '保留完整错误日志',
          action: '保留所有错误信息',
          warning: null
        };
      
      case 2:
        return {
          name: 'COMPRESS_HISTORY',
          description: '压缩历史日志',
          action: 'Round 1 日志只保留错误类型和位置',
          warning: '历史日志已压缩，详细堆栈已移除'
        };
      
      case 3:
        return {
          name: 'PURGE_HISTORY',
          description: '完全清理历史日志',
          action: '只保留当前轮次错误，删除 Round 1-2 日志',
          warning: '历史日志已清理，只保留当前错误'
        };
      
      default:
        return {
          name: 'EMERGENCY_CLEANUP',
          description: '紧急清理',
          action: '最大限度压缩所有日志',
          warning: '紧急模式：上下文严重不足'
        };
    }
  }

  applyCleanup(strategy) {
    const dir = path.join(this.logsDir, this.taskId);
    
    if (!fs.existsSync(dir)) {
      return { size: 0, limit: 10240 };
    }

    const files = fs.readdirSync(dir).filter(f => f.endsWith('.log')).sort();
    let totalSize = 0;

    for (const file of files) {
      const filePath = path.join(dir, file);
      const roundNum = parseInt(file.match(/round-(\d+)\.log/)?.[1] || '0');
      
      if (roundNum >= this.currentRound) {
        // 当前轮次及以后的日志保留
        totalSize += fs.statSync(filePath).size;
        continue;
      }

      const content = fs.readFileSync(filePath, 'utf8');
      
      switch (strategy.name) {
        case 'COMPRESS_HISTORY':
          // 压缩为摘要格式
          const summary = this.compressLog(content);
          fs.writeFileSync(filePath, summary);
          totalSize += summary.length;
          break;
        
        case 'PURGE_HISTORY':
        case 'EMERGENCY_CLEANUP':
          // 删除历史日志
          fs.unlinkSync(filePath);
          break;
        
        default:
          totalSize += content.length;
      }
    }

    return {
      size: totalSize,
      limit: 10240, // 10KB 日志限制
      usagePercent: Math.round((totalSize / 10240) * 100)
    };
  }

  compressLog(content) {
    const lines = content.split('\n');
    const errors = [];
    
    for (const line of lines) {
      // 提取关键信息：文件、行号、错误类型
      const match = line.match(/(.+\.java):(\d+):\s*(error|warning):\s*(.+)/);
      if (match) {
        errors.push({
          file: match[1],
          line: match[2],
          type: match[3],
          message: match[4].substring(0, 100) // 截断长消息
        });
      }
    }

    if (errors.length === 0) {
      return '[COMPRESSED] No structured errors found in original log\n';
    }

    let summary = `[COMPRESSED] ${errors.length} errors from previous round\n`;
    for (const err of errors.slice(0, 10)) { // 最多保留 10 个
      summary += `${err.file}:${err.line}: ${err.type}: ${err.message}\n`;
    }
    if (errors.length > 10) {
      summary += `... and ${errors.length - 10} more errors\n`;
    }
    
    return summary;
  }

  /**
   * 获取当前编译循环状态
   */
  getStatus() {
    return {
      taskId: this.taskId,
      currentRound: this.currentRound,
      maxRounds: this.maxRounds,
      remainingRounds: Math.max(0, this.maxRounds - this.currentRound),
      canContinue: this.currentRound < this.maxRounds
    };
  }

  /**
   * 重置编译循环
   */
  reset() {
    this.currentRound = 0;
    const dir = path.join(this.logsDir, this.taskId);
    if (fs.existsSync(dir)) {
      const files = fs.readdirSync(dir).filter(f => f.endsWith('.log'));
      for (const file of files) {
        fs.unlinkSync(path.join(dir, file));
      }
    }
  }
}

module.exports = { CompileLoopManager };

if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];
  const taskId = args[1];

  if (!command || !taskId) {
    console.error('Usage: node compile-loop-manager.cjs <start|status|reset> <taskId>');
    process.exit(1);
  }

  const manager = new CompileLoopManager({ taskId });

  if (command === 'start') {
    const errorLog = args[2] || 'Sample error log';
    const result = manager.startRound(errorLog);
    console.log(JSON.stringify(result, null, 2));
  } else if (command === 'status') {
    console.log(JSON.stringify(manager.getStatus(), null, 2));
  } else if (command === 'reset') {
    manager.reset();
    console.log('Compile loop reset');
  }
}
