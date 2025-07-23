import express from 'express'
import cors from 'cors'
import BooksProvider from './repositories/mocks/booksProvider.ts'
import MetricsHandler from './handlers/metrics.ts'

const app = express()
const PORT = process.env.PORT || 3000

app.use(express.json())
app.use(cors())

const booksProvider = BooksProvider()
const metricsHandler = MetricsHandler(booksProvider)
app.get('/', metricsHandler.get)

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

export { app }
