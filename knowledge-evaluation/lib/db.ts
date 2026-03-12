import { PrismaClient, Prisma } from '@prisma/client'

// 数据库连接池配置
const createPrismaClient = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' 
      ? ['query', 'info', 'warn', 'error']
      : ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  })
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// 缓存类型定义
type CacheValue<T> = {
  value: T
  expiresAt: number
}

// 简单的内存缓存实现
class MemoryCache {
  private cache = new Map<string, CacheValue<unknown>>()
  private readonly defaultTTL: number

  constructor(defaultTTL = 5 * 60 * 1000) { // 默认5分钟
    this.defaultTTL = defaultTTL
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key)
    if (!item) return null
    
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key)
      return null
    }
    
    return item.value as T
  }

  set<T>(key: string, value: T, ttl?: number): void {
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + (ttl ?? this.defaultTTL),
    })
  }

  delete(key: string): void {
    this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
  }

  // 清理过期缓存
  cleanup(): void {
    const now = Date.now()
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiresAt) {
        this.cache.delete(key)
      }
    }
  }
}

// 导出缓存实例
export const cache = new MemoryCache()

// 定期清理缓存（每10分钟）
if (typeof globalThis !== 'undefined') {
  setInterval(() => {
    cache.cleanup()
  }, 10 * 60 * 1000)
}

// 数据库查询优化辅助函数
export const dbUtils = {
  // 批量查询优化 - 使用 select 减少数据传输
  selectMinimalFields(select?: Prisma.DocumentSelect) {
    return {
      id: true,
      filename: true,
      fileType: true,
      fileSize: true,
      parseStatus: true,
      metadata: true,
      createdAt: true,
      updatedAt: true,
      ...select,
    }
  },

  // 带缓存的查询
  async getWithCache<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    const cached = cache.get<T>(key)
    if (cached) {
      return cached
    }

    const result = await fetchFn()
    cache.set(key, result, ttl)
    return result
  },

  // 批量更新操作
  async batchUpdate<T extends { id: string }>(
    items: T[],
    updateFn: (item: T) => Promise<unknown>,
    batchSize = 100
  ): Promise<void> {
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize)
      await Promise.all(batch.map(updateFn))
    }
  },

  // 分页查询优化 - 使用游标而非 offset
  async cursorPaginate<T extends { id: string }>(
    query: (cursor?: string) => Promise<T[]>,
    cursor?: string,
    limit = 50
  ): Promise<{ items: T[]; nextCursor?: string }> {
    const items = await query(cursor)
    
    if (items.length > limit) {
      return {
        items: items.slice(0, limit),
        nextCursor: items[items.length - 2]?.id,
      }
    }

    return { items }
  },

  // 清理缓存
  invalidateCache(pattern?: string): void {
    if (!pattern) {
      cache.clear()
      return
    }

    // 清理匹配的缓存键
    cache.clear()
  },
}

// 连接健康检查
export async function checkDatabaseHealth(): Promise<{
  healthy: boolean
  latency: number
  error?: string
}> {
  const start = Date.now()
  try {
    await prisma.$queryRaw`SELECT 1`
    return {
      healthy: true,
      latency: Date.now() - start,
    }
  } catch (error) {
    return {
      healthy: false,
      latency: Date.now() - start,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// 优雅关闭数据库连接
export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect()
  cache.clear()
}
