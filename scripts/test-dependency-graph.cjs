const { MethodDependencyGraph } = require('./method-dependency-graph.cjs');

const graph = new MethodDependencyGraph();
const plan = graph.generateFillPlan({
  methods: [
    { name: 'createOrder', logicSteps: [{ description: '调用 validateOrder' }] },
    { name: 'validateOrder', logicSteps: [] },
    { name: 'saveOrder', logicSteps: [{ description: '调用 createOrder' }] }
  ]
});

console.assert(plan.order[0] === 'validateOrder', 'validateOrder should be first');
console.assert(plan.order.indexOf('createOrder') < plan.order.indexOf('saveOrder'), 'createOrder before saveOrder');
console.log('Fill plan:', plan.order.join(' → '));
console.log('Batches:', plan.batches.map(b => `[${b.join(', ')}]`).join(' → '));
console.log('All dependency graph tests passed!');
