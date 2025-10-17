/**
 * Content Script - Runs on every web page
 * Extracts page metrics and sends them to the background script
 */

import { PageMetrics, MessageType, ChromeMessage } from '../types';

/**
 * Extract page metrics from the current page
 */
function extractPageMetrics(): PageMetrics {
  const url = window.location.href;
  
  // Count links (anchor tags)
  const links = document.querySelectorAll('a');
  const link_count = links.length;
  
  // Count images
  const images = document.querySelectorAll('img');
  const image_count = images.length;
  
  // Count words in visible text
  const word_count = countWords();
  
  // Get current timestamp in ISO format
  const datetime_visited = new Date().toISOString();
  
  return {
    url,
    link_count,
    word_count,
    image_count,
    datetime_visited,
  };
}

/**
 * Count words in the visible text of the page
 */
function countWords(): number {
  // Get the body text content
  const bodyText = document.body.innerText || document.body.textContent || '';
  
  // Split by whitespace and filter out empty strings
  const words = bodyText
    .trim()
    .split(/\s+/)
    .filter(word => word.length > 0);
  
  return words.length;
}

/**
 * Send metrics to background script
 */
function sendMetricsToBackground(metrics: PageMetrics): void {
  const message: ChromeMessage = {
    type: MessageType.SAVE_PAGE_METRICS,
    data: metrics,
  };
  
  chrome.runtime.sendMessage(message, (response) => {
    if (chrome.runtime.lastError) {
      console.error('Error sending metrics:', chrome.runtime.lastError);
      return;
    }
    
    if (response?.success) {
      console.log('Page metrics saved successfully');
    } else {
      console.error('Failed to save page metrics:', response?.error);
    }
  });
}

/**
 * Initialize content script
 */
function initialize(): void {
  console.log('Chrome History Sidepanel - Content Script Loaded');
  
  // Wait for page to be fully loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      extractAndSendMetrics();
    });
  } else {
    // DOM is already ready
    extractAndSendMetrics();
  }
}

/**
 * Extract metrics and send to background
 */
function extractAndSendMetrics(): void {
  // Add a small delay to ensure page is fully rendered
  setTimeout(() => {
    const metrics = extractPageMetrics();
    console.log('Extracted metrics:', metrics);
    sendMetricsToBackground(metrics);
  }, 1000); // Wait 1 second after page load
}

// Listen for messages from side panel (for real-time metrics)
chrome.runtime.onMessage.addListener((message: ChromeMessage, sender, sendResponse) => {
  if (message.type === MessageType.GET_CURRENT_METRICS) {
    const metrics = extractPageMetrics();
    sendResponse({ success: true, data: metrics });
    return true; // Keep message channel open for async response
  }
});

// Start the content script
initialize();