/**
 * MethodDependencyGraph — 方法依赖图与拓扑排序
 *
 * 从设计契约提取方法调用关系，生成最优填充顺序。
 */
class MethodDependencyGraph {
  buildFromContract(contract) {
    const graph = new Map();

    for (const method of contract.methods || []) {
      const deps = new Set();

      for (const step of method.logicSteps || []) {
        const calledMethods = this.extractMethodCalls(step.description);
        calledMethods.forEach(m => deps.add(m));
      }

      for (const call of method.calls || []) {
        if (call.method) deps.add(call.method);
      }

      graph.set(method.name, deps);
    }

    return graph;
  }

  extractMethodCalls(description) {
    if (!description) return [];

    const patterns = [
      /调用\s+(\w+)/g,
      /call\s+(\w+)/g,
      /(\w+)\s*\([^)]*\)\s*$/gm
    ];

    const calls = [];
    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(description)) !== null) {
        calls.push(match[1]);
      }
    }

    return [...new Set(calls)];
  }

  topologicalSort(graph) {
    const visited = new Set();
    const temp = new Set();
    const result = [];

    const visit = (method) => {
      if (temp.has(method)) return;
      if (visited.has(method)) return;

      temp.add(method);
      for (const dep of graph.get(method) || []) {
        if (graph.has(dep)) visit(dep);
      }
      temp.delete(method);
      visited.add(method);
      result.push(method);
    };

    for (const method of graph.keys()) {
      visit(method);
    }

    return result;
  }

  generateFillPlan(contract) {
    const graph = this.buildFromContract(contract);
    const order = this.topologicalSort(graph);

    const batches = this.groupIntoBatches(order, graph);

    return {
      order,
      batches,
      graph: Object.fromEntries(graph),
      rationale: `Topological sort: callee methods filled before caller methods`
    };
  }

  groupIntoBatches(order, graph) {
    const batches = [];
    let currentBatch = [];
    const completed = new Set();

    for (const method of order) {
      const deps = graph.get(method) || new Set();

      const depsSatisfied = [...deps].every(d =>
        completed.has(d) || !order.includes(d)
      );

      if (depsSatisfied && currentBatch.length < 3) {
        currentBatch.push(method);
        completed.add(method);
      } else {
        if (currentBatch.length > 0) {
          batches.push([...currentBatch]);
        }
        currentBatch = [method];
        completed.add(method);
      }
    }

    if (currentBatch.length > 0) {
      batches.push(currentBatch);
    }

    return batches;
  }
}

module.exports = { MethodDependencyGraph };

if (require.main === module) {
  const fs = require('fs');
  const yaml = require('js-yaml');

  const contractPath = process.argv[2];
  if (!contractPath) {
    console.error('Usage: node method-dependency-graph.cjs <contract.yaml>');
    process.exit(1);
  }

  const contract = yaml.load(fs.readFileSync(contractPath, 'utf8'));
  const graph = new MethodDependencyGraph();
  const plan = graph.generateFillPlan(contract);

  console.log(JSON.stringify(plan, null, 2));
}
