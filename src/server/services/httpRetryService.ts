import axios, { AxiosError, AxiosResponse } from 'axios'

export interface RetryConfig {
  maxRetries: number
  baseDelay: number
  maxDelay: number
  retryableStatusCodes: number[]
}

export class HttpRetryService {
  private config: RetryConfig

  constructor(config: Partial<RetryConfig> = {}) {
    this.config = {
      maxRetries: 3,
      baseDelay: 1000, // 1 second
      maxDelay: 30000, // 30 seconds
      retryableStatusCodes: [429, 500, 502, 503, 504],
      ...config
    }
  }

  private calculateDelay(attempt: number): number {
    const exponentialDelay = this.config.baseDelay * Math.pow(2, attempt - 1)
    const jitter = Math.random() * 0.1 * exponentialDelay // Add 10% jitter
    return Math.min(exponentialDelay + jitter, this.config.maxDelay)
  }

  private isRetryableError(error: AxiosError): boolean {
    if (!error.response) {
      // Network errors, timeouts, etc.
      return true
    }

    return this.config.retryableStatusCodes.includes(error.response.status)
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  async get<T>(url: string): Promise<T> {
    let lastError: AxiosError | Error

    for (let attempt = 1; attempt <= this.config.maxRetries + 1; attempt++) {
      try {
        const response: AxiosResponse<T> = await axios.get(url, {
          timeout: 10000, // 10 seconds timeout
        })
        return response.data
      } catch (error) {
        lastError = error as AxiosError

        if (attempt === this.config.maxRetries + 1) {
          // Last attempt, don't retry
          break
        }

        if (axios.isAxiosError(error)) {
          if (!this.isRetryableError(error)) {
            // Non-retryable error, throw immediately
            throw this.createHttpError(error)
          }

          const delay = this.calculateDelay(attempt)
          console.warn(
            `HTTP request failed (attempt ${attempt}/${this.config.maxRetries + 1}): ${error.message}. Retrying in ${delay}ms...`
          )
          await this.sleep(delay)
        } else {
          // Non-HTTP error, throw immediately
          throw error
        }
      }
    }

    // All retries exhausted
    throw this.createHttpError(lastError as AxiosError)
  }

  private createHttpError(error: AxiosError): Error {
    if (!error.response) {
      return new Error(`Network error: ${error.message}`)
    }

    const status = error.response.status
    const statusText = error.response.statusText

    switch (status) {
      case 404:
        return new Error(`Resource not found (404): ${error.config?.url}`)
      case 429:
        return new Error(`Too many requests (429). Please try again later.`)
      case 500:
        return new Error(`Internal server error (500). The external service is experiencing issues.`)
      case 502:
        return new Error(`Bad gateway (502). The external service is temporarily unavailable.`)
      case 503:
        return new Error(`Service unavailable (503). The external service is temporarily down.`)
      case 504:
        return new Error(`Gateway timeout (504). The external service took too long to respond.`)
      default:
        return new Error(`HTTP error ${status}: ${statusText}`)
    }
  }
}