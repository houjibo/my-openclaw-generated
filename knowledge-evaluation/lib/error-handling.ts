import { toast } from 'sonner'

// 错误类型定义
export enum ErrorType {
  VALIDATION = 'VALIDATION',
  NOT_FOUND = 'NOT_FOUND',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  RATE_LIMIT = 'RATE_LIMIT',
  INTERNAL = 'INTERNAL',
  EXTERNAL_SERVICE = 'EXTERNAL_SERVICE',
  TIMEOUT = 'TIMEOUT',
  PARSE_ERROR = 'PARSE_ERROR',
}

// 错误严重程度
export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

// 自定义应用错误类
export class AppError extends Error {
  public readonly type: ErrorType
  public readonly severity: ErrorSeverity
  public readonly statusCode: number
  public readonly details?: Record<string, unknown>
  public readonly timestamp: Date

  constructor(
    message: string,
    type: ErrorType = ErrorType.INTERNAL,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    statusCode: number = 500,
    details?: Record<string, unknown>
  ) {
    super(message)
    this.name = 'AppError'
    this.type = type
    this.severity = severity
    this.statusCode = statusCode
    this.details = details
    this.timestamp = new Date()

    // 保持正确的堆栈跟踪
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError)
    }
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      type: this.type,
      severity: this.severity,
      statusCode: this.statusCode,
      details: this.details,
      timestamp: this.timestamp,
      stack: this.stack,
    }
  }
}

// 快捷创建错误方法
export const Errors = {
  validation: (message: string, details?: Record<string, unknown>) =>
    new AppError(message, ErrorType.VALIDATION, ErrorSeverity.LOW, 400, details),
  
  notFound: (resource: string, id?: string) =>
    new AppError(
      `${resource}${id ? ` with id "${id}"` : ''} not found`,
      ErrorType.NOT_FOUND,
      ErrorSeverity.LOW,
      404
    ),
  
  unauthorized: (message = 'Unauthorized') =>
    new AppError(message, ErrorType.UNAUTHORIZED, ErrorSeverity.MEDIUM, 401),
  
  forbidden: (message = 'Forbidden') =>
    new AppError(message, ErrorType.FORBIDDEN, ErrorSeverity.MEDIUM, 403),
  
  rateLimit: (retryAfter?: number) =>
    new AppError(
      'Rate limit exceeded',
      ErrorType.RATE_LIMIT,
      ErrorSeverity.LOW,
      429,
      retryAfter ? { retryAfter } : undefined
    ),
  
  internal: (message = 'Internal server error') =>
    new AppError(message, ErrorType.INTERNAL, ErrorSeverity.HIGH, 500),
  
  externalService: (service: string, message: string) =>
    new AppError(
      `External service error: ${message}`,
      ErrorType.EXTERNAL_SERVICE,
      ErrorSeverity.HIGH,
      502,
      { service }
    ),
  
  timeout: (operation: string, timeout: number) =>
    new AppError(
      `Operation "${operation}" timed out after ${timeout}ms`,
      ErrorType.TIMEOUT,
      ErrorSeverity.HIGH,
      504,
      { operation, timeout }
    ),
  
  parseError: (fileName: string, error: string) =>
    new AppError(
      `Failed to parse file "${fileName}": ${error}`,
      ErrorType.PARSE_ERROR,
      ErrorSeverity.MEDIUM,
      422,
      { fileName, error }
    ),
}

// 错误日志条目
interface ErrorLogEntry {
  id: string
  timestamp: Date
  type: ErrorType
  severity: ErrorSeverity
  message: string
  stack?: string
  context?: Record<string, unknown>
  userAgent?: string
  url?: string
  method?: string
}

// 错误日志管理器
class ErrorLogger {
  private logs: ErrorLogEntry[] = []
  private readonly maxLogs = 1000
  private readonly errorListeners: Set<(error: ErrorLogEntry) => void> = new Set()

