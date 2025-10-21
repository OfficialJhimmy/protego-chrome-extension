/**
 * Custom error classes for better error handling
 */

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public endpoint?: string
  ) {
    super(message);
    this.name = "ApiError";
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

export class NetworkError extends Error {
  constructor(message: string, public originalError?: Error) {
    super(message);
    this.name = "NetworkError";
    Object.setPrototypeOf(this, NetworkError.prototype);
  }
}

export class ChromeExtensionError extends Error {
  constructor(message: string, public context?: string) {
    super(message);
    this.name = "ChromeExtensionError";
    Object.setPrototypeOf(this, ChromeExtensionError.prototype);
  }
}

/**
 * Error handler utility class
 */
export class ErrorHandler {
  /**
   * Handle API errors with detailed logging
   */
  static handleApiError(error: unknown, context: string): string {
    console.error(`[${context}] API Error:`, error);

    if (error instanceof ApiError) {
      return `API Error (${error.statusCode}): ${error.message}`;
    }

    if (error instanceof NetworkError) {
      return "Network error. Please check your internet connection and ensure the backend is running.";
    }

    if (error instanceof Error) {
      return error.message;
    }

    return "An unexpected error occurred. Please try again.";
  }

  /**
   * Handle Chrome extension errors
   */
  static handleChromeError(context: string): ChromeExtensionError | null {
    if (chrome.runtime.lastError) {
      const error = new ChromeExtensionError(
        chrome.runtime.lastError.message || "Chrome extension error",
        context
      );
      console.error(`[${context}] Chrome Error:`, error);
      return error;
    }
    return null;
  }

  /**
   * Safe async wrapper with error handling
   */
  static async withErrorHandling<T>(
    fn: () => Promise<T>,
    context: string,
    fallbackValue?: T
  ): Promise<{ data?: T; error?: string }> {
    try {
      const data = await fn();
      return { data };
    } catch (error) {
      const errorMessage = this.handleApiError(error, context);
      return {
        data: fallbackValue,
        error: errorMessage,
      };
    }
  }

  /**
   * Validate required fields
   */
  static validateRequired<T extends Record<string, any>>(
    obj: T,
    requiredFields: (keyof T)[]
  ): { valid: boolean; missing: string[] } {
    const missing = requiredFields.filter((field) => !obj[field]);
    return {
      valid: missing.length === 0,
      missing: missing.map(String),
    };
  }
}

/**
 * Retry logic for failed operations
 */
export class RetryHandler {
  static async retry<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    delayMs: number = 1000
  ): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.warn(`Attempt ${attempt} failed:`, lastError.message);

        if (attempt < maxRetries) {
          await new Promise((resolve) =>
            setTimeout(resolve, delayMs * attempt)
          );
        }
      }
    }

    throw lastError || new Error("All retry attempts failed");
  }
}
