import { EvaluationContext, MetricEvaluator } from './types'

export class ParseSuccessRateEvaluator implements MetricEvaluator {
  name = 'parseSuccessRate'
  description = '文档解析成功率'
  weight = 1.0

  async evaluate(context: EvaluationContext): Promise<number> {
    if (context.parseStatus === 'success') return 100
    if (context.parseStatus === 'failed') return 0
    return 50
  }
}

export class InformationDensityEvaluator implements MetricEvaluator {
  name = 'informationDensity'
  description = '信息密度 - 每字符的有效信息含量'
  weight = 1.0

  async evaluate(context: EvaluationContext): Promise<number> {
    const { rawContent, metadata } = context
    if (!rawContent || rawContent.length === 0) return 0

    const charCount = metadata.charCount || rawContent.length
    const wordCount = metadata.wordCount || this.countWords(rawContent)
    
    const density = (wordCount / charCount) * 100
    
    const normalizedScore = Math.min(100, Math.max(0, density * 2))
    
    return normalizedScore
  }

  private countWords(text: string): number {
    const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length
    const englishWords = (text.match(/[a-zA-Z]+/g) || []).length
    return chineseChars + englishWords
  }
}

export class PronounRatioEvaluator implements MetricEvaluator {
  name = 'pronounRatio'
  description = '代词占比 - 代词在总词汇中的比例，越低越好'
  weight = 1.0

  private chinesePronouns = [
    '我', '你', '他', '她', '它', '我们', '你们', '他们', '她们', '它们',
    '这', '那', '这里', '那里', '这个', '那个', '这些', '那些',
    '此', '彼', '其', '之', '其者', '本人', '本人', '自己', '自身'
  ]

  private englishPronouns = [
    'i', 'you', 'he', 'she', 'it', 'we', 'they',
    'me', 'him', 'her', 'us', 'them',
    'my', 'your', 'his', 'her', 'its', 'our', 'their',
    'mine', 'yours', 'hers', 'ours', 'theirs',
    'this', 'that', 'these', 'those', 'here', 'there',
    'myself', 'yourself', 'himself', 'herself', 'itself', 'ourselves', 'yourselves', 'themselves'
  ]

  async evaluate(context: EvaluationContext): Promise<number> {
    const { rawContent } = context
    if (!rawContent || rawContent.length === 0) return 100

    const totalWords = this.countWords(rawContent)
    if (totalWords === 0) return 100

    const pronounCount = this.countPronouns(rawContent)
    const ratio = (pronounCount / totalWords) * 100

    const score = Math.max(0, 100 - ratio * 10)
    
    return score
  }

  private countWords(text: string): number {
    const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length
    const englishWords = (text.match(/[a-zA-Z]+/g) || []).length
    return chineseChars + englishWords
  }

  private countPronouns(text: string): number {
    let count = 0
    
    const normalizedText = text.toLowerCase()
    
    this.chinesePronouns.forEach(pronoun => {
      const regex = new RegExp(pronoun, 'g')
      const matches = text.match(regex)
      if (matches) count += matches.length
    })

    this.englishPronouns.forEach(pronoun => {
      const regex = new RegExp(`\\b${pronoun}\\b`, 'g')
      const matches = normalizedText.match(regex)
      if (matches) count += matches.length
    })

    return count
  }
}

export class TerminologyConsistencyEvaluator implements MetricEvaluator {
  name = 'terminologyConsistency'
  description = '术语一致性 - 检查同一概念使用相同术语的程度'
  weight = 1.0

  async evaluate(context: EvaluationContext): Promise<number> {
    const { rawContent } = context
    if (!rawContent || rawContent.length < 100) return 100

    const technicalTerms = this.extractTechnicalTerms(rawContent)
    if (technicalTerms.length < 5) return 100

    const inconsistencies = this.checkInconsistencies(rawContent, technicalTerms)
    
    const consistency = Math.max(0, 100 - inconsistencies * 5)
    
    return consistency
  }

