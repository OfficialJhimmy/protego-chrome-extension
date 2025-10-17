import React from 'react';

export const LoadingState: React.FC = () => {
  return (
    <div className="loading">
      <div className="loading-spinner"></div>
      <div className="loading-text">Loading page data...</div>
    </div>
  );
};