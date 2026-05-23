// src/analyzers/ambiguity-detector.ts

export interface Ambiguity {
  type: 'vague' | 'missing' | 'conflict' | 'undefined';
  description: string;
  location: string;
  suggestion: string;
  severity: 'high' | 'medium' | 'low';
}

export class AmbiguityDetector {
  detect(requirement: string): Ambiguity[] {
    const ambiguities: Ambiguity[] = [];
    const lower = requirement.toLowerCase();

    // 检测模糊词汇
    const vaguePatterns = [
      { pattern: /等\s*等|etc|等等/, word: '等等', suggestion: '请明确列出所有项目' },
      { pattern: /可能|maybe|perhaps/, word: '可能', suggestion: '请明确是否需要此功能' },
      { pattern: /大概|大约|approximately/, word: '大概', suggestion: '请提供具体的数值或范围' },
      { pattern: /一些|若干|some/, word: '一些', suggestion: '请明确具体数量' },
      { pattern: /尽量|尽可能/, word: '尽量', suggestion: '请明确是否必须实现' },
    ];

    for (const { pattern, word, suggestion } of vaguePatterns) {
      if (pattern.test(lower)) {
        ambiguities.push({
          type: 'vague',
          description: `发现模糊词汇: "${word}"`,
          location: this.findLocation(requirement, word),
          suggestion,
          severity: 'medium',
        });
      }
    }

    // 检测缺失信息
    const missingPatterns = [
      { pattern: /登录/, missing: '登录方式', suggestion: '请明确登录方式（账号密码/手机验证码/第三方登录）' },
      { pattern: /支付/, missing: '支付方式', suggestion: '请明确支付方式（微信/支付宝/银行卡）' },
      { pattern: /通知/, missing: '通知方式', suggestion: '请明确通知方式（站内信/邮件/短信/推送）' },
      { pattern: /导出/, missing: '导出格式', suggestion: '请明确导出格式（Excel/PDF/CSV）' },
    ];

    for (const { pattern, missing, suggestion } of missingPatterns) {
      if (pattern.test(lower)) {
        // 检查是否已经明确
        if (!lower.includes('方式') && !lower.includes('格式')) {
          ambiguities.push({
            type: 'missing',
            description: `缺少${missing}说明`,
            location: '整体需求',
            suggestion,
            severity: 'high',
          });
        }
      }
    }

    // 检测未定义的术语
    const termPatterns = [
      { pattern: /vip|会员/, term: 'VIP等级规则', suggestion: '请定义VIP等级划分和权益' },
      { pattern: /积分/, term: '积分规则', suggestion: '请定义积分获取和使用规则' },
    ];

    for (const { pattern, term, suggestion } of termPatterns) {
      if (pattern.test(lower)) {
        ambiguities.push({
          type: 'undefined',
          description: `未定义的业务术语: ${term}`,
          location: '整体需求',
          suggestion,
          severity: 'medium',
        });
      }
    }

    return ambiguities;
  }

  private findLocation(text: string, word: string): string {
    const index = text.indexOf(word);
    if (index === -1) return '未知位置';

    const start = Math.max(0, index - 20);
    const end = Math.min(text.length, index + word.length + 20);
    return '...' + text.slice(start, end) + '...';
  }
}
