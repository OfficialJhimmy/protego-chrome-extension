import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';

// Get root element
const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element not found');
}

// Create React root and render app
const root = createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

console.log('Chrome History Sidepanel UI Loaded');