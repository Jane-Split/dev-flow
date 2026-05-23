// src/learning/learner.ts
import { PatternExtractor } from './pattern-extractor.js';
import { FeedbackCollector } from './feedback-collector.js';
import { logger } from '../utils/logger.js';
export class Learner {
    memory;
    patternExtractor;
    feedbackCollector;
    constructor(memory) {
        this.memory = memory;
        this.patternExtractor = new PatternExtractor();
        this.feedbackCollector = new FeedbackCollector(memory);
    }
    async learn(context) {
        logger.info('开始学习...');
        // 提取模式
        const patterns = this.patternExtractor.extract(context);
        logger.info(`提取了 ${patterns.length} 个模式`);
        // 保存到记忆
        for (const pattern of patterns) {
            await this.memory.addPattern(pattern);
        }
        // 更新置信度
        await this.updateConfidence(patterns);
        return patterns;
    }
    collectFeedback(input) {
        this.feedbackCollector.collect(input);
    }
    async applyLearnedPatterns(context) {
        // 从记忆中检索相关模式
        const searchResults = await this.memory.search(context, { limit: 5 });
        const patterns = await this.memory.getPatterns() || [];
        // 根据搜索结果匹配模式
        return patterns.filter(p => searchResults.some(s => s.entry.content.toLowerCase().includes(p.name.toLowerCase())));
    }
    async updateConfidence(patterns) {
        const existing = await this.memory.getPatterns() || [];
        for (const pattern of patterns) {
            const match = existing.find(p => p.name === pattern.name);
            if (match) {
                // 增加使用计数
                pattern.usageCount = match.usageCount + 1;
                // 更新置信度（使用贝叶斯更新简化版）
                pattern.confidence = Math.min(0.99, match.confidence + 0.05);
            }
        }
    }
    getLearningStats() {
        // 从记忆中获取统计
        return {
            totalPatterns: 0,
            avgConfidence: 0,
            topPatterns: [],
        };
    }
}
//# sourceMappingURL=learner.js.map