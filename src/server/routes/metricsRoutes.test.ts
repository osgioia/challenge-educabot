import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { Request, Response } from 'express'
import { createMetricsRouter } from './metricsRoutes.ts'
import { BooksProvider } from '../../providers/books.ts'
import { Book } from '../models/book.ts'

describe('metricsRoutes', () => {
  let mockBooksProvider: BooksProvider
  let mockReq: Partial<Request>
  let mockRes: Partial<Response>
  let jsonMock: any
  let statusMock: any
  let consoleSpy: any

  const mockBooks: Book[] = [
    { id: 1, name: 'Book 1', author: 'Author 1', units_sold: 100, price: 20 },
    { id: 2, name: 'Book 2', author: 'Author 2', units_sold: 200, price: 15 },
    { id: 3, name: 'Book 3', author: 'Author 1', units_sold: 300, price: 25 }
  ]

  beforeEach(() => {
    mockBooksProvider = {
      getBooks: vi.fn().mockResolvedValue(mockBooks)
    }

    jsonMock = vi.fn()
    statusMock = vi.fn().mockReturnThis()
    
    mockRes = {
      status: statusMock,
      json: jsonMock
    }

    mockReq = {
      query: {}
    }

    consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.clearAllMocks()
    consoleSpy.mockRestore()
  })

  describe('GET /metrics', () => {
    it('should return metrics successfully without author filter', async () => {
      const router = createMetricsRouter(mockBooksProvider)
      
      // Simulate the route handler
      const routeHandler = router.stack[0].route.stack[0].handle
      await routeHandler(mockReq as Request, mockRes as Response)

      expect(mockBooksProvider.getBooks).toHaveBeenCalledTimes(1)
      expect(statusMock).toHaveBeenCalledWith(200)
      expect(jsonMock).toHaveBeenCalledWith({
        mean_units_sold: 200,
        cheapest_book: mockBooks[1],
        books_written_by_author: []
      })
    })

    it('should return metrics successfully with author filter', async () => {
      mockReq.query = { author: 'Author 1' }
      
      const router = createMetricsRouter(mockBooksProvider)
      const routeHandler = router.stack[0].route.stack[0].handle
      await routeHandler(mockReq as Request, mockRes as Response)

      expect(mockBooksProvider.getBooks).toHaveBeenCalledTimes(1)
      expect(statusMock).toHaveBeenCalledWith(200)
      expect(jsonMock).toHaveBeenCalledWith({
        mean_units_sold: 200,
        cheapest_book: mockBooks[1],
        books_written_by_author: [mockBooks[0], mockBooks[2]]
      })
    })

    it('should handle 404 errors appropriately', async () => {
      const error404 = new Error('Resource not found (404): http://test.com/api')
      mockBooksProvider.getBooks = vi.fn().mockRejectedValue(error404)

      const router = createMetricsRouter(mockBooksProvider)
      const routeHandler = router.stack[0].route.stack[0].handle
      await routeHandler(mockReq as Request, mockRes as Response)

      expect(statusMock).toHaveBeenCalledWith(404)
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Books data not found',
        mean_units_sold: 0,
        cheapest_book: null,
        books_written_by_author: []
      })
      expect(consoleSpy).toHaveBeenCalledWith('Error in metrics route:', error404)
    })

    it('should handle 429 rate limit errors appropriately', async () => {
      const error429 = new Error('Too many requests (429). Please try again later.')
      mockBooksProvider.getBooks = vi.fn().mockRejectedValue(error429)

      const router = createMetricsRouter(mockBooksProvider)
      const routeHandler = router.stack[0].route.stack[0].handle
      await routeHandler(mockReq as Request, mockRes as Response)

      expect(statusMock).toHaveBeenCalledWith(429)
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Rate limit exceeded. Please try again later.',
        mean_units_sold: 0,
        cheapest_book: null,
        books_written_by_author: []
      })
    })

    it('should handle 500 server errors appropriately', async () => {
      const error500 = new Error('Internal server error (500). The external service is experiencing issues.')
      mockBooksProvider.getBooks = vi.fn().mockRejectedValue(error500)

      const router = createMetricsRouter(mockBooksProvider)
      const routeHandler = router.stack[0].route.stack[0].handle
      await routeHandler(mockReq as Request, mockRes as Response)

      expect(statusMock).toHaveBeenCalledWith(500)
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Internal server error',
        mean_units_sold: 0,
        cheapest_book: null,
        books_written_by_author: []
      })
    })

    it('should handle 502 bad gateway errors appropriately', async () => {
      const error502 = new Error('Bad gateway (502). The external service is temporarily unavailable.')
      mockBooksProvider.getBooks = vi.fn().mockRejectedValue(error502)

      const router = createMetricsRouter(mockBooksProvider)
      const routeHandler = router.stack[0].route.stack[0].handle
      await routeHandler(mockReq as Request, mockRes as Response)

      expect(statusMock).toHaveBeenCalledWith(502)
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Books service temporarily unavailable',
        mean_units_sold: 0,
        cheapest_book: null,
        books_written_by_author: []
      })
    })

    it('should handle 503 service unavailable errors appropriately', async () => {
      const error503 = new Error('Service unavailable (503). The external service is temporarily down.')
      mockBooksProvider.getBooks = vi.fn().mockRejectedValue(error503)

      const router = createMetricsRouter(mockBooksProvider)
      const routeHandler = router.stack[0].route.stack[0].handle
      await routeHandler(mockReq as Request, mockRes as Response)

      expect(statusMock).toHaveBeenCalledWith(503)
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Books service temporarily unavailable',
        mean_units_sold: 0,
        cheapest_book: null,
        books_written_by_author: []
      })
    })

    it('should handle 504 gateway timeout errors appropriately', async () => {
      const error504 = new Error('Gateway timeout (504). The external service took too long to respond.')
      mockBooksProvider.getBooks = vi.fn().mockRejectedValue(error504)

      const router = createMetricsRouter(mockBooksProvider)
      const routeHandler = router.stack[0].route.stack[0].handle
      await routeHandler(mockReq as Request, mockRes as Response)

      expect(statusMock).toHaveBeenCalledWith(504)
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Books service timeout',
        mean_units_sold: 0,
        cheapest_book: null,
        books_written_by_author: []
      })
    })

    it('should handle generic errors with 500 status', async () => {
      const genericError = new Error('Some unexpected error')
      mockBooksProvider.getBooks = vi.fn().mockRejectedValue(genericError)

      const router = createMetricsRouter(mockBooksProvider)
      const routeHandler = router.stack[0].route.stack[0].handle
      await routeHandler(mockReq as Request, mockRes as Response)

      expect(statusMock).toHaveBeenCalledWith(500)
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Internal server error',
        mean_units_sold: 0,
        cheapest_book: null,
        books_written_by_author: []
      })
    })

    it('should handle non-Error objects', async () => {
      const nonErrorObject = 'string error'
      mockBooksProvider.getBooks = vi.fn().mockRejectedValue(nonErrorObject)

      const router = createMetricsRouter(mockBooksProvider)
      const routeHandler = router.stack[0].route.stack[0].handle
      await routeHandler(mockReq as Request, mockRes as Response)

      expect(statusMock).toHaveBeenCalledWith(500)
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Internal server error',
        mean_units_sold: 0,
        cheapest_book: null,
        books_written_by_author: []
      })
    })
  })
})