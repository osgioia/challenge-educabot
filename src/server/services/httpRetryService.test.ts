import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import axios, { AxiosError } from 'axios'
import { HttpRetryService } from './httpRetryService.ts'

// Mock axios
vi.mock('axios')
const mockedAxios = vi.mocked(axios)

describe('HttpRetryService', () => {
  let httpRetryService: HttpRetryService
  let consoleSpy: any

  beforeEach(() => {
    httpRetryService = new HttpRetryService({
      maxRetries: 2,
      baseDelay: 100, // Shorter delays for testing
      maxDelay: 1000,
      retryableStatusCodes: [429, 500, 502, 503, 504]
    })
    
    // Mock console.warn to avoid noise in tests
    consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    
    // Mock setTimeout to avoid actual delays in tests
    vi.spyOn(global, 'setTimeout').mockImplementation((callback: any) => {
      callback()
      return {} as any
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
    consoleSpy.mockRestore()
  })

  describe('successful requests', () => {
    it('should return data on successful request', async () => {
      const mockData = [{ id: 1, name: 'Test Book' }]
      mockedAxios.get.mockResolvedValueOnce({ data: mockData })

      const result = await httpRetryService.get('http://test.com/api')

      expect(result).toEqual(mockData)
      expect(mockedAxios.get).toHaveBeenCalledTimes(1)
      expect(mockedAxios.get).toHaveBeenCalledWith('http://test.com/api', {
        timeout: 10000
      })
    })
  })

  describe('non-retryable errors', () => {
    it('should throw immediately on 404 error', async () => {
      const error = {
        response: { status: 404, statusText: 'Not Found' },
        config: { url: 'http://test.com/api' },
        message: '404 error'
      } as AxiosError

      mockedAxios.isAxiosError.mockReturnValue(true)
      mockedAxios.get.mockRejectedValueOnce(error)

      await expect(httpRetryService.get('http://test.com/api'))
        .rejects.toThrow('Resource not found (404): http://test.com/api')

      expect(mockedAxios.get).toHaveBeenCalledTimes(1)
    })

    it('should throw immediately on 401 error', async () => {
      const error = {
        response: { status: 401, statusText: 'Unauthorized' },
        config: { url: 'http://test.com/api' },
        message: '401 error'
      } as AxiosError

      mockedAxios.isAxiosError.mockReturnValue(true)
      mockedAxios.get.mockRejectedValueOnce(error)

      await expect(httpRetryService.get('http://test.com/api'))
        .rejects.toThrow('HTTP error 401: Unauthorized')

      expect(mockedAxios.get).toHaveBeenCalledTimes(1)
    })
  })

  describe('retryable errors', () => {
    it('should retry on 429 error and eventually succeed', async () => {
      const mockData = [{ id: 1, name: 'Test Book' }]
      const error429 = {
        response: { status: 429, statusText: 'Too Many Requests' },
        config: { url: 'http://test.com/api' },
        message: '429 error'
      } as AxiosError

      mockedAxios.isAxiosError.mockReturnValue(true)
      mockedAxios.get
        .mockRejectedValueOnce(error429)
        .mockResolvedValueOnce({ data: mockData })

      const result = await httpRetryService.get('http://test.com/api')

      expect(result).toEqual(mockData)
      expect(mockedAxios.get).toHaveBeenCalledTimes(2)
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('HTTP request failed (attempt 1/3): 429 error. Retrying in')
      )
    })

    it('should retry on 500 error and eventually fail', async () => {
      const error500 = {
        response: { status: 500, statusText: 'Internal Server Error' },
        config: { url: 'http://test.com/api' },
        message: '500 error'
      } as AxiosError

      mockedAxios.isAxiosError.mockReturnValue(true)
      mockedAxios.get.mockRejectedValue(error500)

      await expect(httpRetryService.get('http://test.com/api'))
        .rejects.toThrow('Internal server error (500). The external service is experiencing issues.')

      expect(mockedAxios.get).toHaveBeenCalledTimes(3) // Initial + 2 retries
      expect(consoleSpy).toHaveBeenCalledTimes(2) // 2 retry attempts
    })

    it('should retry on 502 error', async () => {
      const error502 = {
        response: { status: 502, statusText: 'Bad Gateway' },
        config: { url: 'http://test.com/api' },
        message: '502 error'
      } as AxiosError

      mockedAxios.isAxiosError.mockReturnValue(true)
      mockedAxios.get.mockRejectedValue(error502)

      await expect(httpRetryService.get('http://test.com/api'))
        .rejects.toThrow('Bad gateway (502). The external service is temporarily unavailable.')

      expect(mockedAxios.get).toHaveBeenCalledTimes(3)
    })

    it('should retry on 503 error', async () => {
      const error503 = {
        response: { status: 503, statusText: 'Service Unavailable' },
        config: { url: 'http://test.com/api' },
        message: '503 error'
      } as AxiosError

      mockedAxios.isAxiosError.mockReturnValue(true)
      mockedAxios.get.mockRejectedValue(error503)

      await expect(httpRetryService.get('http://test.com/api'))
        .rejects.toThrow('Service unavailable (503). The external service is temporarily down.')

      expect(mockedAxios.get).toHaveBeenCalledTimes(3)
    })

    it('should retry on 504 error', async () => {
      const error504 = {
        response: { status: 504, statusText: 'Gateway Timeout' },
        config: { url: 'http://test.com/api' },
        message: '504 error'
      } as AxiosError

      mockedAxios.isAxiosError.mockReturnValue(true)
      mockedAxios.get.mockRejectedValue(error504)

      await expect(httpRetryService.get('http://test.com/api'))
        .rejects.toThrow('Gateway timeout (504). The external service took too long to respond.')

      expect(mockedAxios.get).toHaveBeenCalledTimes(3)
    })
  })

  describe('network errors', () => {
    it('should retry on network errors', async () => {
      const networkError = {
        message: 'Network Error',
        response: undefined
      } as AxiosError

      mockedAxios.isAxiosError.mockReturnValue(true)
      mockedAxios.get.mockRejectedValue(networkError)

      await expect(httpRetryService.get('http://test.com/api'))
        .rejects.toThrow('Network error: Network Error')

      expect(mockedAxios.get).toHaveBeenCalledTimes(3)
    })

    it('should not retry on non-axios errors', async () => {
      const genericError = new Error('Generic error')

      mockedAxios.isAxiosError.mockReturnValue(false)
      mockedAxios.get.mockRejectedValueOnce(genericError)

      await expect(httpRetryService.get('http://test.com/api'))
        .rejects.toThrow('Generic error')

      expect(mockedAxios.get).toHaveBeenCalledTimes(1)
    })
  })

  describe('specific error messages', () => {
    it('should provide specific error message for 429', async () => {
      const error429 = {
        response: { status: 429, statusText: 'Too Many Requests' },
        config: { url: 'http://test.com/api' },
        message: '429 error'
      } as AxiosError

      mockedAxios.isAxiosError.mockReturnValue(true)
      mockedAxios.get.mockRejectedValue(error429)

      await expect(httpRetryService.get('http://test.com/api'))
        .rejects.toThrow('Too many requests (429). Please try again later.')
    })
  })

  describe('configuration', () => {
    it('should use default configuration when none provided', () => {
      const defaultService = new HttpRetryService()
      
      // We can't directly test private properties, but we can test behavior
      expect(defaultService).toBeInstanceOf(HttpRetryService)
    })

    it('should respect custom retry configuration', async () => {
      const customService = new HttpRetryService({
        maxRetries: 1, // Only 1 retry
        baseDelay: 50,
        maxDelay: 500,
        retryableStatusCodes: [500]
      })

      const error500 = {
        response: { status: 500, statusText: 'Internal Server Error' },
        config: { url: 'http://test.com/api' },
        message: '500 error'
      } as AxiosError

      mockedAxios.isAxiosError.mockReturnValue(true)
      mockedAxios.get.mockRejectedValue(error500)

      await expect(customService.get('http://test.com/api'))
        .rejects.toThrow('Internal server error (500). The external service is experiencing issues.')

      expect(mockedAxios.get).toHaveBeenCalledTimes(2) // Initial + 1 retry
    })
  })
})