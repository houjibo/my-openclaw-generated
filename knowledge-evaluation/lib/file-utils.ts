import { fileTypeFromFile } from 'file-type'
import fs from 'fs/promises'
import path from 'path'

export async function detectFileType(filePath: string): Promise<string> {
  try {
    const buffer = await fs.readFile(filePath)
    const ext = path.extname(filePath).toLowerCase().replace('.', '')
    
    const typeMap: Record<string, string> = {
      'docx': 'docx',
      'doc': 'doc',
      'pdf': 'pdf',
      'pptx': 'pptx',
      'ppt': 'ppt',
      'xlsx': 'xlsx',
      'xls': 'xls',
      'txt': 'txt',
      'md': 'md',
      'markdown': 'md',
      'html': 'html',
      'htm': 'html',
      'json': 'json',
    }
    
    return typeMap[ext] || 'unknown'
  } catch (error) {
    console.error('Error detecting file type:', error)
    return 'unknown'
  }
}

export function isValidFileType(fileType: string): boolean {
  const validTypes = ['docx', 'doc', 'pdf', 'pptx', 'ppt', 'xlsx', 'xls', 'txt', 'md', 'html', 'json']
  return validTypes.includes(fileType)
}

export function getMaxFileSize(): number {
  return parseInt(process.env.MAX_FILE_SIZE || '52428800', 10)
}

export function getUploadDir(): string {
  return process.env.UPLOAD_DIR || './uploads'
}

export async function ensureUploadDir(): Promise<void> {
  const uploadDir = getUploadDir()
  try {
    await fs.access(uploadDir)
  } catch {
    await fs.mkdir(uploadDir, { recursive: true })
  }
}

export async function saveFile(buffer: Buffer, filename: string): Promise<string> {
  await ensureUploadDir()
  const uploadDir = getUploadDir()
  const filePath = path.join(uploadDir, `${Date.now()}-${filename}`)
  await fs.writeFile(filePath, buffer)
  return filePath
}

export async function deleteFile(filePath: string): Promise<void> {
  try {
    await fs.unlink(filePath)
  } catch (error) {
    console.error('Error deleting file:', error)
  }
}
