import { Book } from '../models/book.ts'
import { MetricsCalculator } from '../types/metrics.ts'

export class BookCalculatorService implements MetricsCalculator {
  calculateMeanUnitsSold(books: Book[]): number {
    if (books.length === 0) return 0
    const totalUnitsSold = books.reduce((sum, book) => sum + book.units_sold, 0)
    return totalUnitsSold / books.length
  }

  findCheapestBook(books: Book[]): Book | null {
    if (books.length === 0) return null
    return books.reduce((cheapest, book) => {
      return book.price < cheapest.price ? book : cheapest
    }, books[0])
  }

  findBooksByAuthor(books: Book[], author: string): Book[] {
    return books.filter(book => 
      book.author.toLowerCase() === author.toLowerCase()
    )
  }
}