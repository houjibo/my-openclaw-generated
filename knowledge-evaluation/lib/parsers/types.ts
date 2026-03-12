import { DocumentSection, DocumentMetadata } from '@/types/document'

export interface ParserResult {
  rawContent: string
  structuredContent: DocumentSection[]
  metadata: DocumentMetadata
  success: boolean
  error?: string
}

export interface DocumentParser {
  parse(buffer: Buffer, filename: string): Promise<ParserResult>
}
