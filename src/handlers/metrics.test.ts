import { describe, it, expect, vi, beforeEach } from 'vitest'
import metricsHandler from './metrics'
import { Request, Response } from 'express'
import { BooksProvider } from '../providers/books'
import { Book } from '../models/book'

describe('metricsHandler', () => {
  // Mock data
  const mockBooks: Book[] = [
    { id: 1, name: 'Book 1', author: 'Author 1', unitsSold: 100, price: 20 },
    { id: 2, name: 'Book 2', author: 'Author 2', unitsSold: 200, price: 15 },
    { id: 3, name: 'Book 3', author: 'Author 1', unitsSold: 300, price: 25 }
  ]

  // Mock BooksProvider
  const mockBooksProvider: BooksProvider = {
    getBooks: vi.fn().mockReturnValue(mockBooks)
  }

  // Set up handler with mock provider
  const handler = metricsHandler(mockBooksProvider)

  // Mock request and response
  let mockReq: Partial<Request>
  let mockRes: Partial<Response>
  let jsonMock: any

  beforeEach(() => {
    jsonMock = vi.fn()
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: jsonMock
    }
    mockReq = {
      query: {}
    }
  })

  describe('get', () => {
    it('should return metrics with empty author query', async () => {
      await handler.get(mockReq as any, mockRes as any)

      expect(mockBooksProvider.getBooks).toHaveBeenCalled()
      expect(mockRes.status).toHaveBeenCalledWith(200)
      expect(jsonMock).toHaveBeenCalledWith({
        mean_units_sold: 200,
        cheapest_book: mockBooks[1],
        books_written_by_author: []
      })
    })

    it('should return metrics with author query', async () => {
      mockReq.query = { author: 'Author 1' }

      await handler.get(mockReq as any, mockRes as any)

      expect(mockBooksProvider.getBooks).toHaveBeenCalled()
      expect(mockRes.status).toHaveBeenCalledWith(200)
      expect(jsonMock).toHaveBeenCalledWith({
        mean_units_sold: 200,
        cheapest_book: mockBooks[1],
        books_written_by_author: [
          mockBooks[0],
          mockBooks[2]
        ]
      })
    })
  })
})
