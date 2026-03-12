import { describe, it, expect, beforeEach, beforeAll, afterAll } from 'vitest'
import { PrismaClient } from '@prisma/client'
import { prisma } from '../lib/db'
import { cache, dbUtils } from '../lib/db'

describe('Database', () => {
  describe('Connection', () => {
    it('should connect to database', async () => {
      const result = await prisma.$queryRaw`SELECT 1 as connected`
      expect(result).toBeDefined()
    })

    it('should handle multiple concurrent queries', async () => {
      const queries = Array(10).fill(null).map((_, i) => 
        prisma.$queryRaw`SELECT ${i} as num`
      )
      
      const results = await Promise.all(queries)
      expect(results).toHaveLength(10)
    })
  })

  describe('Cache', () => {
    beforeEach(() => {
      cache.clear()
    })

    it('should cache values', () => {
      cache.set('test-key', 'test-value')
      expect(cache.get('test-key')).toBe('test-value')
    })

    it('should return null for expired cache', () => {
      cache.set('test-key', 'test-value', -1)
      expect(cache.get('test-key')).toBeNull()
    })

    it('should respect custom TTL', async () => {
      cache.set('test-key', 'test-value', 100)
      expect(cache.get('test-key')).toBe('test-value')
      
      await new Promise(resolve => setTimeout(resolve, 150))
      expect(cache.get('test-key')).toBeNull()
    })
  })

  describe('dbUtils', () => {
    it('should fetch with cache', async () => {
      let callCount = 0
      const fetchFn = async () => {
        callCount++
        return { data: 'test' }
      }

      // First call should execute fetchFn
      const result1 = await dbUtils.getWithCache('test-key', fetchFn)
      expect(result1).toEqual({ data: 'test' })
      expect(callCount).toBe(1)

      // Second call should use cache
      const result2 = await dbUtils.getWithCache('test-key', fetchFn)
      expect(result2).toEqual({ data: 'test' })
      expect(callCount).toBe(1)
    })

    it('should batch update items', async () => {
      const items = Array(250).fill(null).map((_, i) => ({ id: `item-${i}` }))
      let updateCount = 0

      await dbUtils.batchUpdate(
        items,
        async (item) => {
          updateCount++
          return item
        },
        100
      )

      expect(updateCount).toBe(250)
    })
  })
})
