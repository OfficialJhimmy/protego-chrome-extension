/**
 * Background Service Worker - Handles communication with backend API
 */

import { MessageType, ChromeMessage, PageMetrics } from '../types';
import { savePageVisit, getVisitHistory, getLatestVisit, checkApiHealth } from '../utils/api';

// Handle extension icon click - open side panel
chrome.action.onClicked.addListener((tab) => {
    chrome.sidePanel.open({ windowId: tab.windowId });
  });
  
  // Alternative: Set side panel to open automatically
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });

console.log('Chrome History Sidepanel - Background Service Worker Started');

/**
 * Handle messages from content scripts and side panel
 */
chrome.runtime.onMessage.addListener((message: ChromeMessage, sender, sendResponse) => {
  console.log('📨 Received message:', message.type);

  switch (message.type) {
    case MessageType.SAVE_PAGE_METRICS:
      handleSavePageMetrics(message.data, sendResponse);
      return true; // Keep channel open for async response

    case MessageType.GET_PAGE_HISTORY:
      handleGetPageHistory(message.data.url, sendResponse);
      return true;

    default:
      sendResponse({ success: false, error: 'Unknown message type' });
      return false;
  }
});

/**
 * Save page metrics to backend
 */
async function handleSavePageMetrics(metrics: PageMetrics, sendResponse: Function): Promise<void> {
  try {
    console.log('💾 Saving page metrics:', metrics);
    
    // Check if API is available
    const isHealthy = await checkApiHealth();
    if (!isHealthy) {
      console.warn('⚠️ Backend API is not available');
      sendResponse({ 
        success: false, 
        error: 'Backend API is not available. Make sure Docker containers are running.' 
      });
      return;
    }

    // Save to backend
    const result = await savePageVisit(metrics);
    
    if (result.success) {
      console.log('Metrics saved successfully:', result.data);
      sendResponse({ success: true, data: result.data });
    } else {
      console.error('Failed to save metrics:', result.error);
      sendResponse({ success: false, error: result.error });
    }
  } catch (error) {
    console.error('Error in handleSavePageMetrics:', error);
    sendResponse({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}

/**
 * Get page visit history from backend
 */
async function handleGetPageHistory(url: string, sendResponse: Function): Promise<void> {
  try {
    console.log('Getting page history for:', url);
    
    const result = await getVisitHistory(url);
    
    if (result.success) {
      console.log('Retrieved history:', result.data);
      sendResponse({ success: true, data: result.data });
    } else {
      console.error('Failed to get history:', result.error);
      sendResponse({ success: false, error: result.error });
    }
  } catch (error) {
    console.error('Error in handleGetPageHistory:', error);
    sendResponse({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}

/**
 * Handle extension installation
 */
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('Extension installed:', details.reason);
  
  // Check backend connectivity
  const isHealthy = await checkApiHealth();
  if (isHealthy) {
    console.log('Backend API is healthy');
  } else {
    console.warn('⚠️ Backend API is not reachable. Please start Docker containers.');
  }
});

/**
 * Handle browser startup
 */
chrome.runtime.onStartup.addListener(async () => {
  console.log('Browser started');
  
  // Check backend connectivity
  const isHealthy = await checkApiHealth();
  if (isHealthy) {
    console.log('Backend API is healthy');
  } else {
    console.warn('Backend API is not reachable. Please start Docker containers.');
  }
});