import { DocumentParser, ParserResult } from './types'
import { DocumentSection, DocumentMetadata } from '@/types/document'

// PPTX parser using native JS/TS approach
// Since python-pptx cannot be used directly in Node.js, we'll use a simple approach
export class PptxParser implements DocumentParser {
  async parse(buffer: Buffer, filename: string): Promise<ParserResult> {
    try {
      // PPTX files are ZIP archives containing XML files
      // For now, we'll extract text content using a simple approach
      const content = await this.extractTextFromPptx(buffer)
      const structuredContent = this.parseToSections(content)
      
      const metadata: DocumentMetadata = {
        wordCount: this.countWords(content),
        charCount: content.length,
        language: this.detectLanguage(content),
      }

      return {
        rawContent: content,
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
        error: error instanceof Error ? error.message : 'Failed to parse PPTX',
      }
    }
  }

  private async extractTextFromPptx(buffer: Buffer): Promise<string> {
    // Simple text extraction from PPTX buffer
    // In production, you would use a proper PPTX parsing library
    // or call a Python service to parse the file
    
    // Convert buffer to string and extract readable text
    const text = buffer.toString('utf-8')
    
    // Remove non-printable characters and XML tags
    const cleanText = text
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
    
    // If we got meaningful content, return it
    if (cleanText.length > 100) {
      return cleanText
    }
    
    // Fallback: return placeholder message for binary PPTX files
    return `[PPTX file]\n\nNote: This PPTX file requires server-side parsing with Python python-pptx library. Please ensure the backend parsing service is configured.`
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

      // Check for slide titles (often numbered or all caps)
      const isTitle = this.isTitle(line, lines[i + 1])
      
      if (isTitle) {
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
          content: line,
          level: 1,
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

  private isTitle(line: string, nextLine?: string): boolean {
    // Heuristic rules for detecting slide titles
    if (line.length > 100) return false
    if (line.match(/^第[一二三四五六七八九十\d]+[页张]/)) return true // Chinese slide number
    if (line.match(/^Slide\s+\d+/i)) return true // English slide number
    if (line.match(/^\d+\.\s+/)) return true // Numbered title
    if (line.toUpperCase() === line && line.length < 60 && line.length > 3) return true // ALL CAPS
    
    return false
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
