import { EvaluationMetrics, IntrinsicMetrics, StructuralMetrics, ConsumptionMetrics } from '@/lib/evaluators/types';

export interface SuggestionCategory {
  name: string;
  weight: number;
  thresholds: {
    critical: number;
    warning: number;
    info: number;
  };
}

export interface OptimizationSuggestion {
  id?: string;
  category: string;
  subcategory: string;
  severity: 'critical' | 'warning' | 'info';
  description: string;
  currentValue?: any;
  suggestedValue?: any;
  autoApplicable: boolean;
  priority: number;
  metricKey?: string;
}

export interface SuggestionGenerationResult {
  suggestions: OptimizationSuggestion[];
  totalSuggestions: number;
  criticalCount: number;
  warningCount: number;
  infoCount: number;
  autoApplicableCount: number;
}

const SUGGESTION_CATEGORIES: Record<string, SuggestionCategory> = {
  intrinsic: {
    name: '内在质量',
    weight: 0.35,
    thresholds: { critical: 60, warning: 75, info: 85 },
  },
  structural: {
    name: '结构语义',
    weight: 0.35,
    thresholds: { critical: 60, warning: 75, info: 85 },
  },
  consumption: {
    name: '消费效果',
    weight: 0.30,
    thresholds: { critical: 60, warning: 75, info: 85 },
  },
};

const INTRINSIC_SUGGESTIONS: Record<string, { description: string; autoApplicable: boolean }> = {
  parseSuccessRate: {
    description: '文档解析存在错误，建议检查原始文件格式或尝试重新解析',
    autoApplicable: false,
  },
  informationDensity: {
    description: '信息密度过低，建议删除冗余内容或合并重复信息',
    autoApplicable: true,
  },
  pronounRatio: {
    description: '代词使用过多，可能导致上下文理解困难，建议替换为具体名词',
    autoApplicable: true,
  },
  terminologyConsistency: {
    description: '术语使用不一致，建议统一术语表达',
    autoApplicable: true,
  },
  readabilityScore: {
    description: '可读性较差，建议简化句子结构，增加段落分隔',
    autoApplicable: true,
  },
  errorRate: {
    description: '文档中存在较多错误，建议进行全面的语法和事实检查',
    autoApplicable: false,
  },
};

const STRUCTURAL_SUGGESTIONS: Record<string, { description: string; autoApplicable: boolean }> = {
  hierarchyCompleteness: {
    description: '文档层次结构不完整，建议添加明确的标题层级',
    autoApplicable: true,
  },
  paragraphCoherence: {
    description: '段落之间连贯性较差，建议增加过渡句或重新组织内容',
    autoApplicable: true,
  },
  listTableUsage: {
    description: '列表和表格使用不足，对于结构化信息建议使用列表或表格展示',
    autoApplicable: false,
  },
  codeBlockAnnotation: {
    description: '代码块缺少必要的注释或说明，建议为代码添加解释',
    autoApplicable: false,
  },
  figureQuality: {
    description: '图表质量不佳，建议检查图表清晰度并添加必要的说明',
    autoApplicable: false,
  },
  referenceIntegrity: {
    description: '引用完整性不足，建议检查所有引用链接和参考文献',
    autoApplicable: false,
  },
};

const CONSUMPTION_SUGGESTIONS: Record<string, { description: string; autoApplicable: boolean }> = {
  retrievalFriendliness: {
    description: '文档检索友好度较低，建议添加更多关键词和元数据',
    autoApplicable: true,
  },
  contextSelfContainment: {
    description: '上下文自包含性不足，建议确保段落能够独立理解',
    autoApplicable: true,
  },
  qaMatchingScore: {
    description: '问答匹配度较低，建议优化内容结构以更好地支持问答',
    autoApplicable: false,
  },
  vectorSimilarityDistribution: {
    description: '向量相似度分布不均匀，建议平衡文档各部分的信息密度',
    autoApplicable: false,
  },
  tokenEfficiency: {
    description: 'Token 使用效率较低，建议精简表达，删除冗余内容',
    autoApplicable: true,
  },
};

