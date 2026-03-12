export type FileType = 'docx' | 'pdf' | 'pptx' | 'xlsx' | 'txt' | 'md' | 'html' | 'json'

export type ParseStatus = 'pending' | 'processing' | 'success' | 'failed'

export interface ParsedDocument {
  id: string
  filename: string
  fileType: FileType
  rawContent: string
  structuredContent: DocumentSection[]
  metadata: DocumentMetadata
  parseStatus: ParseStatus
  parseError?: string
}

export interface DocumentSection {
  id: string
  type: 'title' | 'paragraph' | 'list' | 'table' | 'code' | 'image'
  content: string
  level?: number
  position: number
  children?: DocumentSection[]
}

export interface DocumentMetadata {
  pageCount?: number
  wordCount: number
  charCount: number
  language: string
  author?: string
  createdAt?: Date
  modifiedAt?: Date
}

export interface EvaluationScore {
  documentId: string
  overallScore: number
  
  intrinsic: {
    total: number
    metrics: {
      parseSuccessRate: number
      informationDensity: number
      pronounRatio: number
      terminologyConsistency: number
      readabilityScore: number
      errorRate: number
    }
  }
  
  structural: {
    total: number
    metrics: {
      hierarchyCompleteness: number
      paragraphCoherence: number
      listTableUsage: number
      codeBlockAnnotation: number
      figureQuality: number
      referenceIntegrity: number
    }
  }
  
  consumption: {
    total: number
    metrics: {
      retrievalFriendliness: number
      contextSelfContainment: number
      qaMatchingScore: number
      vectorSimilarityDistribution: number
      tokenEfficiency: number
    }
  }
  
  evaluatedAt: Date
  version: number
}

export interface TestSuite {
  id: string
  documentId: string
  name: string
  description: string
  questions: TestQuestion[]
  generatedBy: 'auto' | 'manual'
  version: number
  createdAt: Date
}

export interface TestQuestion {
  id: string
  type: 'fact' | 'concept' | 'application' | 'comparison' | 'synthesis'
  question: string
  expectedAnswer: string
  referenceSections: string[]
  difficulty: 'easy' | 'medium' | 'hard'
  keywords: string[]
  metadata?: Record<string, any>
}

export interface OptimizationPlan {
  documentId: string
  currentScore: EvaluationScore
  targetScore: number
  actions: OptimizationAction[]
}

export interface OptimizationAction {
  type: 'rewrite' | 'restructure' | 'annotate' | 'deduplicate' | 'expand'
  target: string
  reason: string
  suggestion: string
  priority: 'high' | 'medium' | 'low'
  autoApplicable: boolean
}

export interface OptimizedDocument {
  originalId: string
  newId: string
  changes: DocumentChange[]
  scoreImprovement: {
    before: EvaluationScore
    after: EvaluationScore
    delta: number
  }
  createdAt: Date
}

export interface DocumentChange {
  section: string
  original: string
  optimized: string
  reason: string
}

export interface VectorizedDocument {
  id: string
  documentId: string
  version: 'original' | 'optimized'
  embeddingModel: string
  chunks: VectorChunk[]
  vectorizedAt: Date
}

export interface VectorChunk {
  id: string
  content: string
  embedding: number[]
  position: number
  tokenCount: number
}

export interface EvaluationRun {
  id: string
  testSuiteId: string
  vectorizedDocumentId: string
  results: TestResult[]
  summary: EvaluationSummary
  executedAt: Date
}

export interface TestResult {
  questionId: string
  retrieved: boolean
  retrievedChunks: string[]
  relevanceScore: number
  passed: boolean
}

export interface EvaluationSummary {
  totalQuestions: number
  passedQuestions: number
  passRate: number
  avgRelevanceScore: number
  metrics: {
    precision: number
    recall: number
    f1Score: number
  }
}

export interface APIResponse<T = any> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: any
  }
}

export interface PaginatedResponse<T> {
  success: boolean
  data: T[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}
