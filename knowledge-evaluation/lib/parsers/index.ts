import { DocumentParser, ParserResult } from './types'
import { DocxParser } from './docx-parser'
import { PdfParser } from './pdf-parser'
import { TextParser } from './text-parser'
import { PptxParser } from './pptx-parser'

export class ParserFactory {
  private static parsers: Map<string, DocumentParser> = new Map()

  static getParser(fileType: string): DocumentParser {
    const normalizedType = fileType.toLowerCase()
    
    if (!this.parsers.has(normalizedType)) {
      switch (normalizedType) {
        case 'docx':
          this.parsers.set(normalizedType, new DocxParser())
          break
        case 'pdf':
          this.parsers.set(normalizedType, new PdfParser())
          break
        case 'pptx':
          this.parsers.set(normalizedType, new PptxParser())
          break
        case 'txt':
        case 'md':
        case 'markdown':
        case 'html':
        case 'json':
          this.parsers.set(normalizedType, new TextParser())
          break
        default:
          // Default to text parser for unknown types
          this.parsers.set(normalizedType, new TextParser())
      }
    }

    return this.parsers.get(normalizedType)!
  }

  static async parseDocument(buffer: Buffer, fileType: string, filename: string): Promise<ParserResult> {
    const parser = this.getParser(fileType)
    return parser.parse(buffer, filename)
  }

  static isSupported(fileType: string): boolean {
    const supportedTypes = ['docx', 'pdf', 'pptx', 'txt', 'md', 'markdown', 'html', 'json']
    return supportedTypes.includes(fileType.toLowerCase())
  }
}

export type { ParserResult, DocumentParser }
