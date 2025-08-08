import { describe, it, expect, beforeEach } from 'vitest'
import { BookCalculatorService } from './bookCalculatorService.ts'
import { Book } from '../models/book'

describe('BookCalculatorService', () => {
  let calculatorService: BookCalculatorService
  
  // Mock data
  const mockBooks: Book[] = [
    { id: 1, name: 'Book 1', author: 'Author 1', units_sold: 100, price: 20 },
    { id: 2, name: 'Book 2', author: 'Author 2', units_sold: 200, price: 15 },
    { id: 3, name: 'Book 3', author: 'Author 1', units_sold: 300, price: 25 }
  ]

  beforeEach(() => {
    calculatorService = new BookCalculatorService()
  })

  describe('calculateMeanUnitsSold', () => {
    it('should calculate correct mean units sold', () => {
      const result = calculatorService.calculateMeanUnitsSold(mockBooks)
      expect(result).toBe(200) // (100 + 200 + 300) / 3 = 200
    })

    it('should return 0 for empty array', () => {
      const result = calculatorService.calculateMeanUnitsSold([])
      expect(result).toBe(0)
    })

    it('should handle single book', () => {
      const singleBook = [mockBooks[0]]
      const result = calculatorService.calculateMeanUnitsSold(singleBook)
      expect(result).toBe(100)
    })
  })

  describe('findCheapestBook', () => {
    it('should find the cheapest book', () => {
      const result = calculatorService.findCheapestBook(mockBooks)
      expect(result).toEqual(mockBooks[1]) // Book 2 with price 15
    })

    it('should return null for empty array', () => {
      const result = calculatorService.findCheapestBook([])
      expect(result).toBeNull()
    })

    it('should handle single book', () => {
      const singleBook = [mockBooks[0]]
      const result = calculatorService.findCheapestBook(singleBook)
      expect(result).toEqual(mockBooks[0])
    })

    it('should handle books with same price', () => {
      const samePriceBooks: Book[] = [
        { id: 1, name: 'Book 1', author: 'Author 1', units_sold: 100, price: 20 },
        { id: 2, name: 'Book 2', author: 'Author 2', units_sold: 200, price: 20 }
      ]
      const result = calculatorService.findCheapestBook(samePriceBooks)
      expect(result).toEqual(samePriceBooks[0]) // Should return first one found
    })
  })

  describe('findBooksByAuthor', () => {
    it('should find books by specific author', () => {
      const result = calculatorService.findBooksByAuthor(mockBooks, 'Author 1')
      expect(result).toEqual([mockBooks[0], mockBooks[2]])
    })

    it('should be case insensitive', () => {
      const result = calculatorService.findBooksByAuthor(mockBooks, 'author 1')
      expect(result).toEqual([mockBooks[0], mockBooks[2]])
    })

    it('should return empty array for non-existent author', () => {
      const result = calculatorService.findBooksByAuthor(mockBooks, 'Non-existent Author')
      expect(result).toEqual([])
    })

    it('should handle empty books array', () => {
      const result = calculatorService.findBooksByAuthor([], 'Author 1')
      expect(result).toEqual([])
    })

    it('should handle author with special characters', () => {
      const specialBooks: Book[] = [
        { id: 1, name: 'Book 1', author: 'J.R.R. Tolkien', units_sold: 100, price: 20 }
      ]
      const result = calculatorService.findBooksByAuthor(specialBooks, 'J.R.R. Tolkien')
      expect(result).toEqual([specialBooks[0]])
    })
  })
})