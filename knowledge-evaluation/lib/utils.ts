import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']

  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}

export function formatDate(date: Date | string): string {
  const d = new Date(date)
  return d.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export function getFileExtension(filename: string): string {
  return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2)
}

export function getFileType(extension: string): string {
  const typeMap: Record<string, string> = {
    'docx': 'Word文档',
    'doc': 'Word文档',
    'pdf': 'PDF文档',
    'pptx': 'PowerPoint演示文稿',
    'ppt': 'PowerPoint演示文稿',
    'xlsx': 'Excel表格',
    'xls': 'Excel表格',
    'txt': '纯文本文件',
    'md': 'Markdown文档',
    'html': 'HTML文档',
    'json': 'JSON文件',
  }
  
  return typeMap[extension.toLowerCase()] || '未知类型'
}

export function calculateScoreColor(score: number): string {
  if (score >= 80) return 'text-green-600'
  if (score >= 60) return 'text-yellow-600'
  if (score >= 40) return 'text-orange-600'
  return 'text-red-600'
}

export function calculateScoreBgColor(score: number): string {
  if (score >= 80) return 'bg-green-100'
  if (score >= 60) return 'bg-yellow-100'
  if (score >= 40) return 'bg-orange-100'
  return 'bg-red-100'
}
