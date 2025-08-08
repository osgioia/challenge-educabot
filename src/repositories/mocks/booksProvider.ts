import { Book } from '../../server/models/book'
import { BooksProvider } from '../../providers/books.ts'

const booksProvider = (): BooksProvider => {

  const getBooks = async (): Promise<Book[]> => {
    return [
      { id: 1, name: 'Node.js Design Patterns', author: 'Mario Casciaro', units_sold: 5000, price: 40 },
      { id: 2, name: 'Clean Code', author: 'Robert C. Martin', units_sold: 15000, price: 50 },
      { id: 3, name: 'The Pragmatic Programmer', author: 'Andrew Hunt', units_sold: 13000, price: 45 },
    ]
  }

  return {
    getBooks,
  }
}

export default booksProvider
