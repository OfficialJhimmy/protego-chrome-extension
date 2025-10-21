import {
  ApiError,
  NetworkError,
  ChromeExtensionError,
  ErrorHandler,
  RetryHandler,
} from "../errorHandler";

// --- Global Chrome Mock (to avoid undefined chrome.runtime) ---
beforeAll(() => {
  (globalThis as any).chrome = {
    runtime: {
      lastError: undefined,
    },
  };
});

describe("ErrorHandler", () => {
  describe("Custom Error Classes", () => {
    it("should create ApiError correctly", () => {
      const error = new ApiError("Test error", 404, "/api/test");

      expect(error).toBeInstanceOf(ApiError);
      expect(error.message).toBe("Test error");
      expect(error.statusCode).toBe(404);
      expect(error.endpoint).toBe("/api/test");
      expect(error.name).toBe("ApiError");
    });

    it("should create NetworkError correctly", () => {
      const originalError = new Error("Connection failed");
      const error = new NetworkError("Network issue", originalError);

      expect(error).toBeInstanceOf(NetworkError);
      expect(error.message).toBe("Network issue");
      expect(error.originalError).toBe(originalError);
      expect(error.name).toBe("NetworkError");
    });

    it("should create ChromeExtensionError correctly", () => {
      const error = new ChromeExtensionError("Extension error", "background");

      expect(error).toBeInstanceOf(ChromeExtensionError);
      expect(error.message).toBe("Extension error");
      expect(error.context).toBe("background");
      expect(error.name).toBe("ChromeExtensionError");
    });
  });

  describe("handleApiError", () => {
    it("should handle ApiError", () => {
      const error = new ApiError("Not found", 404, "/api/test");
      const result = ErrorHandler.handleApiError(error, "test-context");

      expect(result).toContain("API Error");
      expect(result).toContain("404");
      expect(result).toContain("Not found");
    });

    it("should handle NetworkError", () => {
      const error = new NetworkError("Connection failed");
      const result = ErrorHandler.handleApiError(error, "test-context");

      expect(result).toContain("Network error");
      expect(result).toContain("backend is running");
    });

    it("should handle generic Error", () => {
      const error = new Error("Something went wrong");
      const result = ErrorHandler.handleApiError(error, "test-context");

      expect(result).toBe("Something went wrong");
    });

    it("should handle unknown error types", () => {
      const result = ErrorHandler.handleApiError(
        "string error",
        "test-context"
      );
      expect(result).toContain("unexpected error");
    });
  });

  describe("handleChromeError", () => {
    it("should return null when no Chrome error", () => {
      chrome.runtime.lastError = undefined;
      const result = ErrorHandler.handleChromeError("test-context");

      expect(result).toBeNull();
    });

    it("should return ChromeExtensionError when Chrome error exists", () => {
      chrome.runtime.lastError = { message: "Chrome error occurred" };
      const result = ErrorHandler.handleChromeError("test-context");

      expect(result).toBeInstanceOf(ChromeExtensionError);
      expect(result?.message).toBe("Chrome error occurred");
      expect(result?.context).toBe("test-context");

      chrome.runtime.lastError = undefined;
    });
  });

  describe("withErrorHandling", () => {
    it("should return data on success", async () => {
      const mockFn = jest.fn().mockResolvedValue("success data");
      const result = await ErrorHandler.withErrorHandling(
        mockFn,
        "test-context"
      );

      expect(result.data).toBe("success data");
      expect(result.error).toBeUndefined();
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it("should return error on failure", async () => {
      const mockFn = jest.fn().mockRejectedValue(new Error("Test error"));
      const result = await ErrorHandler.withErrorHandling(
        mockFn,
        "test-context"
      );

      expect(result.data).toBeUndefined();
      expect(result.error).toBe("Test error");
    });

    it("should return fallback value on error", async () => {
      const mockFn = jest.fn().mockRejectedValue(new Error("Test error"));
      const fallback = { default: "value" };
      const result = await ErrorHandler.withErrorHandling(
        mockFn,
        "test-context",
        fallback
      );

      expect(result.data).toBe(fallback);
      expect(result.error).toBe("Test error");
    });
  });

  describe("validateRequired", () => {
    it("should validate all required fields present", () => {
      const obj = { name: "test", age: 25, email: "test@example.com" };
      const result = ErrorHandler.validateRequired(obj, [
        "name",
        "age",
        "email",
      ]);

      expect(result.valid).toBe(true);
      expect(result.missing).toEqual([]);
    });

    it("should identify missing fields", () => {
      const obj = { name: "test", age: 25, email: "test@example.com" };
      const result = ErrorHandler.validateRequired(obj, [
        "name",
        "age",
        "email",
      ]);

      expect(result.valid).toBe(false);
      expect(result.missing).toEqual(["email"]);
    });

    it("should identify multiple missing fields", () => {
      const obj = { name: "test", age: 25, email: "", phone: "" };
      const result = ErrorHandler.validateRequired(obj, [
        "name",
        "age",
        "email",
        "phone",
      ]);

      expect(result.valid).toBe(false);
      expect(result.missing).toEqual(["age", "email", "phone"]);
    });

    it("should handle empty required fields array", () => {
      const obj = { name: "test" };
      const result = ErrorHandler.validateRequired(obj, []);

      expect(result.valid).toBe(true);
      expect(result.missing).toEqual([]);
    });
  });

  describe("RetryHandler", () => {
    it("should succeed on first attempt", async () => {
      const mockFn = jest.fn().mockResolvedValue("success");
      const result = await RetryHandler.retry(mockFn, 3, 100);

      expect(result).toBe("success");
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it("should retry on failure and eventually succeed", async () => {
      const mockFn = jest
        .fn()
        .mockRejectedValueOnce(new Error("Fail 1"))
        .mockRejectedValueOnce(new Error("Fail 2"))
        .mockResolvedValueOnce("success");

      const result = await RetryHandler.retry(mockFn, 3, 100);

      expect(result).toBe("success");
      expect(mockFn).toHaveBeenCalledTimes(3);
    });

    it("should throw error after max retries", async () => {
      const mockFn = jest.fn().mockRejectedValue(new Error("Always fails"));

      await expect(RetryHandler.retry(mockFn, 3, 100)).rejects.toThrow(
        "Always fails"
      );
      expect(mockFn).toHaveBeenCalledTimes(3);
    });

    it("should apply exponential backoff delays", async () => {
      jest.useFakeTimers();
      const mockFn = jest
        .fn()
        .mockRejectedValueOnce(new Error("Fail 1"))
        .mockRejectedValueOnce(new Error("Fail 2"))
        .mockResolvedValueOnce("success");

      const retryPromise = RetryHandler.retry(mockFn, 3, 1000);

      // First attempt
      expect(mockFn).toHaveBeenCalledTimes(1);

      // Advance to simulate backoff timing
      await jest.advanceTimersByTimeAsync(1000);
      expect(mockFn).toHaveBeenCalledTimes(2);

      await jest.advanceTimersByTimeAsync(2000);
      expect(mockFn).toHaveBeenCalledTimes(3);

      const result = await retryPromise;
      expect(result).toBe("success");

      jest.useRealTimers();
    });
  });
});
