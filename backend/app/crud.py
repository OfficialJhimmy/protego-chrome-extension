"""
CRUD operations for database interactions.
"""
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List, Optional
from datetime import datetime

from app.models import PageVisit
from app.schemas import PageVisitCreate


def create_page_visit(db: Session, visit: PageVisitCreate) -> PageVisit:
    """
    Create a new page visit record in the database.
    
    Args:
        db: Database session
        visit: Page visit data
    
    Returns:
        Created PageVisit object
    """
    # Use provided datetime or current time
    visit_time = visit.datetime_visited or datetime.utcnow()
    
    db_visit = PageVisit(
        url=visit.url,
        datetime_visited=visit_time,
        link_count=visit.link_count,
        word_count=visit.word_count,
        image_count=visit.image_count
    )
    
    db.add(db_visit)
    db.commit()
    db.refresh(db_visit)
    
    return db_visit


def get_visits_by_url(
    db: Session, 
    url: str, 
    limit: int = 50, 
    offset: int = 0
) -> List[PageVisit]:
    """
    Get all visits for a specific URL, ordered by most recent first.
    
    Args:
        db: Database session
        url: The URL to query
        limit: Maximum number of results
        offset: Number of results to skip
    
    Returns:
        List of PageVisit objects
    """
    return (
        db.query(PageVisit)
        .filter(PageVisit.url == url)
        .order_by(desc(PageVisit.datetime_visited))
        .limit(limit)
        .offset(offset)
        .all()
    )


def get_latest_visit_by_url(db: Session, url: str) -> Optional[PageVisit]:
    """
    Get the most recent visit for a specific URL.
    
    Args:
        db: Database session
        url: The URL to query
    
    Returns:
        PageVisit object or None if no visits found
    """
    return (
        db.query(PageVisit)
        .filter(PageVisit.url == url)
        .order_by(desc(PageVisit.datetime_visited))
        .first()
    )


def get_visit_count_by_url(db: Session, url: str) -> int:
    """
    Get the total number of visits for a specific URL.
    
    Args:
        db: Database session
        url: The URL to query
    
    Returns:
        Count of visits
    """
    return db.query(PageVisit).filter(PageVisit.url == url).count()


def get_all_visits(db: Session, limit: int = 100, offset: int = 0) -> List[PageVisit]:
    """
    Get all visits across all URLs.
    
    Args:
        db: Database session
        limit: Maximum number of results
        offset: Number of results to skip
    
    Returns:
        List of PageVisit objects
    """
    return (
        db.query(PageVisit)
        .order_by(desc(PageVisit.datetime_visited))
        .limit(limit)
        .offset(offset)
        .all()
    )