/**
 * TypeScript type definitions for the Chrome Extension
 */

/**
 * Page metrics extracted from the DOM
 */
export interface PageMetrics {
  url: string;
  link_count: number;
  word_count: number;
  image_count: number;
  datetime_visited?: string;
}

/**
 * Message types for communication between content script and background
 */
export enum MessageType {
  SAVE_PAGE_METRICS = "SAVE_PAGE_METRICS",
  GET_PAGE_HISTORY = "GET_PAGE_HISTORY",
  GET_CURRENT_METRICS = "GET_CURRENT_METRICS",
}

/**
 * Message structure for chrome.runtime.sendMessage
 */
export interface ChromeMessage {
  type: MessageType;
  data?: any;
}

/**
 * Response from backend API for page visit
 */
export interface PageVisitResponse {
  id: string;
  url: string;
  datetime_visited: string;
  link_count: number;
  word_count: number;
  image_count: number;
  created_at: string;
}

/**
 * Response from backend API for list of visits
 */
export interface PageVisitListResponse {
  visits: PageVisitResponse[];
  total: number;
}

/**
 * API response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
