import { Book } from '../server/models/book.ts'
import { config } from '../server/config/environment.ts'
import { HttpRetryService } from '../server/services/httpRetryService.ts'

export type BooksProvider = {
  getBooks: () => Promise<Book[]>
}

const httpBooksProvider = (httpService?: HttpRetryService): BooksProvider => {
  const httpRetryService = httpService || new HttpRetryService({
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 30000,
    retryableStatusCodes: [429, 500, 502, 503, 504]
  })

  const getBooks = async (): Promise<Book[]> => {
    try {
      const books = await httpRetryService.get<Book[]>(config.apiUrl)
      return books
    } catch (error) {
      console.error('Error fetching books from API:', error)
      
      // Re-throw with more context
      if (error instanceof Error) {
        throw new Error(`Failed to fetch books: ${error.message}`)
      }
      
      throw new Error('Failed to fetch books from external service')
    }
  }

  return {
    getBooks,
  }
}

export default httpBooksProvider