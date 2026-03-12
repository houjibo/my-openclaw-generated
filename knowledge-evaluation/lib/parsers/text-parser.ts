import { DocumentParser, ParserResult } from './types'
import { DocumentSection, DocumentMetadata } from '@/types/document'

export class TextParser implements DocumentParser {
  async parse(buffer: Buffer, filename: string): Promise<ParserResult> {
    try {
      const rawContent = buffer.toString('utf-8')
      const structuredContent = this.parseToSections(rawContent)
      
      const metadata: DocumentMetadata = {
        wordCount: this.countWords(rawContent),
        charCount: rawContent.length,
        language: this.detectLanguage(rawContent),
      }

      return {
        rawContent,
        structuredContent,
        metadata,
        success: true,
      }
    } catch (error) {
      return {
        rawContent: '',
        structuredContent: [],
        metadata: {
          wordCount: 0,
          charCount: 0,
          language: 'unknown',
        },
        success: false,
        error: error instanceof Error ? error.message : 'Failed to parse text file',
      }
    }
  }

  private parseToSections(text: string): DocumentSection[] {
    const sections: DocumentSection[] = []
    const lines = text.split('\n')
    let position = 0
    let currentParagraph = ''

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()
      
      if (!line) {
        if (currentParagraph.trim()) {
          sections.push({
            id: `section-${position}`,
            type: 'paragraph',
            content: currentParagraph.trim(),
            position: position++,
          })
          currentParagraph = ''
        }
        continue
      }

      // Check for Markdown headings
      const headingMatch = line.match(/^(#{1,6})\s+(.+)$/)
      if (headingMatch) {
        if (currentParagraph.trim()) {
          sections.push({
            id: `section-${position}`,
            type: 'paragraph',
            content: currentParagraph.trim(),
            position: position++,
          })
          currentParagraph = ''
        }

        sections.push({
          id: `section-${position}`,
          type: 'title',
          content: headingMatch[2],
          level: headingMatch[1].length,
          position: position++,
        })
        continue
      }

      // Check for list items
      if (line.match(/^[\-\*•]\s+/) || line.match(/^\d+\.\s+/)) {
        if (currentParagraph.trim()) {
          sections.push({
            id: `section-${position}`,
            type: 'paragraph',
            content: currentParagraph.trim(),
            position: position++,
          })
          currentParagraph = ''
        }

        sections.push({
          id: `section-${position}`,
          type: 'list',
          content: line.replace(/^[\-\*•\d\.]\s+/, ''),
          position: position++,
        })
        continue
      }

      // Check for code blocks
      if (line.startsWith('```')) {
        if (currentParagraph.trim()) {
          sections.push({
            id: `section-${position}`,
            type: 'paragraph',
            content: currentParagraph.trim(),
            position: position++,
          })
          currentParagraph = ''
        }

        // Collect code block
        const codeLines: string[] = []
        const lang = line.slice(3).trim()
        i++
        
        while (i < lines.length && !lines[i].startsWith('```')) {
          codeLines.push(lines[i])
          i++
        }

        sections.push({
          id: `section-${position}`,
          type: 'code',
          content: codeLines.join('\n'),
          position: position++,
        })
        continue
      }

      currentParagraph += ' ' + line
    }

    if (currentParagraph.trim()) {
      sections.push({
        id: `section-${position}`,
        type: 'paragraph',
        content: currentParagraph.trim(),
        position: position++,
      })
    }

    return sections
  }

  private countWords(text: string): number {
    const chineseChars = text.match(/[\u4e00-\u9fa5]/g) || []
    const englishWords = text.match(/[a-zA-Z]+/g) || []
    return chineseChars.length + englishWords.length
  }

  private detectLanguage(text: string): string {
    const chineseChars = text.match(/[\u4e00-\u9fa5]/g) || []
    const totalChars = text.length
    
    if (totalChars === 0) return 'unknown'
    
    if (chineseChars.length / totalChars > 0.3) {
      return 'zh'
    }
    return 'en'
  }
}
