import React from 'react';
import { AlertCircle } from 'lucide-react';

interface ErrorStateProps {
  message: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({ message }) => {
  return (
    <div className="error">
      <div className="error-title">
        <AlertCircle size={20} />
        Error Loading Data
      </div>
      <div className="error-message">{message}</div>
    </div>
  );
};