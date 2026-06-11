const fs = require('fs');
const { CompileLoopManager } = require('./compile-loop-manager.cjs');

const manager = new CompileLoopManager({ taskId: 'test-task', logsDir: '/tmp/compile-logs' });

// Round 1
const r1 = manager.startRound('Error 1\nError 2\nError 3');
console.assert(r1.canContinue === true, 'Round 1 should continue');
console.assert(r1.strategy === 'KEEP_FULL', 'Round 1 should keep full logs');

// Round 2
const r2 = manager.startRound('Error 4\nError 5');
console.assert(r2.canContinue === true, 'Round 2 should continue');
console.assert(r2.strategy === 'COMPRESS_HISTORY', 'Round 2 should compress history');

// Round 3
const r3 = manager.startRound('Error 6');
console.assert(r3.canContinue === true, 'Round 3 should continue');
console.assert(r3.strategy === 'PURGE_HISTORY', 'Round 3 should purge history');

// Round 4 (should fail)
const r4 = manager.startRound('Error 7');
console.assert(r4.canContinue === false, 'Round 4 should not continue');
console.assert(r4.recommendation === 'ESCALATE_TO_HUMAN', 'Should escalate to human');

console.log('All compile loop tests passed!');
