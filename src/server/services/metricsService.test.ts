import { describe, it, expect } from 'vitest'
import { MetricsService } from './metricsService.ts'
import { BookCalculatorService } from './bookCalculatorService.ts'
import { Book } from '../models/book'

describe('MetricsService', () => {
  // Mock data
  const mockBooks: Book[] = [
    { id: 1, name: 'Book 1', author: 'Author 1', units_sold: 100, price: 20 },
    { id: 2, name: 'Book 2', author: 'Author 2', units_sold: 200, price: 15 },
    { id: 3, name: 'Book 3', author: 'Author 1', units_sold: 300, price: 25 }
  ]

  describe('generateMetrics', () => {
    it('should generate complete metrics without author filter', () => {
      const metricsService = new MetricsService()
      const result = metricsService.generateMetrics(mockBooks)
      
      expect(result).toEqual({
        mean_units_sold: 200,
        cheapest_book: mockBooks[1],
        books_written_by_author: []
      })
    })

    it('should generate complete metrics with author filter', () => {
      const metricsService = new MetricsService()
      const result = metricsService.generateMetrics(mockBooks, 'Author 1')
      
      expect(result).toEqual({
        mean_units_sold: 200,
        cheapest_book: mockBooks[1],
        books_written_by_author: [mockBooks[0], mockBooks[2]]
      })
    })

    it('should work with custom calculator', () => {
      const customCalculator = new BookCalculatorService()
      const metricsService = new MetricsService(customCalculator)
      const result = metricsService.generateMetrics(mockBooks)
      
      expect(result).toEqual({
        mean_units_sold: 200,
        cheapest_book: mockBooks[1],
        books_written_by_author: []
      })
    })
  })
})
