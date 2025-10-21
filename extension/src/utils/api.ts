/**
 * API utility functions for communicating with FastAPI backend
 */

import {
  PageMetrics,
  PageVisitResponse,
  PageVisitListResponse,
  ApiResponse,
} from "../types";

// Backend API base URL
const API_BASE_URL = "http://localhost:8000";

// Configuration
const CONFIG = {
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000,
  REQUEST_TIMEOUT: 10000,
};

/**
 * Custom API Error class
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public details?: any
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Network Error class
 */
export class NetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NetworkError";
  }
}

/**
 * Timeout Error class
 */
export class TimeoutError extends Error {
  constructor(message: string = "Request timeout") {
    super(message);
    this.name = "TimeoutError";
  }
}

/**
 * Sleep utility for retry delays
 */
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Fetch with timeout
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeout = CONFIG.REQUEST_TIMEOUT
): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    if (error instanceof Error && error.name === "AbortError") {
      throw new TimeoutError("Request timed out");
    }
    throw error;
  }
}

/**
 * Retry wrapper for API calls
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  retries = CONFIG.MAX_RETRIES
): Promise<T> {
  let lastError: Error;

  for (let i = 0; i <= retries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      // Don't retry on client errors (4xx)
      if (error instanceof ApiError && error.statusCode && error.statusCode < 500) {
        throw error;
      }

      // Don't retry if no more attempts left
      if (i === retries) {
        break;
      }

      // Wait before retrying with exponential backoff
      const delay = CONFIG.RETRY_DELAY * Math.pow(2, i);
      console.warn(`Retry attempt ${i + 1}/${retries} after ${delay}ms`);
      await sleep(delay);
    }
  }

  throw lastError!;
}

/**
 * Parse error response
 */
async function parseErrorResponse(response: Response): Promise<string> {
  try {
    const data = await response.json();
    return data.detail || data.message || response.statusText;
  } catch {
    return response.statusText || "Unknown error";
  }
}

/**
 * Save page visit metrics to the backend
 */
export async function savePageVisit(
  metrics: PageMetrics
): Promise<ApiResponse<PageVisitResponse>> {
  try {
    // Validate input
    if (!metrics.url) {
      throw new ApiError("URL is required");
    }

    if (metrics.link_count < 0 || metrics.word_count < 0 || metrics.image_count < 0) {
      throw new ApiError("Counts cannot be negative");
    }

    const result = await withRetry(async () => {
      const response = await fetchWithTimeout(`${API_BASE_URL}/api/visits`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(metrics),
      });

      if (!response.ok) {
        const errorMessage = await parseErrorResponse(response);
        throw new ApiError(
          `Failed to save page visit: ${errorMessage}`,
          response.status
        );
      }

      return await response.json();
    });

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error("Error saving page visit:", error);

    let errorMessage = "Failed to save page visit";
    if (error instanceof TimeoutError) {
      errorMessage = "Request timed out. Please check your connection.";
    } else if (error instanceof ApiError) {
      errorMessage = error.message;
    } else if (error instanceof TypeError) {
      errorMessage = "Network error. Please ensure the backend is running.";
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Get visit history for a specific URL
 */
export async function getVisitHistory(
  url: string,
  limit = 50
): Promise<ApiResponse<PageVisitListResponse>> {
  try {
    // Validate input
    if (!url) {
      throw new ApiError("URL is required");
    }

    if (limit < 1 || limit > 1000) {
      throw new ApiError("Limit must be between 1 and 1000");
    }

    const result = await withRetry(async () => {
      const encodedUrl = encodeURIComponent(url);
      const response = await fetchWithTimeout(
        `${API_BASE_URL}/api/visits/url/${encodedUrl}?limit=${limit}`
      );

      if (!response.ok) {
        const errorMessage = await parseErrorResponse(response);
        throw new ApiError(
          `Failed to fetch visit history: ${errorMessage}`,
          response.status
        );
      }

      return await response.json();
    });

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error("Error fetching visit history:", error);

    let errorMessage = "Failed to fetch visit history";
    if (error instanceof TimeoutError) {
      errorMessage = "Request timed out. Please check your connection.";
    } else if (error instanceof ApiError) {
      errorMessage = error.message;
    } else if (error instanceof TypeError) {
      errorMessage = "Network error. Please ensure the backend is running.";
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Get the most recent visit for a specific URL
 */
export async function getLatestVisit(
  url: string
): Promise<ApiResponse<PageVisitResponse>> {
  try {
    // Validate input
    if (!url) {
      throw new ApiError("URL is required");
    }

    const result = await withRetry(async () => {
      const encodedUrl = encodeURIComponent(url);
      const response = await fetchWithTimeout(
        `${API_BASE_URL}/api/visits/url/${encodedUrl}/latest`
      );

      if (response.status === 404) {
        return undefined;
      }

      if (!response.ok) {
        const errorMessage = await parseErrorResponse(response);
        throw new ApiError(
          `Failed to fetch latest visit: ${errorMessage}`,
          response.status
        );
      }

      return await response.json();
    });

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error("Error fetching latest visit:", error);

    let errorMessage = "Failed to fetch latest visit";
    if (error instanceof TimeoutError) {
      errorMessage = "Request timed out. Please check your connection.";
    } else if (error instanceof ApiError) {
      errorMessage = error.message;
    } else if (error instanceof TypeError) {
      errorMessage = "Network error. Please ensure the backend is running.";
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Check API health
 */
export async function checkApiHealth(): Promise<boolean> {
  try {
    const response = await fetchWithTimeout(`${API_BASE_URL}/health`, {}, 5000);
    return response.ok;
  } catch (error) {
    console.error("API health check failed:", error);
    return false;
  }
}