  private extractTechnicalTerms(text: string): string[] {
    const terms: string[] = []
    
    const quotedTerms = text.match(/[""']([^""']+)[""']/g) || []
    terms.push(...quotedTerms.map(t => t.replace(/[""']/g, '')))
    
    const uppercaseTerms = text.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g) || []
    terms.push(...uppercaseTerms)
    
    const parentheticalTerms = text.match(/\(([^)]+)\)/g) || []
    terms.push(...parentheticalTerms.map(t => t.replace(/[()]/g, '')))
    
    return [...new Set(terms.filter(t => t.length > 2))]
  }

  private checkInconsistencies(text: string, terms: string[]): number {
    let inconsistencies = 0
    
    const normalizedText = text.toLowerCase()
    
    const variations = [
      ['api', 'apis', 'api接口'],
      ['ui', '用户界面', '界面'],
      ['database', 'db', '数据库'],
      ['function', '函数', '方法'],
      ['class', '类'],
      ['module', '模块'],
      ['service', '服务'],
    ]

    variations.forEach(([canonical, ...alternatives]) => {
      let found = false
      let count = 0
      
      if (normalizedText.includes(canonical)) {
        found = true
        const regex = new RegExp(`\\b${canonical}\\b`, 'g')
        count += (normalizedText.match(regex) || []).length
      }
      
      alternatives.forEach(alt => {
        if (normalizedText.includes(alt)) {
          if (!found) {
            found = true
          } else {
            const regex = new RegExp(`\\b${alt}\\b`, 'g')
            count += (normalizedText.match(regex) || []).length
          }
        }
      })
      
      if (found && count > 0) {
        inconsistencies += count
      }
    })

    return inconsistencies
  }
}

export class ReadabilityScoreEvaluator implements MetricEvaluator {
  name = 'readabilityScore'
  description = '可读性评分 - 基于句子长度和词汇难度的综合评分'
  weight = 1.0

  async evaluate(context: EvaluationContext): Promise<number> {
    const { rawContent, metadata } = context
    if (!rawContent || rawContent.length === 0) return 0

    const sentences = this.splitSentences(rawContent)
    if (sentences.length === 0) return 0

    const avgSentenceLength = metadata.wordCount / sentences.length
    const longSentences = sentences.filter(s => s.length > 50).length
    const longSentenceRatio = longSentences / sentences.length

    let score = 100
    
    if (avgSentenceLength > 25) {
      score -= (avgSentenceLength - 25) * 2
    }
    
    score -= longSentenceRatio * 30

    const paragraphs = rawContent.split(/\n\n+/)
    if (paragraphs.length > 0) {
      const avgParagraphLength = metadata.wordCount / paragraphs.length
      if (avgParagraphLength > 200) {
        score -= (avgParagraphLength - 200) / 10
      }
    }

    return Math.max(0, Math.min(100, score))
  }

  private splitSentences(text: string): string[] {
    const chineseSentences = text.split(/[。！？；]/).filter(s => s.trim().length > 0)
    const englishSentences = text.split(/[.!?;]/).filter(s => s.trim().length > 0)
    
    return [...chineseSentences, ...englishSentences]
  }
}

export class ErrorRateEvaluator implements MetricEvaluator {
  name = 'errorRate'
  description = '错误率 - 拼写和语法错误的比例'
  weight = 1.0

  private commonChineseErrors = [
    { wrong: '的', correct: ['得', '地'] },
    { wrong: '做', correct: ['作'] },
    { wrong: '在', correct: ['再'] },
    { wrong: '那', correct: ['哪'] },
  ]

  private commonEnglishErrors = [
    { wrong: 'teh', correct: 'the' },
    { wrong: 'recieve', correct: 'receive' },
    { wrong: 'seperate', correct: 'separate' },
    { wrong: 'occured', correct: 'occurred' },
    { wrong: 'wich', correct: 'which' },
  ]

  async evaluate(context: EvaluationContext): Promise<number> {
    const { rawContent } = context
    if (!rawContent || rawContent.length === 0) return 100

    const totalWords = this.countWords(rawContent)
    if (totalWords === 0) return 100

    const errorCount = this.countErrors(rawContent)
    const errorRate = (errorCount / totalWords) * 100

    const score = Math.max(0, 100 - errorRate * 20)
    
    return score
  }

  private countWords(text: string): number {
    const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length
    const englishWords = (text.match(/[a-zA-Z]+/g) || []).length
    return chineseChars + englishWords
  }

  private countErrors(text: string): number {
    let errors = 0
    const normalizedText = text.toLowerCase()

    this.commonEnglishErrors.forEach(({ wrong }) => {
      const regex = new RegExp(`\\b${wrong}\\b`, 'gi')
      const matches = normalizedText.match(regex)
      if (matches) errors += matches.length
    })

    const repeatedChars = text.match(/(.)\1{3,}/g) || []
    errors += repeatedChars.length

    const brokenChars = text.match(/[\ufffd\u0000-\u001f]/g) || []
    errors += brokenChars.length

    return errors
  }
}
