import { Book } from '../../models/book'
import { BooksProvider } from '../../providers/books.ts'

const booksProvider = (): BooksProvider => {

  const getBooks = (): Book[] => {
    return [
      { id: 1, name: 'Node.js Design Patterns', author: 'Mario Casciaro', unitsSold: 5000, price: 40 },
      { id: 2, name: 'Clean Code', author: 'Robert C. Martin', unitsSold: 15000, price: 50 },
      { id: 3, name: 'The Pragmatic Programmer', author: 'Andrew Hunt', unitsSold: 13000, price: 45 },
    ]
  }

  return {
    getBooks,
  }
}

export default booksProvider
