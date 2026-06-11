const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

/**
 * CheckpointManager — 代码生成状态快照管理
 *
 * 在代码生成 FSM 的关键状态点保存快照：
 * - SKELETON_WRITTEN: 骨架写入后
 * - METHOD_FILLED: 每个方法填充后
 * - COMPLETE: 全部完成后
 */
class CheckpointManager {
  constructor(taskId, options = {}) {
    this.taskId = taskId;
    this.baseDir = options.checkpointDir || '.dev-flow/checkpoints';
    this.checkpointDir = path.join(this.baseDir, taskId);
    this.maxCheckpoints = options.maxCheckpoints || 5;
    this.ensureDir();
  }

  ensureDir() {
    if (!fs.existsSync(this.checkpointDir)) {
      fs.mkdirSync(this.checkpointDir, { recursive: true });
    }
  }

  create(state, codeSnapshot, progress, contextSummary) {
    const sequenceNumber = this.getNextSequence();

    const checkpoint = {
      metadata: {
        task_id: this.taskId,
        state,
        created_at: new Date().toISOString(),
        sequence_number: sequenceNumber
      },
      code_snapshot: {
        file_path: codeSnapshot.filePath,
        content_hash: this.hash(codeSnapshot.content),
        content_backup: this.compress(codeSnapshot.content)
      },
      progress: {
        ...progress,
        checkpoint_time: new Date().toISOString()
      },
      context_summary: {
        brief_excerpt: contextSummary.briefExcerpt?.substring(0, 500),
        tokens_used: contextSummary.tokensUsed,
        model: contextSummary.model
      }
    };

    const filePath = path.join(this.checkpointDir, `${sequenceNumber}.yaml`);
    fs.writeFileSync(filePath, this.serialize(checkpoint));

    this.gcCheckpoints();

    console.log(`[Checkpoint] #${sequenceNumber} saved for ${this.taskId} (${state})`);
    return sequenceNumber;
  }

  restore(sequenceNumber) {
    const filePath = path.join(this.checkpointDir, `${sequenceNumber}.yaml`);

    if (!fs.existsSync(filePath)) {
      throw new Error(`Checkpoint #${sequenceNumber} not found for ${this.taskId}`);
    }

    const checkpoint = this.deserialize(fs.readFileSync(filePath, 'utf8'));

    return {
      state: checkpoint.metadata.state,
      code: this.decompress(checkpoint.code_snapshot.content_backup),
      filePath: checkpoint.code_snapshot.file_path,
      progress: checkpoint.progress,
      contextSummary: checkpoint.context_summary
    };
  }

  getLatest() {
    const files = this.listCheckpointFiles();
    if (files.length === 0) return null;

    const latestNum = parseInt(files[files.length - 1]);
    return this.restore(latestNum);
  }

  resume() {
    const latest = this.getLatest();
    if (!latest) {
      return { canResume: false, reason: 'No checkpoint found' };
    }

    fs.writeFileSync(latest.filePath, latest.code);

    return {
      canResume: true,
      state: latest.state,
      progress: latest.progress,
      message: `Resumed from checkpoint #${latest.progress.sequence_number}, current method: ${latest.progress.currentMethod || 'N/A'}`
    };
  }

  listCheckpointFiles() {
    if (!fs.existsSync(this.checkpointDir)) return [];

    return fs.readdirSync(this.checkpointDir)
      .filter(f => f.endsWith('.yaml'))
      .map(f => f.replace('.yaml', ''))
      .sort((a, b) => parseInt(a) - parseInt(b));
  }

  getNextSequence() {
    const files = this.listCheckpointFiles();
    if (files.length === 0) return 1;
    return parseInt(files[files.length - 1]) + 1;
  }

  gcCheckpoints() {
    const files = this.listCheckpointFiles();
    if (files.length <= this.maxCheckpoints) return;

    const toDelete = files.slice(0, files.length - this.maxCheckpoints);
    for (const num of toDelete) {
      const filePath = path.join(this.checkpointDir, `${num}.yaml`);
      fs.unlinkSync(filePath);
      console.log(`[Checkpoint] GC: removed #${num}`);
    }
  }

  serialize(checkpoint) {
    const yaml = require('js-yaml');
    return yaml.dump(checkpoint);
  }

  deserialize(content) {
    const yaml = require('js-yaml');
    return yaml.load(content);
  }

  compress(content) {
    return zlib.deflateSync(Buffer.from(content, 'utf8')).toString('base64');
  }

  decompress(compressed) {
    return zlib.inflateSync(Buffer.from(compressed, 'base64')).toString('utf8');
  }

  hash(content) {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(content).digest('hex').substring(0, 16);
  }
}

module.exports = { CheckpointManager };

if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];
  const taskId = args[1];

  if (!command || !taskId) {
    console.error('Usage: node checkpoint-manager.cjs <create|restore|resume> <taskId>');
    process.exit(1);
  }

  const manager = new CheckpointManager(taskId);

  if (command === 'restore') {
    const num = parseInt(args[2]);
    const result = manager.restore(num);
    console.log(JSON.stringify(result, null, 2));
  } else if (command === 'resume') {
    const result = manager.resume();
    console.log(JSON.stringify(result, null, 2));
  } else if (command === 'list') {
    console.log(manager.listCheckpointFiles());
  }
}
