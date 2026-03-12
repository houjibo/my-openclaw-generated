import { describe, it, expect } from 'vitest'
import { 
  AppError, 
  Errors, 
  ErrorType, 
  ErrorSeverity,
  withTimeout,
  withRetry 
} from '../lib/error-handling'

describe('Error Handling', () => {
  describe('AppError', () => {
    it('should create error with correct properties', () => {
      const error = new AppError(
        'Test error',
        ErrorType.VALIDATION,
        ErrorSeverity.LOW,
        400,
        { field: 'test' }
      )

      expect(error.message).toBe('Test error')
      expect(error.type).toBe(ErrorType.VALIDATION)
      expect(error.severity).toBe(ErrorSeverity.LOW)
      expect(error.statusCode).toBe(400)
      expect(error.details).toEqual({ field: 'test' })
    })

    it('should serialize to JSON correctly', () => {
      const error = new AppError('Test', ErrorType.INTERNAL, ErrorSeverity.HIGH)
      const json = error.toJSON()

      expect(json.name).toBe('AppError')
      expect(json.message).toBe('Test')
      expect(json.type).toBe(ErrorType.INTERNAL)
    })
  })

  describe('Error Helpers', () => {
    it('should create validation error', () => {
      const error = Errors.validation('Invalid input', { field: 'email' })
      
      expect(error.type).toBe(ErrorType.VALIDATION)
      expect(error.statusCode).toBe(400)
      expect(error.details).toEqual({ field: 'email' })
    })

    it('should create not found error', () => {
      const error = Errors.notFound('Document', '123')
      
      expect(error.message).toContain('Document')
      expect(error.message).toContain('123')
      expect(error.statusCode).toBe(404)
    })

    it('should create timeout error', () => {
      const error = Errors.timeout('database query', 5000)
      
      expect(error.type).toBe(ErrorType.TIMEOUT)
      expect(error.statusCode).toBe(504)
      expect(error.details).toEqual({ operation: 'database query', timeout: 5000 })
    })
  })

  describe('withTimeout', () => {
    it('should resolve if promise completes in time', async () => {
      const result = await withTimeout(
        Promise.resolve('success'),
        1000,
        'test'
      )
      expect(result).toBe('success')
    })

    it('should reject if promise times out', async () => {
      await expect(
        withTimeout(
          new Promise(resolve => setTimeout(resolve, 2000)),
          100,
          'slow operation'
        )
      ).rejects.toThrow('timed out')
    })
  })

  describe('withRetry', () => {
    it('should succeed on first attempt', async () => {
      let attempts = 0
      const result = await withRetry(async () => {
        attempts++
        return 'success'
      })

      expect(result).toBe('success')
      expect(attempts).toBe(1)
    })

    it('should retry on failure', async () => {
      let attempts = 0
      const result = await withRetry(async () => {
        attempts++
        if (attempts < 3) {
          throw new Error('Temporary error')
        }
        return 'success'
      }, 3, 10)

      expect(result).toBe('success')
      expect(attempts).toBe(3)
    })

    it('should fail after max retries', async () => {
      await expect(
        withRetry(
          async () => { throw new Error('Always fails') },
          2,
          10
        )
      ).rejects.toThrow('Always fails')
    })

    it('should respect shouldRetry callback', async () => {
      let attempts = 0
      
      await expect(
        withRetry(
          async () => {
            attempts++
            throw new Error('Non-retryable')
          },
          3,
          10,
          (error) => !error.message.includes('Non-retryable')
        )
      ).rejects.toThrow('Non-retryable')

      expect(attempts).toBe(1)
    })
  })
})
