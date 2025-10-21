import '@testing-library/jest-dom';

// Mock chrome API
global.chrome = {
  runtime: {
    sendMessage: jest.fn(),
    onMessage: {
      addListener: jest.fn(),
    },
    lastError: undefined,
  },
  tabs: {
    query: jest.fn(),
    sendMessage: jest.fn(),
  },
  sidePanel: {
    open: jest.fn(),
    setPanelBehavior: jest.fn(),
  },
  action: {
    onClicked: {
      addListener: jest.fn(),
    },
  },
} as any;

// Mock window.chrome for content scripts
(window as any).chrome = global.chrome;