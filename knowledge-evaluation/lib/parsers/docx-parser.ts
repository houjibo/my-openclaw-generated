import mammoth from 'mammoth'
import { DocumentParser, ParserResult } from './types'
import { DocumentSection, DocumentMetadata } from '@/types/document'

export class DocxParser implements DocumentParser {
  async parse(buffer: Buffer, filename: string): Promise<ParserResult> {
    try {
      const result = await mammoth.extractRawText({ buffer })
      const rawContent = result.value
      
      // Parse HTML structure for better extraction
      const htmlResult = await mammoth.convertToHtml({ buffer })
      const structuredContent = this.parseHtmlToSections(htmlResult.value)
      
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
        error: error instanceof Error ? error.message : 'Failed to parse DOCX',
      }
    }
  }

  private parseHtmlToSections(html: string): DocumentSection[] {
    const sections: DocumentSection[] = []
    let position = 0

    // Simple HTML parsing to extract structure
    // Remove style tags and their content
    const cleanHtml = html
      .replace(/<style[^>]*>.*?<\/style>/gs, '')
      .replace(/<script[^>]*>.*?<\/script>/gs, '')

    // Split by common block elements
    const blocks = cleanHtml.split(/<\/(?:p|h[1-6]|li|tr)>/i)

    for (const block of blocks) {
      const trimmed = block.trim()
      if (!trimmed) continue

      // Check for headings
      const h1Match = trimmed.match(/<h1[^>]*>(.*?)<\/h1>/i)
      const h2Match = trimmed.match(/<h2[^>]*>(.*?)<\/h2>/i)
      const h3Match = trimmed.match(/<h3[^>]*>(.*?)<\/h3>/i)
      const h4Match = trimmed.match(/<h4[^>]*>(.*?)<\/h4>/i)
      const h5Match = trimmed.match(/<h5[^>]*>(.*?)<\/h5>/i)
      const h6Match = trimmed.match(/<h6[^>]*>(.*?)<\/h6>/i)
      const liMatch = trimmed.match(/<li[^>]*>(.*?)<\/li>/gi)

      if (h1Match) {
        sections.push({
          id: `section-${position}`,
          type: 'title',
          content: this.stripHtml(h1Match[1]),
          level: 1,
          position: position++,
        })
      } else if (h2Match) {
        sections.push({
          id: `section-${position}`,
          type: 'title',
          content: this.stripHtml(h2Match[1]),
          level: 2,
          position: position++,
        })
      } else if (h3Match) {
        sections.push({
          id: `section-${position}`,
          type: 'title',
          content: this.stripHtml(h3Match[1]),
          level: 3,
          position: position++,
        })
      } else if (h4Match) {
        sections.push({
          id: `section-${position}`,
          type: 'title',
          content: this.stripHtml(h4Match[1]),
          level: 4,
          position: position++,
        })
      } else if (h5Match) {
        sections.push({
          id: `section-${position}`,
          type: 'title',
          content: this.stripHtml(h5Match[1]),
          level: 5,
          position: position++,
        })
      } else if (h6Match) {
        sections.push({
          id: `section-${position}`,
          type: 'title',
          content: this.stripHtml(h6Match[1]),
          level: 6,
          position: position++,
        })
      } else if (liMatch && liMatch.length > 0) {
        // List items
        const listItems: DocumentSection[] = liMatch.map((li, idx) => ({
          id: `section-${position}-${idx}`,
          type: 'list',
          content: this.stripHtml(li.replace(/<\/?li[^>]*>/gi, '')),
          position: position + idx,
        }))
        sections.push(...listItems)
        position += liMatch.length
      } else {
        // Regular paragraph
        const content = this.stripHtml(trimmed)
        if (content.length > 0) {
          sections.push({
            id: `section-${position}`,
            type: 'paragraph',
            content,
            position: position++,
          })
        }
      }
    }

    return sections
  }

  private stripHtml(html: string): string {
    return html
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .trim()
  }

  private countWords(text: string): number {
    // Simple word count for Chinese and English
    const chineseChars = text.match(/[\u4e00-\u9fa5]/g) || []
    const englishWords = text.match(/[a-zA-Z]+/g) || []
    return chineseChars.length + englishWords.length
  }

  private detectLanguage(text: string): string {
    const chineseChars = text.match(/[\u4e00-\u9fa5]/g) || []
    const totalChars = text.length
    
    if (chineseChars.length / totalChars > 0.3) {
      return 'zh'
    }
    return 'en'
  }
}
