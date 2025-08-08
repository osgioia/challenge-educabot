import { Book } from '../models/book.ts'
import { MetricsResponse, MetricsGenerator, MetricsCalculator } from '../types/metrics.ts'
import { BookCalculatorService } from './bookCalculatorService.ts'

export class MetricsService implements MetricsGenerator {
  private calculator: MetricsCalculator

  constructor(calculator: MetricsCalculator = new BookCalculatorService()) {
    this.calculator = calculator
  }

  generateMetrics(books: Book[], author?: string): MetricsResponse {
    const meanUnitsSold = this.calculator.calculateMeanUnitsSold(books)
    const cheapestBook = this.calculator.findCheapestBook(books)
    const booksWrittenByAuthor = author ? this.calculator.findBooksByAuthor(books, author) : []

    return {
      mean_units_sold: meanUnitsSold,
      cheapest_book: cheapestBook,
      books_written_by_author: booksWrittenByAuthor,
    }
  }
}