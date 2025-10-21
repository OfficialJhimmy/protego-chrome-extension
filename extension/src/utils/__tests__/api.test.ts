import {
    savePageVisit,
    getVisitHistory,
    getLatestVisit,
    checkApiHealth,
    ApiError,
    TimeoutError,
  } from '../api';
  import { PageMetrics } from '../../types';
  
  // Mock fetch globally
  global.fetch = jest.fn();
  
  describe('API Utils', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      jest.useFakeTimers();
    });
  
    afterEach(() => {
      jest.runOnlyPendingTimers();
      jest.useRealTimers();
    });
  
    describe('savePageVisit', () => {
      const mockMetrics: PageMetrics = {
        url: 'https://example.com',
        link_count: 10,
        word_count: 500,
        image_count: 5,
        datetime_visited: '2024-01-01T00:00:00Z',
      };
  
      const mockResponse = {
        id: '123',
        ...mockMetrics,
        created_at: '2024-01-01T00:00:00Z',
      };
  
      it('should successfully save page visit', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        });
  
        const result = await savePageVisit(mockMetrics);
  
        expect(result.success).toBe(true);
        expect(result.data).toEqual(mockResponse);
        expect(global.fetch).toHaveBeenCalledWith(
          'http://localhost:8000/api/visits',
          expect.objectContaining({
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(mockMetrics),
          })
        );
      });
  
      it('should handle validation error for missing URL', async () => {
        const invalidMetrics = { ...mockMetrics, url: '' };
  
        const result = await savePageVisit(invalidMetrics);
  
        expect(result.success).toBe(false);
        expect(result.error).toContain('URL is required');
        expect(global.fetch).not.toHaveBeenCalled();
      });
  
      it('should handle validation error for negative counts', async () => {
        const invalidMetrics = { ...mockMetrics, link_count: -1 };
  
        const result = await savePageVisit(invalidMetrics);
  
        expect(result.success).toBe(false);
        expect(result.error).toContain('Counts cannot be negative');
        expect(global.fetch).not.toHaveBeenCalled();
      });
  
      it('should handle API error response', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: false,
          status: 400,
          statusText: 'Bad Request',
          json: async () => ({ detail: 'Invalid data' }),
        });
  
        const result = await savePageVisit(mockMetrics);
  
        expect(result.success).toBe(false);
        expect(result.error).toContain('Invalid data');
      });
  
      it('should handle network error', async () => {
        (global.fetch as jest.Mock).mockRejectedValueOnce(
          new TypeError('Failed to fetch')
        );
  
        const result = await savePageVisit(mockMetrics);
  
        expect(result.success).toBe(false);
        expect(result.error).toContain('Network error');
      });
  
      it('should retry on server error', async () => {
        (global.fetch as jest.Mock)
          .mockRejectedValueOnce(new Error('Server error'))
          .mockResolvedValueOnce({
            ok: true,
            json: async () => mockResponse,
          });
  
        const promise = savePageVisit(mockMetrics);
  
        // Fast-forward time for retry delay
        await jest.advanceTimersByTimeAsync(1000);
  
        const result = await promise;
  
        expect(result.success).toBe(true);
        expect(global.fetch).toHaveBeenCalledTimes(2);
      });
  
      it('should handle timeout error', async () => {
        (global.fetch as jest.Mock).mockImplementationOnce(() =>
          new Promise((_, reject) => {
            setTimeout(() => reject(new Error('AbortError')), 11000);
          })
        );
  
        const promise = savePageVisit(mockMetrics);
  
        // Fast-forward past timeout
        await jest.advanceTimersByTimeAsync(15000);
  
        const result = await promise;
  
        expect(result.success).toBe(false);
        expect(result.error).toContain('timed out');
      });
    });
  
    describe('getVisitHistory', () => {
      const mockUrl = 'https://example.com';
      const mockHistory = {
        visits: [
          {
            id: '1',
            url: mockUrl,
            datetime_visited: '2024-01-01T00:00:00Z',
            link_count: 10,
            word_count: 500,
            image_count: 5,
            created_at: '2024-01-01T00:00:00Z',
          },
        ],
        total: 1,
      };
  
      it('should successfully fetch visit history', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => mockHistory,
        });
  
        const result = await getVisitHistory(mockUrl);
  
        expect(result.success).toBe(true);
        expect(result.data).toEqual(mockHistory);
      });
  
      it('should handle validation error for empty URL', async () => {
        const result = await getVisitHistory('');
  
        expect(result.success).toBe(false);
        expect(result.error).toContain('URL is required');
        expect(global.fetch).not.toHaveBeenCalled();
      });
  
      it('should handle validation error for invalid limit', async () => {
        const result = await getVisitHistory(mockUrl, 0);
  
        expect(result.success).toBe(false);
        expect(result.error).toContain('Limit must be between');
        expect(global.fetch).not.toHaveBeenCalled();
      });
  
      it('should encode URL properly', async () => {
        const urlWithSpecialChars = 'https://example.com/path?query=test&param=value';
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => mockHistory,
        });
  
        await getVisitHistory(urlWithSpecialChars);
  
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining(encodeURIComponent(urlWithSpecialChars)),
          expect.any(Object)
        );
      });
  
      it('should handle API error', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
          json: async () => ({ detail: 'Database error' }),
        });
  
        const result = await getVisitHistory(mockUrl);
  
        expect(result.success).toBe(false);
        expect(result.error).toContain('Database error');
      });
    });
  
    describe('getLatestVisit', () => {
      const mockUrl = 'https://example.com';
      const mockVisit = {
        id: '1',
        url: mockUrl,
        datetime_visited: '2024-01-01T00:00:00Z',
        link_count: 10,
        word_count: 500,
        image_count: 5,
        created_at: '2024-01-01T00:00:00Z',
      };
  
      it('should successfully fetch latest visit', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => mockVisit,
        });
  
        const result = await getLatestVisit(mockUrl);
  
        expect(result.success).toBe(true);
        expect(result.data).toEqual(mockVisit);
      });
  
      it('should handle 404 gracefully', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: false,
          status: 404,
          json: async () => ({ detail: 'Not found' }),
        });
  
        const result = await getLatestVisit(mockUrl);
  
        expect(result.success).toBe(true);
        expect(result.data).toBeUndefined();
      });
  
      it('should handle validation error for empty URL', async () => {
        const result = await getLatestVisit('');
  
        expect(result.success).toBe(false);
        expect(result.error).toContain('URL is required');
        expect(global.fetch).not.toHaveBeenCalled();
      });
    });
  
    describe('checkApiHealth', () => {
      it('should return true when API is healthy', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
        });
  
        const result = await checkApiHealth();
  
        expect(result).toBe(true);
        expect(global.fetch).toHaveBeenCalledWith(
          'http://localhost:8000/health',
          expect.any(Object)
        );
      });
  
      it('should return false when API is unhealthy', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: false,
        });
  
        const result = await checkApiHealth();
  
        expect(result).toBe(false);
      });
  
      it('should return false on network error', async () => {
        (global.fetch as jest.Mock).mockRejectedValueOnce(
          new TypeError('Failed to fetch')
        );
  
        const result = await checkApiHealth();
  
        expect(result).toBe(false);
      });
  
      it('should timeout after 5 seconds', async () => {
        (global.fetch as jest.Mock).mockImplementationOnce(() =>
          new Promise((resolve) => setTimeout(resolve, 10000))
        );
  
        const promise = checkApiHealth();
  
        await jest.advanceTimersByTimeAsync(6000);
  
        const result = await promise;
  
        expect(result).toBe(false);
      });
    });
  });