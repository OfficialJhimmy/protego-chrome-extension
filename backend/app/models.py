"""
SQLAlchemy database models.
"""
from sqlalchemy import Column, String, Integer, DateTime, Text, Index
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
import uuid

from app.database import Base


class PageVisit(Base):
    """
    Model for storing page visit history and metrics.
    """
    __tablename__ = "page_visits"

    # Primary key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    
    # Page information
    url = Column(Text, nullable=False, index=True)
    
    # Visit timestamp
    datetime_visited = Column(DateTime, nullable=False, default=datetime.utcnow, index=True)
    
    # Page metrics
    link_count = Column(Integer, nullable=False, default=0)
    word_count = Column(Integer, nullable=False, default=0)
    image_count = Column(Integer, nullable=False, default=0)
    
    # Metadata
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    # Create composite index for efficient querying
    __table_args__ = (
        Index('idx_url_datetime', 'url', 'datetime_visited'),
    )

    def __repr__(self):
        return f"<PageVisit(url={self.url}, visited={self.datetime_visited})>"