export class SuggestionGenerator {
  generateSuggestions(
    metrics: EvaluationMetrics,
    overallScore: number,
    content: string
  ): SuggestionGenerationResult {
    const suggestions: OptimizationSuggestion[] = [];
    let priority = 1;

    // 分析内在质量指标
    const intrinsicSuggestions = this.analyzeIntrinsicMetrics(
      metrics.intrinsic,
      priority
    );
    suggestions.push(...intrinsicSuggestions);
    priority += intrinsicSuggestions.length;

    // 分析结构语义指标
    const structuralSuggestions = this.analyzeStructuralMetrics(
      metrics.structural,
      priority
    );
    suggestions.push(...structuralSuggestions);
    priority += structuralSuggestions.length;

    // 分析消费效果指标
    const consumptionSuggestions = this.analyzeConsumptionMetrics(
      metrics.consumption,
      priority
    );
    suggestions.push(...consumptionSuggestions);
    priority += consumptionSuggestions.length;

    // 分析整体分数
    if (overallScore < 60) {
      suggestions.push({
        category: 'overall',
        subcategory: 'quality',
        severity: 'critical',
        description: '文档整体质量较低，建议进行全面的内容审查和优化',
        autoApplicable: false,
        priority: 0,
      });
    }

    // 按优先级排序
    suggestions.sort((a, b) => a.priority - b.priority);

    return {
      suggestions,
      totalSuggestions: suggestions.length,
      criticalCount: suggestions.filter((s) => s.severity === 'critical').length,
      warningCount: suggestions.filter((s) => s.severity === 'warning').length,
      infoCount: suggestions.filter((s) => s.severity === 'info').length,
      autoApplicableCount: suggestions.filter((s) => s.autoApplicable).length,
    };
  }

  private analyzeIntrinsicMetrics(
    metrics: IntrinsicMetrics,
    startPriority: number
  ): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = [];
    let priority = startPriority;

    for (const [key, value] of Object.entries(metrics)) {
      const config = INTRINSIC_SUGGESTIONS[key];
      if (!config) continue;

      const severity = this.determineSeverity(value, 'intrinsic');
      if (severity) {
        suggestions.push({
          category: 'intrinsic',
          subcategory: key,
          severity,
          description: this.enhanceDescription(config.description, value),
          currentValue: value,
          suggestedValue: this.calculateTargetValue(value, severity),
          autoApplicable: config.autoApplicable,
          priority: priority++,
          metricKey: key,
        });
      }
    }

    return suggestions;
  }

  private analyzeStructuralMetrics(
    metrics: StructuralMetrics,
    startPriority: number
  ): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = [];
    let priority = startPriority;

    for (const [key, value] of Object.entries(metrics)) {
      const config = STRUCTURAL_SUGGESTIONS[key];
      if (!config) continue;

      const severity = this.determineSeverity(value, 'structural');
      if (severity) {
        suggestions.push({
          category: 'structural',
          subcategory: key,
          severity,
          description: this.enhanceDescription(config.description, value),
          currentValue: value,
          suggestedValue: this.calculateTargetValue(value, severity),
          autoApplicable: config.autoApplicable,
          priority: priority++,
          metricKey: key,
        });
      }
    }

    return suggestions;
  }

  private analyzeConsumptionMetrics(
    metrics: ConsumptionMetrics,
    startPriority: number
  ): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = [];
    let priority = startPriority;

    for (const [key, value] of Object.entries(metrics)) {
      const config = CONSUMPTION_SUGGESTIONS[key];
      if (!config) continue;

      const severity = this.determineSeverity(value, 'consumption');
      if (severity) {
        suggestions.push({
          category: 'consumption',
          subcategory: key,
          severity,
          description: this.enhanceDescription(config.description, value),
          currentValue: value,
          suggestedValue: this.calculateTargetValue(value, severity),
          autoApplicable: config.autoApplicable,
          priority: priority++,
          metricKey: key,
        });
      }
    }

    return suggestions;
  }

  private determineSeverity(
    value: number,
    category: string
  ): 'critical' | 'warning' | 'info' | null {
    const thresholds = SUGGESTION_CATEGORIES[category].thresholds;

    if (value < thresholds.critical) {
      return 'critical';
    } else if (value < thresholds.warning) {
      return 'warning';
    } else if (value < thresholds.info) {
      return 'info';
    }

    return null;
  }

  private enhanceDescription(baseDescription: string, currentValue: number): string {
    return `${baseDescription} (当前值: ${currentValue.toFixed(1)})`;
  }

  private calculateTargetValue(currentValue: number, severity: string): number {
    switch (severity) {
      case 'critical':
        return Math.min(100, currentValue + 25);
      case 'warning':
        return Math.min(100, currentValue + 15);
      case 'info':
        return Math.min(100, currentValue + 8);
      default:
        return currentValue;
    }
  }

  prioritizeSuggestions(suggestions: OptimizationSuggestion[]): OptimizationSuggestion[] {
    const severityWeights = { critical: 3, warning: 2, info: 1 };
    const categoryWeights = {
      intrinsic: 0.35,
      structural: 0.35,
      consumption: 0.30,
    };

    return suggestions
      .map((s) => ({
        ...s,
        score:
          severityWeights[s.severity] * (categoryWeights[s.category as keyof typeof categoryWeights] || 0.3),
      }))
      .sort((a, b) => b.score - a.score)
      .map((s, index) => ({ ...s, priority: index + 1 }));
  }
}

export const suggestionGenerator = new SuggestionGenerator();
