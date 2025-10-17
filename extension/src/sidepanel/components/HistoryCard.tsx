import React from 'react';
import { Clock, Link, FileText, Image } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { PageVisitResponse } from '../../types';

interface HistoryCardProps {
  visits: PageVisitResponse[];
}

export const HistoryCard: React.FC<HistoryCardProps> = ({ visits }) => {
  if (visits.length === 0) {
    return (
      <div className="card">
        <h2 className="card-title">
          <span>📜</span>
          Visit History
        </h2>
        <div className="empty-state">
          <div className="empty-icon">
            <Clock size={64} />
          </div>
          <div className="empty-title">No Previous Visits</div>
          <div className="empty-message">
            This is your first time visiting this page!
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card history-section">
      <h2 className="card-title">
        <span>📜</span>
        Visit History
        <span style={{ 
          marginLeft: 'auto', 
          fontSize: '14px', 
          fontWeight: 500,
          color: '#667eea'
        }}>
          {visits.length} visit{visits.length !== 1 ? 's' : ''}
        </span>
      </h2>
      <div className="history-list">
        {visits.map((visit, index) => (
          <HistoryItem key={visit.id} visit={visit} index={index} />
        ))}
      </div>
    </div>
  );
};

interface HistoryItemProps {
  visit: PageVisitResponse;
  index: number;
}

const HistoryItem: React.FC<HistoryItemProps> = ({ visit }) => {
  const visitDate = new Date(visit.datetime_visited);
  const timeAgo = formatDistanceToNow(visitDate, { addSuffix: true });
  const fullDate = format(visitDate, 'PPpp'); // e.g., "Apr 29, 2023, 9:30:00 AM"

  return (
    <div className="history-item" title={fullDate}>
      <div className="history-time">
        <Clock size={14} />
        {timeAgo}
      </div>
      <div className="history-stats">
        <div className="history-stat">
          <Link size={12} />
          <span className="history-stat-value">{visit.link_count}</span>
          <span>links</span>
        </div>
        <div className="history-stat">
          <FileText size={12} />
          <span className="history-stat-value">{visit.word_count}</span>
          <span>words</span>
        </div>
        <div className="history-stat">
          <Image size={12} />
          <span className="history-stat-value">{visit.image_count}</span>
          <span>images</span>
        </div>
      </div>
    </div>
  );
};