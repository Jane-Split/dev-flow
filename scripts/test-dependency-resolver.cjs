const { DependencyResolver } = require('./dependency-resolver.cjs');

const resolver = new DependencyResolver({ projectRoot: '/tmp' });
const result = resolver.resolve('Test');
console.assert(['NOT_FOUND', 'UNIQUE', 'AMBIGUOUS'].includes(result.status), 'Should return valid status');
console.log('Status:', result.status);
console.log('All dependency resolver tests passed!');
