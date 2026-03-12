import { Document } from '@prisma/client'
import { EvaluationContext, EvaluationResult, EvaluationMetrics } from './types'
import {
  ParseSuccessRateEvaluator,
  InformationDensityEvaluator,
  PronounRatioEvaluator,
  TerminologyConsistencyEvaluator,
  ReadabilityScoreEvaluator,
  ErrorRateEvaluator,
} from './intrinsic-evaluator'
import {
  HierarchyCompletenessEvaluator,
  ParagraphCoherenceEvaluator,
  ListTableUsageEvaluator,
  CodeBlockAnnotationEvaluator,
  FigureQualityEvaluator,
  ReferenceIntegrityEvaluator,
} from './structural-evaluator'

export class EvaluationEngine {
  private intrinsicEvaluators = [
    new ParseSuccessRateEvaluator(),
    new InformationDensityEvaluator(),
    new PronounRatioEvaluator(),
    new TerminologyConsistencyEvaluator(),
    new ReadabilityScoreEvaluator(),
    new ErrorRateEvaluator(),
  ]

  private structuralEvaluators = [
    new HierarchyCompletenessEvaluator(),
    new ParagraphCoherenceEvaluator(),
    new ListTableUsageEvaluator(),
    new CodeBlockAnnotationEvaluator(),
    new FigureQualityEvaluator(),
    new ReferenceIntegrityEvaluator(),
  ]

  async evaluate(document: Document): Promise<EvaluationResult> {
    const startTime = Date.now()

    const context: EvaluationContext = {
      rawContent: document.rawContent || '',
      structuredContent: (document.structuredContent as any[]) || [],
      metadata: (document.metadata as any) || {},
      parseStatus: document.parseStatus,
      parseError: document.parseError,
    }

    const intrinsicMetrics = await this.evaluateIntrinsic(context)
    const structuralMetrics = await this.evaluateStructural(context)

    const intrinsicScore = Object.values(intrinsicMetrics).reduce((a, b) => a + b, 0) / 6
    const structuralScore = Object.values(structuralMetrics).reduce((a, b) => a + b, 0) / 6

    const consumptionScore = this.calculateConsumptionScore(context, intrinsicScore, structuralScore)

    const overallScore = (
      intrinsicScore * 0.35 +
      structuralScore * 0.35 +
      consumptionScore * 0.30
    )

    const evaluationTimeMs = Date.now() - startTime

    return {
      overallScore: Math.round(overallScore * 100) / 100,
      intrinsicScore: Math.round(intrinsicScore * 100) / 100,
      structuralScore: Math.round(structuralScore * 100) / 100,
      consumptionScore: Math.round(consumptionScore * 100) / 100,
      metrics: {
        intrinsic: intrinsicMetrics,
        structural: structuralMetrics,
        consumption: {
          retrievalFriendliness: Math.round(consumptionScore * 0.9 * 100) / 100,
          contextSelfContainment: Math.round(intrinsicScore * 0.8 * 100) / 100,
          qaMatchingScore: Math.round(structuralScore * 0.85 * 100) / 100,
          vectorSimilarityDistribution: Math.round((intrinsicScore + structuralScore) / 2 * 100) / 100,
          tokenEfficiency: Math.round(intrinsicScore * 0.95 * 100) / 100,
        },
      },
      evaluatedAt: new Date(),
      evaluationTimeMs,
    }
  }

  private async evaluateIntrinsic(context: EvaluationContext) {
    const results = await Promise.all(
      this.intrinsicEvaluators.map(async evaluator => ({
        name: evaluator.name,
        score: await evaluator.evaluate(context),
      }))
    )

    return {
      parseSuccessRate: results.find(r => r.name === 'parseSuccessRate')?.score || 0,
      informationDensity: results.find(r => r.name === 'informationDensity')?.score || 0,
      pronounRatio: results.find(r => r.name === 'pronounRatio')?.score || 0,
      terminologyConsistency: results.find(r => r.name === 'terminologyConsistency')?.score || 0,
      readabilityScore: results.find(r => r.name === 'readabilityScore')?.score || 0,
      errorRate: results.find(r => r.name === 'errorRate')?.score || 0,
    }
  }

  private async evaluateStructural(context: EvaluationContext) {
    const results = await Promise.all(
      this.structuralEvaluators.map(async evaluator => ({
        name: evaluator.name,
        score: await evaluator.evaluate(context),
      }))
    )

    return {
      hierarchyCompleteness: results.find(r => r.name === 'hierarchyCompleteness')?.score || 0,
      paragraphCoherence: results.find(r => r.name === 'paragraphCoherence')?.score || 0,
      listTableUsage: results.find(r => r.name === 'listTableUsage')?.score || 0,
      codeBlockAnnotation: results.find(r => r.name === 'codeBlockAnnotation')?.score || 0,
      figureQuality: results.find(r => r.name === 'figureQuality')?.score || 0,
      referenceIntegrity: results.find(r => r.name === 'referenceIntegrity')?.score || 0,
    }
  }

  private calculateConsumptionScore(
    context: EvaluationContext,
    intrinsicScore: number,
    structuralScore: number
  ): number {
    const { rawContent } = context
    if (!rawContent) return 0

    const wordCount = this.countWords(rawContent)
    
    let score = (intrinsicScore * 0.5 + structuralScore * 0.5)

    if (wordCount < 100) {
      score *= 0.8
    } else if (wordCount > 5000) {
      score *= 0.9
    }

    const paragraphs = rawContent.split(/\n\n+/).length
    const avgParagraphLength = wordCount / paragraphs
    
    if (avgParagraphLength > 200) {
      score *= 0.95
    }

    return Math.min(100, score)
  }

  private countWords(text: string): number {
    const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length
    const englishWords = (text.match(/[a-zA-Z]+/g) || []).length
    return chineseChars + englishWords
  }
}

export * from './types'
export * from './intrinsic-evaluator'
export * from './structural-evaluator'
