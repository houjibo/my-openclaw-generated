import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { apiHandler, batchProcessor, rateLimit, cachedApiCall, clearApiCache } from '../lib/api-optimization'
import { NextResponse } from 'next/server'

describe('API Optimization', () => {
  describe('apiHandler', () => {
    it('should handle successful requests', async () => {
      const handler = async () => ({ success: true })
      const response = await apiHandler(handler)
      
      expect(response).toBeInstanceOf(NextResponse)
      const data = await response.json()
      expect(data.data).toEqual({ success: true })
      expect(data.meta).toBeDefined()
    })

    it('should handle timeouts', async () => {
      const handler = async () => {
        await new Promise(resolve => setTimeout(resolve, 2000))
        return { data: 'late' }
      }
      
      const response = await apiHandler(handler, { timeout: 100 })
      expect(response.status).toBe(504)
    })

    it('should handle errors gracefully', async () => {
      const { AppError, ErrorType, ErrorSeverity } = await import('../lib/error-handling')
      
      const handler = async () => {
        throw new AppError('Test error', ErrorType.VALIDATION, ErrorSeverity.LOW, 400)
      }
      
      const response = await apiHandler(handler)
      expect(response.status).toBe(400)
      
      const data = await response.json()
      expect(data.error.message).toBe('Test error')
    })
  })

  describe('batchProcessor', () => {
    it('should process items in batches', async () => {
      const items = [1, 2, 3, 4, 5]
      const processor = async (item: number) => item * 2
      
      const { results } = await batchProcessor(items, processor, {
        batchSize: 2,
        concurrency: 2,
      })
      
      expect(results).toHaveLength(5)
      expect(results).toEqual([2, 4, 6, 8, 10])
    })

    it('should handle errors with continueOnError', async () => {
      const items = [1, 2, 3]
      const processor = async (item: number) => {
        if (item === 2) throw new Error('Failed')
        return item * 2
      }
      
      const { results, errors } = await batchProcessor(items, processor, {
        continueOnError: true,
      })
      
      expect(results).toEqual([2, 6])
      expect(errors).toHaveLength(1)
      expect(errors[0].item).toBe(2)
    })

    it('should stop on first error when continueOnError is false', async () => {
      const items = [1, 2, 3]
      const processor = async (item: number) => {
        if (item === 2) throw new Error('Failed')
        return item * 2
      }
      
      await expect(
        batchProcessor(items, processor, { continueOnError: false })
      ).rejects.toThrow('Failed')
    })
  })

  describe('rateLimit', () => {
    it('should allow requests under limit', () => {
      const result = rateLimit('test-id', { windowMs: 60000, maxRequests: 5 })
      
      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(4)
    })

    it('should block requests over limit', () => {
      const config = { windowMs: 60000, maxRequests: 2 }
      
      rateLimit('test-id-2', config)
      rateLimit('test-id-2', config)
      const result = rateLimit('test-id-2', config)
      
      expect(result.allowed).toBe(false)
      expect(result.remaining).toBe(0)
    })
  })

  describe('cachedApiCall', () => {
    beforeAll(() => {
      clearApiCache()
    })

    it('should cache API responses', async () => {
      let callCount = 0
      const fetchFn = async () => {
        callCount++
        return { data: 'test' }
      }

      const result1 = await cachedApiCall('test-cache-key', fetchFn, 60000)
      const result2 = await cachedApiCall('test-cache-key', fetchFn, 60000)

      expect(result1).toEqual(result2)
      expect(callCount).toBe(1)
    })

    it('should expire cache after TTL', async () => {
      let callCount = 0
      const fetchFn = async () => {
        callCount++
        return { data: 'test' }
      }

      await cachedApiCall('test-cache-key-2', fetchFn, 50)
      await new Promise(resolve => setTimeout(resolve, 100))
      await cachedApiCall('test-cache-key-2', fetchFn, 50)

      expect(callCount).toBe(2)
    })
  })
})
