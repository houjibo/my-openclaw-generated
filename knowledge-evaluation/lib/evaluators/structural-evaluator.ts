import { DocumentSection } from '@/types/document'
import { EvaluationContext, MetricEvaluator } from './types'

export class HierarchyCompletenessEvaluator implements MetricEvaluator {
  name = 'hierarchyCompleteness'
  description = '层次结构完整度 - 文档标题层次结构的完整性'
  weight = 1.0

  async evaluate(context: EvaluationContext): Promise<number> {
    const { structuredContent } = context
    if (!structuredContent || structuredContent.length === 0) return 0

    const titles = structuredContent.filter(s => s.type === 'title')
    if (titles.length === 0) return 50

    const levels = titles.map(t => t.level || 1)
    const uniqueLevels = [...new Set(levels)].sort((a, b) => a - b)

    let expectedLevel = 1
    let gaps = 0
    for (const level of uniqueLevels) {
      if (level > expectedLevel) {
        gaps += level - expectedLevel
      }
      expectedLevel = level + 1
    }

    const score = Math.max(0, 100 - gaps * 20)
    
    return score
  }
}

export class ParagraphCoherenceEvaluator implements MetricEvaluator {
  name = 'paragraphCoherence'
  description = '段落连贯性 - 段落间的逻辑连贯程度'
  weight = 1.0

  private transitionWords = [
    '因此', '所以', '于是', '然后', '接着', '首先', '其次', '最后',
    '此外', '另外', '同时', '但是', '然而', '不过', '虽然',
    '例如', '比如', '譬如', '如', '像',
    '总之', '综上所述', '总而言之', '总的来说',
    'therefore', 'thus', 'hence', 'consequently', 'so',
    'then', 'next', 'afterward', 'meanwhile', 'subsequently',
    'first', 'second', 'third', 'finally', 'lastly',
    'furthermore', 'moreover', 'in addition', 'besides', 'also',
    'however', 'nevertheless', 'nonetheless', 'yet', 'but',
    'for example', 'for instance', 'such as', 'like',
    'in conclusion', 'to summarize', 'in summary', 'all in all'
  ]

  async evaluate(context: EvaluationContext): Promise<number> {
    const { structuredContent } = context
    if (!structuredContent || structuredContent.length < 2) return 100

    const paragraphs = structuredContent.filter(s => 
      s.type === 'paragraph' || s.type === 'list'
    )
    if (paragraphs.length < 2) return 100

    let transitions = 0
    let checkedParagraphs = 0

    for (let i = 1; i < paragraphs.length; i++) {
      const currentContent = paragraphs[i].content.toLowerCase()
      
      const hasTransition = this.transitionWords.some(word => 
        currentContent.includes(word.toLowerCase())
      )
      
      if (hasTransition) transitions++
      checkedParagraphs++
    }

    const transitionRatio = transitions / checkedParagraphs
    
    const score = Math.min(100, transitionRatio * 150)
    
    return score
  }
}

export class ListTableUsageEvaluator implements MetricEvaluator {
  name = 'listTableUsage'
  description = '列表/表格使用 - 结构化元素的使用情况'
  weight = 1.0

  async evaluate(context: EvaluationContext): Promise<number> {
    const { structuredContent } = context
    if (!structuredContent || structuredContent.length === 0) return 0

    const totalSections = structuredContent.length
    const lists = structuredContent.filter(s => s.type === 'list').length
    const tables = structuredContent.filter(s => s.type === 'table').length
    
    const structuredElements = lists + tables
    
    if (totalSections === 0) return 0

    const ratio = structuredElements / totalSections
    
    const optimalRatio = 0.2
    const diff = Math.abs(ratio - optimalRatio)
    
    const score = Math.max(0, 100 - diff * 200)
    
    return score
  }
}

export class CodeBlockAnnotationEvaluator implements MetricEvaluator {
  name = 'codeBlockAnnotation'
  description = '代码块标注 - 代码块的语言标注完整度'
  weight = 1.0

  async evaluate(context: EvaluationContext): Promise<number> {
    const { structuredContent } = context
    if (!structuredContent || structuredContent.length === 0) return 100

    const codeBlocks = structuredContent.filter(s => s.type === 'code')
    if (codeBlocks.length === 0) return 100

    const annotatedBlocks = codeBlocks.filter(s => {
      const content = s.content.trim()
      const firstLine = content.split('\n')[0]
      return /^```\w+/.test(firstLine) || firstLine.startsWith('```')
    }).length

    const ratio = annotatedBlocks / codeBlocks.length
    
    return ratio * 100
  }
}

export class FigureQualityEvaluator implements MetricEvaluator {
  name = 'figureQuality'
  description = '图表质量 - 图表的清晰度和标注完整性'
  weight = 1.0

  async evaluate(context: EvaluationContext): Promise<number> {
    const { structuredContent } = context
    if (!structuredContent || structuredContent.length === 0) return 100

    const figures = structuredContent.filter(s => s.type === 'image')
    if (figures.length === 0) return 100

    let totalScore = 0

    figures.forEach(figure => {
      const content = figure.content
      let figureScore = 50

      const hasCaption = /图\s*\d+|figure\s*\d+/i.test(content)
      if (hasCaption) figureScore += 25

      const hasDescription = content.length > 20
      if (hasDescription) figureScore += 25

      totalScore += figureScore
    })

    return totalScore / figures.length
  }
}

export class ReferenceIntegrityEvaluator implements MetricEvaluator {
  name = 'referenceIntegrity'
  description = '引用完整性 - 引用的完整性和可追踪性'
  weight = 1.0

  async evaluate(context: EvaluationContext): Promise<number> {
    const { rawContent, structuredContent } = context
    if (!rawContent || rawContent.length === 0) return 100

    const referencePatterns = [
      /\[\d+\]/g,
      /\[.*?\]\(.*?\)/g,
      /\[.*?\]:\s*https?:\/\//g,
      /https?:\/\/[^\s]+/g,
      /参见.*?第.*?章/g,
      /详见.*?第.*?节/g,
      /refer to.*?section/gi,
      /see.*?chapter/gi,
    ]

    let referenceCount = 0
    referencePatterns.forEach(pattern => {
      const matches = rawContent.match(pattern)
      if (matches) referenceCount += matches.length
    })

    if (referenceCount === 0) return 100

    const totalWords = this.countWords(rawContent)
    const density = referenceCount / totalWords

    const optimalDensity = 0.01
    const diff = Math.abs(density - optimalDensity)
    
    const score = Math.max(0, 100 - diff * 5000)
    
    return score
  }

  private countWords(text: string): number {
    const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length
    const englishWords = (text.match(/[a-zA-Z]+/g) || []).length
    return chineseChars + englishWords || 1
  }
}
