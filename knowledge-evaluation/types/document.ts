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

export interface ParsedDocument {
  id: string
  filename: string
  fileType: string
  rawContent: string
  structuredContent: DocumentSection[]
  metadata: DocumentMetadata
  parseStatus: 'pending' | 'success' | 'failed'
  parseError?: string
}

export interface DocumentResponse {
  id: string
  filename: string
  fileType: string
  fileSize: number | null
  parseStatus: string
  metadata: DocumentMetadata | null
  createdAt: Date
  updatedAt: Date
}

export interface DocumentDetailResponse extends DocumentResponse {
  rawContent: string | null
  structuredContent: DocumentSection[] | null
  parseError: string | null
}
