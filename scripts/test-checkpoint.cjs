const fs = require('fs');
const { CheckpointManager } = require('./checkpoint-manager.cjs');

const mgr = new CheckpointManager('test-task', { checkpointDir: '/tmp/checkpoints' });

// Test create
const seq = mgr.create('TEST', { filePath: '/tmp/test.java', content: 'class Test {}' }, { totalMethods: 1 }, { tokensUsed: 100 });
console.assert(seq === 1, 'First checkpoint should be #1');

// Test restore
const restored = mgr.restore(1);
console.assert(restored.state === 'TEST', 'Should restore correct state');
console.assert(restored.code === 'class Test {}', 'Should restore correct code');

// Test resume
fs.writeFileSync('/tmp/test.java', 'modified');
const resumeResult = mgr.resume();
console.assert(resumeResult.canResume === true, 'Should be able to resume');
console.assert(fs.readFileSync('/tmp/test.java', 'utf8') === 'class Test {}', 'Should restore file content');

console.log('All checkpoint tests passed!');
