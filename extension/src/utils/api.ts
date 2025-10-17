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

/**
 * Save page visit metrics to the backend
 */
export async function savePageVisit(
  metrics: PageMetrics
): Promise<ApiResponse<PageVisitResponse>> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/visits`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(metrics),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error("Error saving page visit:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
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
    // URL encode the URL parameter
    const encodedUrl = encodeURIComponent(url);
    const response = await fetch(
      `${API_BASE_URL}/api/visits/url/${encodedUrl}?limit=${limit}`
    );

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error("Error fetching visit history:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
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
    const encodedUrl = encodeURIComponent(url);
    const response = await fetch(
      `${API_BASE_URL}/api/visits/url/${encodedUrl}/latest`
    );

    if (!response.ok) {
      if (response.status === 404) {
        return {
          success: true,
          data: undefined,
        };
      }
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error("Error fetching latest visit:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Check API health
 */
export async function checkApiHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    return response.ok;
  } catch (error) {
    console.error("API health check failed:", error);
    return false;
  }
}
