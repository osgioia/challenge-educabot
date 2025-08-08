import express from 'express'
import cors from 'cors'
import { BooksProvider } from '../../providers/books.ts'
import { createMetricsRouter } from '../routes/metricsRoutes.ts'

export const createServer = (booksProvider: BooksProvider): express.Application => {
  const app = express()

  // Middleware
  app.use(express.json())
  app.use(cors())

  // Routes
  app.use('/metrics', createMetricsRouter(booksProvider))
  
  // Health check
  app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() })
  })

  return app
}