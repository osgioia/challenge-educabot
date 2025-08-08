import { Router, Request, Response } from 'express'
import { BooksProvider } from '../../providers/books.ts'
import { MetricsService } from '../services/metricsService.ts'
import { MetricsResponse } from '../types/metrics.ts'

interface GetMetricsQuery {
  author?: string
}

export const createMetricsRouter = (booksProvider: BooksProvider): Router => {
  const router = Router()
  const metricsService = new MetricsService()

  router.get('/', async (req: Request<{}, MetricsResponse, {}, GetMetricsQuery>, res: Response<MetricsResponse>) => {
    try {
      const { author } = req.query
      const books = await booksProvider.getBooks()
      
      const metrics = metricsService.generateMetrics(books, author)
      
      res.status(200).json(metrics)
    } catch (error) {
      console.error('Error in metrics route:', error)
      
      // Determine appropriate HTTP status based on error message
      let statusCode = 500
      let errorMessage = 'Internal server error'

      if (error instanceof Error) {
        if (error.message.includes('Resource not found (404)')) {
          statusCode = 404
          errorMessage = 'Books data not found'
        } else if (error.message.includes('Too many requests (429)')) {
          statusCode = 429
          errorMessage = 'Rate limit exceeded. Please try again later.'
        } else if (error.message.includes('Service unavailable (503)')) {
          statusCode = 503
          errorMessage = 'Books service temporarily unavailable'
        } else if (error.message.includes('Gateway timeout (504)')) {
          statusCode = 504
          errorMessage = 'Books service timeout'
        } else if (error.message.includes('Bad gateway (502)')) {
          statusCode = 502
          errorMessage = 'Books service temporarily unavailable'
        }
      }

      res.status(statusCode).json({
        error: errorMessage,
        mean_units_sold: 0,
        cheapest_book: null,
        books_written_by_author: [],
      } as MetricsResponse & { error: string })
    }
  })

  return router
}