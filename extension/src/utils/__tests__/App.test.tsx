import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MessageType } from '../../types';
import { App } from '../../sidepanel/App';

// --- Global Chrome Mocks ---
beforeAll(() => {
  // Create a minimal mock of the chrome object
  (globalThis as any).chrome = {
    tabs: {
      query: jest.fn(),
      sendMessage: jest.fn(),
    },
    runtime: {
      sendMessage: jest.fn(),
      lastError: null,
    },
  } as unknown as typeof chrome;
});

describe('App Component', () => {
  const mockTab = {
    id: 1,
    url: 'https://example.com',
    active: true,
    windowId: 1,
  };

  const mockMetrics = {
    url: 'https://example.com',
    link_count: 10,
    word_count: 500,
    image_count: 5,
    datetime_visited: '2024-01-01T00:00:00Z',
  };

  const mockHistory = {
    visits: [
      {
        id: '1',
        url: 'https://example.com',
        datetime_visited: '2024-01-01T00:00:00Z',
        link_count: 10,
        word_count: 500,
        image_count: 5,
        created_at: '2024-01-01T00:00:00Z',
      },
    ],
    total: 1,
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock chrome.tabs.query
    (chrome.tabs.query as jest.Mock).mockResolvedValue([mockTab]);

    // Mock chrome.tabs.sendMessage for metrics
    (chrome.tabs.sendMessage as jest.Mock).mockImplementation((tabId, message, callback) => {
      if (message.type === MessageType.GET_CURRENT_METRICS) {
        callback({ success: true, data: mockMetrics });
      }
    });

    // Mock chrome.runtime.sendMessage for history
    (chrome.runtime.sendMessage as jest.Mock).mockImplementation((message, callback) => {
      if (message.type === MessageType.GET_PAGE_HISTORY) {
        callback({ success: true, data: mockHistory });
      }
    });
  });

  it('should render loading state initially', () => {
    render(<App />);
    expect(screen.getByText(/loading page data/i)).toBeInTheDocument();
  });

  it('should display page data after loading', async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Chrome History Sidepanel')).toBeInTheDocument();
    });

    expect(screen.getByText('https://example.com')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument(); // link count
    expect(screen.getByText('500')).toBeInTheDocument(); // word count
    expect(screen.getByText('5')).toBeInTheDocument(); // image count
  });

  it('should display visit history', async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(/visit history/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/1 visit/i)).toBeInTheDocument();
  });

  it('should handle error when no active tab', async () => {
    (chrome.tabs.query as jest.Mock).mockResolvedValue([]);

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(/error loading data/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/no active tab found/i)).toBeInTheDocument();
  });

  it('should handle error from content script', async () => {
    (chrome.tabs.sendMessage as jest.Mock).mockImplementation((tabId, message, callback) => {
      chrome.runtime.lastError = { message: 'Content script not available' };
      callback({ success: false });
    });

    (chrome.runtime.sendMessage as jest.Mock).mockImplementation((message, callback) => {
      callback({ success: true, data: mockHistory });
    });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Chrome History Sidepanel')).toBeInTheDocument();
    });

    // Should fall back to history data
    expect(screen.getByText('10')).toBeInTheDocument();
  });

  it('should handle error from background script', async () => {
    (chrome.runtime.sendMessage as jest.Mock).mockImplementation((message, callback) => {
      chrome.runtime.lastError = { message: 'Backend not available' };
      callback({ success: false, error: 'Failed to load visit history' });
    });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(/error loading data/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/failed to load visit history/i)).toBeInTheDocument();
  });

  it('should handle refresh button click', async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Chrome History Sidepanel')).toBeInTheDocument();
    });

    const refreshButton = screen.getByRole('button', { name: /refresh data/i });
    fireEvent.click(refreshButton);

    await waitFor(() => {
      expect(screen.getByText(/refreshing/i)).toBeInTheDocument();
    });

    expect(chrome.tabs.query).toHaveBeenCalledTimes(2); // Initial + refresh
  });

  it('should display empty state when no history', async () => {
    (chrome.runtime.sendMessage as jest.Mock).mockImplementation((message, callback) => {
      callback({ success: true, data: { visits: [], total: 0 } });
    });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(/no previous visits/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/first time visiting this page/i)).toBeInTheDocument();
  });

  it('should display live tracking badge', async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(/live tracking active/i)).toBeInTheDocument();
    });
  });

  it('should handle multiple visits in history', async () => {
    const multipleVisits = {
      visits: [
        {
          id: '1',
          url: 'https://example.com',
          datetime_visited: '2024-01-01T00:00:00Z',
          link_count: 10,
          word_count: 500,
          image_count: 5,
          created_at: '2024-01-01T00:00:00Z',
        },
        {
          id: '2',
          url: 'https://example.com',
          datetime_visited: '2024-01-02T00:00:00Z',
          link_count: 15,
          word_count: 600,
          image_count: 8,
          created_at: '2024-01-02T00:00:00Z',
        },
      ],
      total: 2,
    };

    (chrome.runtime.sendMessage as jest.Mock).mockImplementation((message, callback) => {
      if (message.type === MessageType.GET_PAGE_HISTORY) {
        callback({ success: true, data: multipleVisits });
      }
    });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Chrome History Sidepanel')).toBeInTheDocument();
    });

    expect(screen.getByText(/2 visits/i)).toBeInTheDocument();
    expect(screen.getByText('2024-01-01T00:00:00Z')).toBeInTheDocument();
    expect(screen.getByText('2024-01-02T00:00:00Z')).toBeInTheDocument();
    expect(screen.getByText('15')).toBeInTheDocument();
    expect(screen.getByText('600')).toBeInTheDocument();
    expect(screen.getByText('8')).toBeInTheDocument();
  });
});