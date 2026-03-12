import pdfParse from 'pdf-parse'
import { DocumentParser, ParserResult } from './types'
import { DocumentSection, DocumentMetadata } from '@/types/document'

export class PdfParser implements DocumentParser {
  async parse(buffer: Buffer, filename: string): Promise<ParserResult> {
    try {
      const data = await pdfParse(buffer)
      const rawContent = data.text
      
      const structuredContent = this.parseToSections(rawContent)
      
      const metadata: DocumentMetadata = {
        pageCount: data.numpages,
        wordCount: this.countWords(rawContent),
        charCount: rawContent.length,
        language: this.detectLanguage(rawContent),
        author: data.info?.Author || undefined,
        createdAt: data.info?.CreationDate ? new Date(data.info.CreationDate) : undefined,
        modifiedAt: data.info?.ModDate ? new Date(data.info.ModDate) : undefined,
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
        error: error instanceof Error ? error.message : 'Failed to parse PDF',
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
        // Empty line - save current paragraph if exists
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

      // Check if line looks like a heading
      // Heuristics: short line, ends without punctuation, next line is empty or shorter
      const isHeading = this.isHeading(line, lines[i + 1])
      
      if (isHeading) {
        // Save current paragraph first
        if (currentParagraph.trim()) {
          sections.push({
            id: `section-${position}`,
            type: 'paragraph',
            content: currentParagraph.trim(),
            position: position++,
          })
          currentParagraph = ''
        }

        // Determine heading level based on formatting
        const level = this.detectHeadingLevel(line, sections)
        
        sections.push({
          id: `section-${position}`,
          type: 'title',
          content: line,
          level,
          position: position++,
        })
      } else if (line.match(/^\s*[\-\*•]\s+/)) {
        // List item
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
          content: line.replace(/^\s*[\-\*•]\s+/, ''),
          position: position++,
        })
      } else {
        currentParagraph += ' ' + line
      }
    }

    // Don't forget the last paragraph
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

  private isHeading(line: string, nextLine?: string): boolean {
    // Heuristic rules for detecting headings
    if (line.length > 100) return false
    if (line.match(/[.!?;:]$/)) return false
    if (line.match(/^\d+\.\s+/)) return true // Numbered heading
    if (line.match(/^第[一二三四五六七八九十\d]+[章节]/)) return true // Chinese chapter
    if (line.toUpperCase() === line && line.length < 50 && line.length > 3) return true // ALL CAPS
    
    // If next line exists and is shorter or empty, current might be heading
    if (nextLine && nextLine.trim().length < line.length * 0.8) {
      return true
    }

    return false
  }

  private detectHeadingLevel(line: string, existingSections: DocumentSection[]): number {
    // Try to infer heading level
    if (line.match(/^第[一二三四五六七八九十\d]+章/)) return 1
    if (line.match(/^第[一二三四五六七八九十\d]+节/)) return 2
    if (line.match(/^\d+\./)) return 2
    if (line.match(/^\d+\.\d+/)) return 3
    if (line.toUpperCase() === line) return 2
    
    // Default based on context
    const lastTitle = existingSections
      .filter(s => s.type === 'title')
      .pop()
    
    if (!lastTitle) return 1
    return Math.min(lastTitle.level ? lastTitle.level + 1 : 2, 6)
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