  // 生成唯一ID
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  // 记录错误
  log(error: Error | AppError, context?: Record<string, unknown>): ErrorLogEntry {
    const entry: ErrorLogEntry = {
      id: this.generateId(),
      timestamp: new Date(),
      type: error instanceof AppError ? error.type : ErrorType.INTERNAL,
      severity: error instanceof AppError ? error.severity : ErrorSeverity.HIGH,
      message: error.message,
      stack: error.stack,
      context,
    }

    // 限制日志数量
    if (this.logs.length >= this.maxLogs) {
      this.logs.shift()
    }
    this.logs.push(entry)

    // 控制台输出（仅在开发环境或高严重错误）
    if (process.env.NODE_ENV === 'development' || entry.severity >= ErrorSeverity.HIGH) {
      console.error(`[${entry.type}] ${entry.severity}: ${entry.message}`, {
        id: entry.id,
        context: entry.context,
        stack: entry.stack,
      })
    }

    // 通知监听器
    this.errorListeners.forEach(listener => listener(entry))

    return entry
  }

  // 添加错误监听器
  onError(listener: (error: ErrorLogEntry) => void): () => void {
    this.errorListeners.add(listener)
    return () => this.errorListeners.delete(listener)
  }

  // 获取最近的错误
  getRecentErrors(limit = 50, severity?: ErrorSeverity): ErrorLogEntry[] {
    let filtered = [...this.logs]
    
    if (severity) {
      filtered = filtered.filter(log => log.severity === severity)
    }
    
    return filtered.slice(-limit).reverse()
  }

  // 获取错误统计
  getStats(): Record<ErrorType, number> {
    const stats = {} as Record<ErrorType, number>
    
    this.logs.forEach(log => {
      stats[log.type] = (stats[log.type] || 0) + 1
    })
    
    return stats
  }

  // 清空日志
  clear(): void {
    this.logs = []
  }

  // 导出日志
  export(): ErrorLogEntry[] {
    return [...this.logs]
  }
}

// 导出错误日志实例
export const errorLogger = new ErrorLogger()

// 前端错误处理器
export function handleClientError(error: Error | AppError, showToast = true): void {
  // 记录错误
  errorLogger.log(error, {
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
    url: typeof window !== 'undefined' ? window.location.href : undefined,
  })

  // 显示通知（如果不是低严重性错误）
  if (showToast && !(error instanceof AppError && error.severity === ErrorSeverity.LOW)) {
    const title = error instanceof AppError 
      ? getErrorTitle(error.type)
      : 'Error'
    
    toast.error(title, {
      description: error.message,
    })
  }
}

// 获取错误标题
function getErrorTitle(type: ErrorType): string {
  switch (type) {
    case ErrorType.VALIDATION:
      return 'Validation Error'
    case ErrorType.NOT_FOUND:
      return 'Not Found'
    case ErrorType.UNAUTHORIZED:
      return 'Unauthorized'
    case ErrorType.FORBIDDEN:
      return 'Access Denied'
    case ErrorType.RATE_LIMIT:
      return 'Rate Limited'
    case ErrorType.TIMEOUT:
      return 'Timeout'
    case ErrorType.PARSE_ERROR:
      return 'Parse Error'
    case ErrorType.EXTERNAL_SERVICE:
      return 'Service Error'
    default:
      return 'Error'
  }
}

// API 错误响应创建器
export function createErrorResponse(error: Error | AppError): Response {
  if (error instanceof AppError) {
    return Response.json(
      {
        error: {
          type: error.type,
          message: error.message,
          details: error.details,
        },
      },
      { status: error.statusCode }
    )
  }

  // 处理未知错误
  errorLogger.log(error, { unexpected: true })
  
  return Response.json(
    {
      error: {
        type: ErrorType.INTERNAL,
        message: 'Internal server error',
      },
    },
    { status: 500 }
  )
}

// 带超时的 Promise 包装器
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  operationName: string
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(Errors.timeout(operationName, timeoutMs))
      }, timeoutMs)
    }),
  ])
}

// 重试机制
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  delayMs = 1000,
  shouldRetry?: (error: Error) => boolean
): Promise<T> {
  let lastError: Error
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      
      // 判断是否应该重试
      if (attempt < maxRetries) {
        if (shouldRetry && !shouldRetry(lastError)) {
          throw lastError
        }
        
        // 指数退避
        const waitTime = delayMs * Math.pow(2, attempt)
        await new Promise(resolve => setTimeout(resolve, waitTime))
      }
    }
  }
  
  throw lastError!
}
