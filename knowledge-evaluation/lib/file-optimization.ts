import { createReadStream, createWriteStream, promises as fs } from 'fs'
import { pipeline } from 'stream/promises'
import { Transform } from 'stream'
import path from 'path'
import crypto from 'crypto'

// 文件处理进度跟踪
export interface FileProgress {
  loaded: number
  total: number
  percentage: number
  status: 'pending' | 'processing' | 'completed' | 'error'
  error?: string
}

type ProgressCallback = (progress: FileProgress) => void

// 生成文件哈希（用于去重）
export async function generateFileHash(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256')
    const stream = createReadStream(filePath)
    
    stream.on('error', reject)
    stream.on('data', chunk => hash.update(chunk))
    stream.on('end', () => resolve(hash.digest('hex')))
  })
}

// 流式文件写入（带进度追踪）
export async function streamFileUpload(
  source: ReadableStream<Uint8Array>,
  destination: string,
  totalSize: number,
  onProgress?: ProgressCallback
): Promise<void> {
  let loaded = 0
  
  const progressTransform = new Transform({
    transform(chunk: Buffer, encoding, callback) {
      loaded += chunk.length
      
      if (onProgress) {
        onProgress({
          loaded,
          total: totalSize,
          percentage: Math.round((loaded / totalSize) * 100),
          status: 'processing',
        })
      }
      
      callback(null, chunk)
    },
  })

  const reader = source.getReader()
  const nodeStream = new ReadableStream({
    start(controller) {
      function push() {
        reader.read().then(({ done, value }) => {
          if (done) {
            controller.close()
            return
          }
          controller.enqueue(Buffer.from(value))
          push()
        })
      }
      push()
    },
  })

  await pipeline(
    nodeStream as unknown as NodeJS.ReadableStream,
    progressTransform,
    createWriteStream(destination)
  )

  if (onProgress) {
    onProgress({
      loaded: totalSize,
      total: totalSize,
      percentage: 100,
      status: 'completed',
    })
  }
}

// 大文件分块处理
export interface ChunkOptions {
  chunkSize?: number // 默认 1MB
  overlap?: number   // 块间重叠字节数
}

export async function* readFileInChunks(
  filePath: string,
  options: ChunkOptions = {}
): AsyncGenerator<{ chunk: Buffer; index: number; start: number; end: number }> {
  const { chunkSize = 1024 * 1024, overlap = 0 } = options
  
  const stats = await fs.stat(filePath)
  const totalSize = stats.size
  
  const stream = createReadStream(filePath, {
    highWaterMark: chunkSize,
  })

  let index = 0
  let currentChunk = Buffer.alloc(0)
  let position = 0

  for await (const data of stream) {
    const chunk = Buffer.isBuffer(data) ? data : Buffer.from(data)
    currentChunk = Buffer.concat([currentChunk, chunk])

    while (currentChunk.length >= chunkSize) {
      const sliceEnd = chunkSize
      const nextChunk = currentChunk.slice(0, sliceEnd)
      
      yield {
        chunk: nextChunk,
        index,
        start: position,
        end: position + nextChunk.length,
      }

      position += nextChunk.length - overlap
      index++
      
      if (overlap > 0) {
        currentChunk = currentChunk.slice(chunkSize - overlap)
      } else {
        currentChunk = currentChunk.slice(chunkSize)
      }
    }
  }

  // 处理剩余数据
  if (currentChunk.length > 0) {
    yield {
      chunk: currentChunk,
      index,
      start: position,
      end: Math.min(position + currentChunk.length, totalSize),
    }
  }
}

// 文件缓存管理器
class FileCache {
  private cacheDir: string
  private maxSize: number
  private currentSize: number
  private accessLog: Map<string, number>

  constructor(cacheDir: string, maxSizeMB = 500) {
    this.cacheDir = cacheDir
    this.maxSize = maxSizeMB * 1024 * 1024
    this.currentSize = 0
    this.accessLog = new Map()
  }

  async init(): Promise<void> {
    try {
      await fs.mkdir(this.cacheDir, { recursive: true })
      await this.calculateSize()
    } catch {
      // 目录可能已存在
    }
  }

  private async calculateSize(): Promise<void> {
    const files = await fs.readdir(this.cacheDir)
    let totalSize = 0
    
    for (const file of files) {
      const stats = await fs.stat(path.join(this.cacheDir, file))
      totalSize += stats.size
      this.accessLog.set(file, stats.atimeMs)
    }
    
    this.currentSize = totalSize
  }

