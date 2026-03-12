import { DocumentSection, DocumentMetadata } from '@/types/document'

export interface IntrinsicMetrics {
  parseSuccessRate: number
  informationDensity: number
  pronounRatio: number
  terminologyConsistency: number
  readabilityScore: number
  errorRate: number
}

export interface StructuralMetrics {
  hierarchyCompleteness: number
  paragraphCoherence: number
  listTableUsage: number
  codeBlockAnnotation: number
  figureQuality: number
  referenceIntegrity: number
}

export interface ConsumptionMetrics {
  retrievalFriendliness: number
  contextSelfContainment: number
  qaMatchingScore: number
  vectorSimilarityDistribution: number
  tokenEfficiency: number
}

export interface EvaluationMetrics {
  intrinsic: IntrinsicMetrics
  structural: StructuralMetrics
  consumption: ConsumptionMetrics
}

export interface EvaluationResult {
  overallScore: number
  intrinsicScore: number
  structuralScore: number
  consumptionScore: number
  metrics: EvaluationMetrics
  evaluatedAt: Date
  evaluationTimeMs: number
}

export interface EvaluationContext {
  rawContent: string
  structuredContent: DocumentSection[]
  metadata: DocumentMetadata
  parseStatus: string
  parseError?: string | null
}

export interface BaseEvaluator {
  evaluate(context: EvaluationContext): Promise<number>
}

export interface MetricEvaluator extends BaseEvaluator {
  name: string
  description: string
  weight: number
}
