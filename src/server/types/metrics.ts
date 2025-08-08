import { Book } from '../models/book.ts'

export interface MetricsResponse {
  mean_units_sold: number
  cheapest_book: Book | null
  books_written_by_author: Book[]
}

export interface MetricsCalculator {
  calculateMeanUnitsSold(books: Book[]): number
  findCheapestBook(books: Book[]): Book | null
  findBooksByAuthor(books: Book[], author: string): Book[]
}

export interface MetricsGenerator {
  generateMetrics(books: Book[], author?: string): MetricsResponse
}