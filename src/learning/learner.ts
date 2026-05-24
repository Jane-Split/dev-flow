// src/learning/learner.ts
import { PatternExtractor, type ExtractionContext } from './pattern-extractor.js';
import { FeedbackCollector, type FeedbackInput } from './feedback-collector.js';
import type { MemoryManager } from '../memory/index.js';
import type { LearnedPattern } from '../memory/types.js';
import { logger } from '../utils/logger.js';

export class Learner {
  private memory: MemoryManager;
  private patternExtractor: PatternExtractor;
  private feedbackCollector: FeedbackCollector;

  constructor(memory: MemoryManager) {
    this.memory = memory;
    this.patternExtractor = new PatternExtractor();
    this.feedbackCollector = new FeedbackCollector(memory);
  }

  async learn(context: ExtractionContext): Promise<LearnedPattern[]> {
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

  collectFeedback(input: FeedbackInput): void {
    this.feedbackCollector.collect(input);
  }

  async applyLearnedPatterns(context: string): Promise<LearnedPattern[]> {
    // 从记忆中检索相关模式
    const searchResults = await this.memory.search(context, { limit: 5 });
    
    const patterns = await this.memory.getPatterns() || [];
    
    // 根据搜索结果匹配模式
    return patterns.filter(p => 
      searchResults.some(s => 
        s.entry.content.toLowerCase().includes(p.name.toLowerCase())
      )
    );
  }

  private async updateConfidence(patterns: LearnedPattern[]): Promise<void> {
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

  async getLearningStats(): Promise<{
    totalPatterns: number;
    avgConfidence: number;
    topPatterns: LearnedPattern[];
  }> {
    const patterns = await this.memory.getPatterns() || [];

    const totalPatterns = patterns.length;
    const avgConfidence = totalPatterns > 0
      ? patterns.reduce((sum, p) => sum + (p.confidence || 0), 0) / totalPatterns
      : 0;

    const topPatterns = [...patterns]
      .sort((a, b) => (b.confidence || 0) - (a.confidence || 0))
      .slice(0, 10);

    return { totalPatterns, avgConfidence, topPatterns };
  }
}
