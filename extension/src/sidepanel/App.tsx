import React, { useState, useEffect } from 'react';
import { Globe, RefreshCw } from 'lucide-react';
import { MetricsCard } from './components/MetricsCard';
import { HistoryCard } from './components/HistoryCard';
import { LoadingState } from './components/LoadingState';
import { ErrorState } from './components/ErrorState';
import { MessageType, ChromeMessage, PageVisitListResponse } from '../types';
import './styles/App.css';

interface PageData {
  url: string;
  linkCount: number;
  wordCount: number;
  imageCount: number;
  history: PageVisitListResponse | null;
}

export const App: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pageData, setPageData] = useState<PageData | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadPageData = async () => {
    try {
      setError(null);

      // Get current active tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab || !tab.url) {
        throw new Error('No active tab found');
      }

      const currentUrl = tab.url;

      // Get current page metrics from content script
      const metricsMessage: ChromeMessage = {
        type: MessageType.GET_CURRENT_METRICS,
      };

      chrome.tabs.sendMessage(tab.id!, metricsMessage, async (metricsResponse) => {
        if (chrome.runtime.lastError) {
          console.warn('Could not get current metrics:', chrome.runtime.lastError);
          // Fall back to getting data from history
          await loadHistoryOnly(currentUrl);
          return;
        }

        if (metricsResponse?.success && metricsResponse.data) {
          const metrics = metricsResponse.data;

          // Get visit history from background script
          const historyMessage: ChromeMessage = {
            type: MessageType.GET_PAGE_HISTORY,
            data: { url: currentUrl },
          };

          chrome.runtime.sendMessage(historyMessage, (historyResponse) => {
            if (chrome.runtime.lastError) {
              console.error('Error getting history:', chrome.runtime.lastError);
              setError('Failed to load visit history. Make sure the backend is running.');
              setLoading(false);
              return;
            }

            setPageData({
              url: currentUrl,
              linkCount: metrics.link_count,
              wordCount: metrics.word_count,
              imageCount: metrics.image_count,
              history: historyResponse?.success ? historyResponse.data : null,
            });
            setLoading(false);
          });
        } else {
          await loadHistoryOnly(currentUrl);
        }
      });
    } catch (err) {
      console.error('Error loading page data:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      setLoading(false);
    }
  };

  const loadHistoryOnly = async (url: string) => {
    const historyMessage: ChromeMessage = {
      type: MessageType.GET_PAGE_HISTORY,
      data: { url },
    };

    chrome.runtime.sendMessage(historyMessage, (historyResponse) => {
      if (chrome.runtime.lastError) {
        console.error('Error getting history:', chrome.runtime.lastError);
        setError('Failed to load data. Make sure the backend is running.');
        setLoading(false);
        return;
      }

      if (historyResponse?.success && historyResponse.data?.visits?.length > 0) {
        const latestVisit = historyResponse.data.visits[0];
        setPageData({
          url,
          linkCount: latestVisit.link_count,
          wordCount: latestVisit.word_count,
          imageCount: latestVisit.image_count,
          history: historyResponse.data,
        });
      } else {
        setPageData({
          url,
          linkCount: 0,
          wordCount: 0,
          imageCount: 0,
          history: null,
        });
      }
      setLoading(false);
    });
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadPageData();
    setTimeout(() => setRefreshing(false), 500);
  };

  useEffect(() => {
    loadPageData();
  }, []);

  if (loading) {
    return <LoadingState />;
  }

  if (error && !pageData) {
    return (
      <div className="app-container">
        <div className="header">
          <h1>Chrome History Sidepanel</h1>
          <p className="subtitle">Track your browsing analytics</p>
        </div>
        <ErrorState message={error} />
        <button className="refresh-button" onClick={handleRefresh}>
          <RefreshCw size={16} />
          Try Again
        </button>
      </div>
    );
  }

  if (!pageData) {
    return (
      <div className="app-container">
        <ErrorState message="No data available" />
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Header */}
      <div className="header">
        <h1>Chrome History Sidepanel</h1>
        <p className="subtitle">Track your browsing analytics</p>
      </div>

      {/* Current URL Display */}
      <div className="current-url">
        <div className="url-label">
          <Globe size={12} />
          Current Page
        </div>
        <div className="url-text">{pageData.url}</div>
      </div>

      {/* Status Badge */}
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'center' }}>
        <div className="status-badge">
          <div className="status-dot"></div>
          Live Tracking Active
        </div>
      </div>

      {/* Metrics Card */}
      <MetricsCard
        linkCount={pageData.linkCount}
        wordCount={pageData.wordCount}
        imageCount={pageData.imageCount}
      />

      {/* History Card */}
      {pageData.history && (
        <HistoryCard visits={pageData.history.visits} />
      )}

      {/* Refresh Button */}
      <button 
        className="refresh-button" 
        onClick={handleRefresh}
        disabled={refreshing}
      >
        <RefreshCw size={16} className={refreshing ? 'spinning' : ''} />
        {refreshing ? 'Refreshing...' : 'Refresh Data'}
      </button>
    </div>
  );
};