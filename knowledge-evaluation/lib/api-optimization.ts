import { NextResponse } from 'next/server'
import { errorLogger, AppError, Errors } from './error-handling'

// API 响应时间监控
interface PerformanceMetrics {
  startTime: number
  endTime?: number
  duration?: number
}

const requestMetrics = new Map<string, PerformanceMetrics>()

// 生成请求ID
function generateRequestId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

// API 响应包装器
export async function apiHandler<T>(
  handler: () => Promise<T>,
  options: {
    timeout?: number
    requireAuth?: boolean
  } = {}
): Promise<NextResponse> {
  const requestId = generateRequestId()
  const startTime = Date.now()
  
  const { timeout = 30000 } = options

  try {
    // 设置超时
    const result = await Promise.race([
      handler(),
      new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(Errors.timeout('API request', timeout))
        }, timeout)
      }),
    ])

    const duration = Date.now() - startTime

    // 记录慢请求
    if (duration > 5000) {
      console.warn(`[Slow API] Request ${requestId} took ${duration}ms`)
    }

    return NextResponse.json({
      data: result,
      meta: {
        requestId,
        duration,
        timestamp: new Date().toISOString(),
      },
    })

  } catch (error) {
    const duration = Date.now() - startTime

    // 记录错误
    errorLogger.log(error instanceof Error ? error : new Error(String(error)), {
      requestId,
      duration,
    })

    // 返回错误响应
    if (error instanceof AppError) {
      return NextResponse.json(
        {
          error: {
            type: error.type,
            message: error.message,
            details: error.details,
          },
          meta: {
            requestId,
            duration,
            timestamp: new Date().toISOString(),
          },
        },
        { status: error.statusCode }
      )
    }

    // 未知错误
    return NextResponse.json(
      {
        error: {
          type: 'INTERNAL_ERROR',
          message: 'Internal server error',
        },
        meta: {
          requestId,
          duration,
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    )
  }
}

// 流式响应处理器
export function createStreamResponse(
  generator: AsyncGenerator<unknown, void, unknown>,
  options: {
    contentType?: string
    headers?: Record<string, string>
  } = {}
): Response {
  const { contentType = 'application/json', headers = {} } = options

  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of generator) {
          const data = JSON.stringify(chunk) + '\n'
          controller.enqueue(new TextEncoder().encode(data))
        }
        controller.close()
      } catch (error) {
        const errorData = JSON.stringify({ error: (error as Error).message }) + '\n'
        controller.enqueue(new TextEncoder().encode(errorData))
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'no-cache',
      'X-Accel-Buffering': 'no',
      ...headers,
    },
  })
}

// 批量操作处理器
export async function batchProcessor<T, R>(
  items: T[],
  processor: (item: T) => Promise<R>,
  options: {
    batchSize?: number
    concurrency?: number
    continueOnError?: boolean
  } = {}
): Promise<{ results: R[]; errors: Array<{ item: T; error: Error }> }> {
  const {
    batchSize = 100,
    concurrency = 5,
    continueOnError = true,
  } = options

  const results: R[] = []
  const errors: Array<{ item: T; error: Error }> = []

  // 分批处理
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize)
    
    // 控制并发
    const chunks = []
    for (let j = 0; j < batch.length; j += concurrency) {
      chunks.push(batch.slice(j, j + concurrency))
    }

    for (const chunk of chunks) {
      const chunkResults = await Promise.allSettled(
        chunk.map(item => processor(item))
      )

      chunkResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          results.push(result.value)
        } else {
          const error = result.reason instanceof Error 
            ? result.reason 
            : new Error(String(result.reason))
          
          errors.push({ item: chunk[index], error })
          
          if (!continueOnError) {
            throw error
          }
        }
      })
    }
  }

  return { results, errors }
}

// 请求去重 - 防止重复提交
const pendingRequests = new Map<string, Promise<unknown>>()

export async function deduplicateRequest<T>(
  key: string,
  requestFn: () => Promise<T>,
  ttl = 5000
): Promise<T> {
  const existing = pendingRequests.get(key)
  if (existing) {
    return existing as Promise<T>
  }

  const promise = requestFn().finally(() => {
    setTimeout(() => {
      pendingRequests.delete(key)
    }, ttl)
  })

  pendingRequests.set(key, promise)
  return promise
}

// 速率限制中间件
interface RateLimitConfig {
  windowMs: number
  maxRequests: number
}

const rateLimitStore = new Map<string, Array<number>>()

export function rateLimit(
  identifier: string,
  config: RateLimitConfig = { windowMs: 60000, maxRequests: 100 }
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now()
  const { windowMs, maxRequests } = config

  const requests = rateLimitStore.get(identifier) || []
  
  // 清理过期的请求记录
  const validRequests = requests.filter(time => now - time < windowMs)
  
  const allowed = validRequests.length < maxRequests
  
  if (allowed) {
    validRequests.push(now)
  }
  
  rateLimitStore.set(identifier, validRequests)

  return {
    allowed,
    remaining: Math.max(0, maxRequests - validRequests.length),
    resetTime: now + windowMs,
  }
}

// API 响应缓存
const responseCache = new Map<string, {
  data: unknown
  expiresAt: number
}>()

export async function cachedApiCall<T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttl = 60000
): Promise<T> {
  const cached = responseCache.get(key)
  
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data as T
  }

  const data = await fetchFn()
  
  responseCache.set(key, {
    data,
    expiresAt: Date.now() + ttl,
  })

  return data
}

// 清除 API 缓存
export function clearApiCache(pattern?: string): void {
  if (!pattern) {
    responseCache.clear()
    return
  }

  for (const key of responseCache.keys()) {
    if (key.includes(pattern)) {
      responseCache.delete(key)
    }
  }
}

// 压缩大响应
export function compressResponse(data: unknown): Response {
  const jsonString = JSON.stringify(data)
  
  // 如果响应较小，不压缩
  if (jsonString.length < 1024) {
    return NextResponse.json(data)
  }

  // 对于大响应，使用流式传输
  return createStreamResponse(
    async function* () {
      const chunkSize = 64 * 1024 // 64KB
      for (let i = 0; i < jsonString.length; i += chunkSize) {
        yield { chunk: jsonString.slice(i, i + chunkSize) }
      }
    }(),
    { contentType: 'application/json' }
  )
}
