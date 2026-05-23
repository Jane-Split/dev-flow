export class FeedbackCollector {
    memory;
    constructor(memory) {
        this.memory = memory;
    }
    collect(input) {
        const feedback = {
            id: `feedback-${Date.now()}-${Math.random().toString(36).slice(2)}`,
            timestamp: new Date().toISOString(),
            stage: input.stage,
            task: input.task,
            userAction: input.userAction,
            originalOutput: input.originalOutput,
            userCorrection: input.userCorrection,
        };
        // 存储到数据库
        this.memory.addFeedback(feedback);
        // 如果用户修改了输出，提取学习点
        if (input.userAction === 'modified' && input.userCorrection) {
            this.extractLearning(feedback);
        }
        return feedback;
    }
    extractLearning(feedback) {
        // 分析用户修改，提取学习点
        if (feedback.userCorrection && feedback.originalOutput) {
            const learned = this.compareOutputs(feedback.originalOutput, feedback.userCorrection);
            if (learned) {
                feedback.learned = learned;
            }
        }
    }
    compareOutputs(original, corrected) {
        // 简化版：检测常见修改模式
        if (corrected.includes('httpOnly') && !original.includes('httpOnly')) {
            return '敏感认证信息应使用httpOnly cookie存储';
        }
        if (corrected.includes('try') && corrected.includes('catch') &&
            !original.includes('try')) {
            return '应添加错误处理';
        }
        if (corrected.includes('interface') && !original.includes('interface')) {
            return '应定义TypeScript类型';
        }
        return undefined;
    }
    getRecentFeedback(limit = 20) {
        return this.memory.getFeedback(limit);
    }
    analyzePatterns() {
        const feedbacks = this.memory.getFeedback(100);
        const stageStats = new Map();
        for (const f of feedbacks) {
            const stats = stageStats.get(f.stage) || { total: 0, modified: 0 };
            stats.total++;
            if (f.userAction === 'modified') {
                stats.modified++;
            }
            stageStats.set(f.stage, stats);
        }
        return Array.from(stageStats.entries()).map(([stage, stats]) => ({
            stage,
            modificationRate: stats.modified / stats.total,
        }));
    }
}
//# sourceMappingURL=feedback-collector.js.map