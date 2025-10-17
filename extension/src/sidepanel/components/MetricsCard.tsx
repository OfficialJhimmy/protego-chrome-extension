import React from 'react';
import { Link, FileText, Image } from 'lucide-react';

interface MetricsCardProps {
  linkCount: number;
  wordCount: number;
  imageCount: number;
}

export const MetricsCard: React.FC<MetricsCardProps> = ({
  linkCount,
  wordCount,
  imageCount,
}) => {
  return (
    <div className="card">
      <h2 className="card-title">
        <span>📊</span>
        Current Page Metrics
      </h2>
      <div className="metrics-grid">
        <div className="metric-item">
          <div className="metric-icon">
            <Link size={24} />
          </div>
          <div className="metric-value">{linkCount.toLocaleString()}</div>
          <div className="metric-label">Links</div>
        </div>
        <div className="metric-item">
          <div className="metric-icon">
            <FileText size={24} />
          </div>
          <div className="metric-value">{wordCount.toLocaleString()}</div>
          <div className="metric-label">Words</div>
        </div>
        <div className="metric-item">
          <div className="metric-icon">
            <Image size={24} />
          </div>
          <div className="metric-value">{imageCount.toLocaleString()}</div>
          <div className="metric-label">Images</div>
        </div>
      </div>
    </div>
  );
};