  private async evictIfNeeded(requiredSpace: number): Promise<void> {
    while (this.currentSize + requiredSpace > this.maxSize && this.accessLog.size > 0) {
      // 找到最久未访问的文件
      const oldest = Array.from(this.accessLog.entries())
        .sort((a, b) => a[1] - b[1])[0]
      
      if (oldest) {
        const [fileName,] = oldest
        const filePath = path.join(this.cacheDir, fileName)
        
        try {
          const stats = await fs.stat(filePath)
          await fs.unlink(filePath)
          this.currentSize -= stats.size
          this.accessLog.delete(fileName)
        } catch {
          // 文件可能已被删除
          this.accessLog.delete(fileName)
        }
      }
    }
  }

  async set(key: string, data: Buffer): Promise<void> {
    await this.evictIfNeeded(data.length)
    
    const filePath = path.join(this.cacheDir, key)
    await fs.writeFile(filePath, data)
    
    this.currentSize += data.length
    this.accessLog.set(key, Date.now())
  }

  async get(key: string): Promise<Buffer | null> {
    const filePath = path.join(this.cacheDir, key)
    
    try {
      const data = await fs.readFile(filePath)
      this.accessLog.set(key, Date.now())
      return data
    } catch {
      return null
    }
  }

  async has(key: string): Promise<boolean> {
    const filePath = path.join(this.cacheDir, key)
    
    try {
      await fs.access(filePath)
      return true
    } catch {
      return false
    }
  }

  async clear(): Promise<void> {
    const files = await fs.readdir(this.cacheDir)
    await Promise.all(
      files.map(file => fs.unlink(path.join(this.cacheDir, file)))
    )
    this.currentSize = 0
    this.accessLog.clear()
  }
}

// 导出文件缓存实例
export const fileCache = new FileCache(
  process.env.CACHE_DIR || './cache/files'
)

// 初始化文件缓存
fileCache.init().catch(console.error)

// 压缩文本内容
export function compressText(text: string): string {
  // 移除多余空白
  return text
    .replace(/\n\s*\n\s*\n/g, '\n\n')  // 多个空行合并
    .replace(/[ \t]+/g, ' ')           // 多个空格/制表符合并
    .trim()
}

// 检测文件编码
export async function detectEncoding(filePath: string): Promise<'utf-8' | 'utf-16le' | 'latin1'> {
  const buffer = await fs.readFile(filePath)
  
  // UTF-8 BOM
  if (buffer[0] === 0xEF && buffer[1] === 0xBB && buffer[2] === 0xBF) {
    return 'utf-8'
  }
  
  // UTF-16 LE BOM
  if (buffer[0] === 0xFF && buffer[1] === 0xFE) {
    return 'utf-16le'
  }
  
  // UTF-16 BE BOM
  if (buffer[0] === 0xFE && buffer[1] === 0xFF) {
    return 'utf-16le'
  }
  
  // 默认 UTF-8
  return 'utf-8'
}

// 安全的文件删除（移动到回收站或直接删除）
export async function safeDelete(filePath: string, moveToTrash = false): Promise<void> {
  if (moveToTrash) {
    const trashDir = path.join(process.env.UPLOAD_DIR || './uploads', '.trash')
    await fs.mkdir(trashDir, { recursive: true })
    
    const fileName = `${Date.now()}-${path.basename(filePath)}`
    await fs.rename(filePath, path.join(trashDir, fileName))
  } else {
    await fs.unlink(filePath)
  }
}

// 批量文件操作
export async function batchFileOperation<T>(
  files: string[],
  operation: (file: string) => Promise<T>,
  options: {
    concurrency?: number
    continueOnError?: boolean
  } = {}
): Promise<{ results: T[]; errors: Array<{ file: string; error: Error }> }> {
  const { concurrency = 5, continueOnError = true } = options
  const results: T[] = []
  const errors: Array<{ file: string; error: Error }> = []

  for (let i = 0; i < files.length; i += concurrency) {
    const batch = files.slice(i, i + concurrency)
    
    const batchResults = await Promise.allSettled(
      batch.map(file => operation(file))
    )

    batchResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        results.push(result.value)
      } else {
        const error = result.reason instanceof Error 
          ? result.reason 
          : new Error(String(result.reason))
        
        errors.push({ file: batch[index], error })
        
        if (!continueOnError) {
          throw error
        }
      }
    })
  }

  return { results, errors }
}
