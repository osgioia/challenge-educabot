import { Request, Response } from 'express'
import { BooksProvider } from '../providers/books.ts'
import { Book } from '../models/book.ts'

interface GetMetricsQuery {
  author?: string
}

const metricsHandler = (metricsProvider: BooksProvider) => {

  const get = async (req: Request<{}, {}, {}, GetMetricsQuery>, res: Response<any>) => {

    const { author } = req.query
    const books = metricsProvider.getBooks()

    const meanUnitsSold = getMeanUnitsSold(books)
    const cheapestBook = getCheapestBook(books)
    const booksWrittenByAuthor = author ? getBooksWrittenByAuthor(books, author) : []

    res.status(200).json({
      mean_units_sold: meanUnitsSold,
      cheapest_book: cheapestBook,
      books_written_by_author: booksWrittenByAuthor,
    })
  }

  return {
    get,
  }
}

const getMeanUnitsSold: any = (books: Book[]) => {
  if (books.length === 0) return 0
  const totalUnitsSold = books.reduce((sum, book) => sum + book.unitsSold, 0)
  return totalUnitsSold / books.length
}

const getCheapestBook: any = (books: Book[]) => {
  if (books.length === 0) return null
  return books.reduce((cheapest, book) => {
    return book.price < cheapest.price ? book : cheapest
  }, books[0])
}

const getBooksWrittenByAuthor: any = (books: Book[], author: string) => {
  return books.filter(book => book.author.toLowerCase() === author.toLowerCase())
}

export default metricsHandler
