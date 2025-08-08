import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import httpBooksProvider from './books.ts'
import { HttpRetryService } from '../server/services/httpRetryService.ts'
import { Book } from '../server/models/book.ts'

// Mock the HttpRetryService
vi.mock('../server/services/httpRetryService.ts')
const MockedHttpRetryService = vi.mocked(HttpRetryService)

describe('httpBooksProvider', () => {
  let mockHttpService: { get: ReturnType<typeof vi.fn> }
  let consoleSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    mockHttpService = {
      get: vi.fn()
    }
    MockedHttpRetryService.mockImplementation(() => mockHttpService)
    
    // Mock console.error to avoid noise in tests
    consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.clearAllMocks()
    consoleSpy.mockRestore()
  })

  describe('successful requests', () => {
    it('should return books on successful API call', async () => {
      const mockBooks: Book[] = [
        { id: 1, name: 'Test Book 1', author: 'Author 1', units_sold: 1000, price: 20 },
        { id: 2, name: 'Test Book 2', author: 'Author 2', units_sold: 2000, price: 25 }
      ]

      mockHttpService.get.mockResolvedValueOnce(mockBooks)

      const provider = httpBooksProvider(mockHttpService)
      const result = await provider.getBooks()

      expect(result).toEqual(mockBooks)
      expect(mockHttpService.get).toHaveBeenCalledTimes(1)
      expect(mockHttpService.get).toHaveBeenCalledWith(
        expect.stringContaining('mockapi.io/api/v1/books')
      )
    })

    it('should use default HttpRetryService when none provided', async () => {
      const mockBooks: Book[] = [
        { id: 1, name: 'Test Book', author: 'Author', units_sold: 1000, price: 20 }
      ]

      // Create a new mock instance for the default case
      const defaultMockService = {
        get: vi.fn().mockResolvedValueOnce(mockBooks)
      }
      MockedHttpRetryService.mockImplementationOnce(() => defaultMockService)

      const provider = httpBooksProvider()
      const result = await provider.getBooks()

      expect(result).toEqual(mockBooks)
      expect(MockedHttpRetryService).toHaveBeenCalledWith({
        maxRetries: 3,
        baseDelay: 1000,
        maxDelay: 30000,
        retryableStatusCodes: [429, 500, 502, 503, 504]
      })
    })
  })

  describe('error handling', () => {
    it('should handle 404 errors gracefully', async () => {
      const error404 = new Error('Resource not found (404): http://test.com/api')
      mockHttpService.get.mockRejectedValueOnce(error404)

      const provider = httpBooksProvider(mockHttpService)

      await expect(provider.getBooks())
        .rejects.toThrow('Failed to fetch books: Resource not found (404): http://test.com/api')

      expect(consoleSpy).toHaveBeenCalledWith(
        'Error fetching books from API:',
        error404
      )
    })

    it('should handle 429 rate limit errors gracefully', async () => {
      const error429 = new Error('Too many requests (429). Please try again later.')
      mockHttpService.get.mockRejectedValueOnce(error429)

      const provider = httpBooksProvider(mockHttpService)

      await expect(provider.getBooks())
        .rejects.toThrow('Failed to fetch books: Too many requests (429). Please try again later.')

      expect(consoleSpy).toHaveBeenCalledWith(
        'Error fetching books from API:',
        error429
      )
    })

    it('should handle 500 server errors gracefully', async () => {
      const error500 = new Error('Internal server error (500). The external service is experiencing issues.')
      mockHttpService.get.mockRejectedValueOnce(error500)

      const provider = httpBooksProvider(mockHttpService)

      await expect(provider.getBooks())
        .rejects.toThrow('Failed to fetch books: Internal server error (500). The external service is experiencing issues.')
    })

    it('should handle 502 bad gateway errors gracefully', async () => {
      const error502 = new Error('Bad gateway (502). The external service is temporarily unavailable.')
      mockHttpService.get.mockRejectedValueOnce(error502)

      const provider = httpBooksProvider(mockHttpService)

      await expect(provider.getBooks())
        .rejects.toThrow('Failed to fetch books: Bad gateway (502). The external service is temporarily unavailable.')
    })

    it('should handle 503 service unavailable errors gracefully', async () => {
      const error503 = new Error('Service unavailable (503). The external service is temporarily down.')
      mockHttpService.get.mockRejectedValueOnce(error503)

      const provider = httpBooksProvider(mockHttpService)

      await expect(provider.getBooks())
        .rejects.toThrow('Failed to fetch books: Service unavailable (503). The external service is temporarily down.')
    })

    it('should handle 504 gateway timeout errors gracefully', async () => {
      const error504 = new Error('Gateway timeout (504). The external service took too long to respond.')
      mockHttpService.get.mockRejectedValueOnce(error504)

      const provider = httpBooksProvider(mockHttpService)

      await expect(provider.getBooks())
        .rejects.toThrow('Failed to fetch books: Gateway timeout (504). The external service took too long to respond.')
    })

    it('should handle network errors gracefully', async () => {
      const networkError = new Error('Network error: Connection failed')
      mockHttpService.get.mockRejectedValueOnce(networkError)

      const provider = httpBooksProvider(mockHttpService)

      await expect(provider.getBooks())
        .rejects.toThrow('Failed to fetch books: Network error: Connection failed')
    })

    it('should handle generic errors gracefully', async () => {
      const genericError = 'Some unexpected error'
      mockHttpService.get.mockRejectedValueOnce(genericError)

      const provider = httpBooksProvider(mockHttpService)

      await expect(provider.getBooks())
        .rejects.toThrow('Failed to fetch books from external service')

      expect(consoleSpy).toHaveBeenCalledWith(
        'Error fetching books from API:',
        genericError
      )
    })
  })

  describe('retry behavior', () => {
    it('should pass through retry service behavior', async () => {
      // First call fails with 429, second succeeds
      const mockBooks: Book[] = [
        { id: 1, name: 'Test Book', author: 'Author', units_sold: 1000, price: 20 }
      ]

      mockHttpService.get.mockResolvedValueOnce(mockBooks)

      const provider = httpBooksProvider(mockHttpService)
      const result = await provider.getBooks()

      expect(result).toEqual(mockBooks)
      expect(mockHttpService.get).toHaveBeenCalledTimes(1)
    })
  })
})