"""
Unit tests for CRUD operations.
"""
import pytest
from unittest.mock import patch
from sqlalchemy.exc import SQLAlchemyError
from datetime import datetime

from app import crud
from app.schemas import PageVisitCreate


class TestCreatePageVisit:
    """Test create_page_visit function."""
    
    def test_create_visit_success(self, db_session):
        """Test successful visit creation."""
        visit_data = PageVisitCreate(
            url="https://example.com",
            link_count=10,
            word_count=500,
            image_count=5
        )
        
        result = crud.create_page_visit(db_session, visit_data)
        
        assert result.id is not None
        assert result.url == "https://example.com"
        assert result.link_count == 10
        assert result.word_count == 500
        assert result.image_count == 5
        assert result.created_at is not None
        assert result.datetime_visited is not None
    
    def test_create_visit_with_timestamp(self, db_session):
        """Test creating visit with explicit timestamp."""
        visit_time = datetime(2024, 1, 15, 10, 30, 0)
        visit_data = PageVisitCreate(
            url="https://example.com",
            datetime_visited=visit_time,
            link_count=10,
            word_count=500,
            image_count=5
        )
        
        result = crud.create_page_visit(db_session, visit_data)
        
        assert result.datetime_visited == visit_time
    
    def test_create_visit_without_timestamp(self, db_session):
        """Test creating visit without timestamp uses current time."""
        visit_data = PageVisitCreate(
            url="https://example.com",
            link_count=10,
            word_count=500,
            image_count=5
        )
        
        before = datetime.utcnow()
        result = crud.create_page_visit(db_session, visit_data)
        after = datetime.utcnow()
        
        assert before <= result.datetime_visited <= after
    
    def test_create_visit_with_zero_counts(self, db_session):
        """Test creating visit with zero counts."""
        visit_data = PageVisitCreate(
            url="https://example.com",
            link_count=0,
            word_count=0,
            image_count=0
        )
        
        result = crud.create_page_visit(db_session, visit_data)
        
        assert result.link_count == 0
        assert result.word_count == 0
        assert result.image_count == 0
    
    def test_create_visit_database_error(self, db_session):
        """Test handling database errors during creation."""
        visit_data = PageVisitCreate(
            url="https://example.com",
            link_count=10,
            word_count=500,
            image_count=5
        )
        
        with patch.object(db_session, 'commit', side_effect=SQLAlchemyError("DB Error")):
            with pytest.raises(SQLAlchemyError):
                crud.create_page_visit(db_session, visit_data)


class TestGetVisitsByUrl:
    """Test get_visits_by_url function."""
    
    def test_get_visits_by_url_success(self, db_session):
        """Test getting visits for a specific URL."""
        # Create visits
        visit1 = PageVisitCreate(url="https://example.com", link_count=10, word_count=500, image_count=5)
        visit2 = PageVisitCreate(url="https://example.com", link_count=15, word_count=600, image_count=6)
        visit3 = PageVisitCreate(url="https://other.com", link_count=20, word_count=700, image_count=7)
        
        crud.create_page_visit(db_session, visit1)
        crud.create_page_visit(db_session, visit2)
        crud.create_page_visit(db_session, visit3)
        
        # Get visits for example.com
        visits = crud.get_visits_by_url(db_session, "https://example.com")
        
        assert len(visits) == 2
        assert all(v.url == "https://example.com" for v in visits)
    
    def test_get_visits_pagination(self, db_session):
        """Test pagination of visits."""
        # Create 25 visits
        for i in range(25):
            visit = PageVisitCreate(url="https://example.com", link_count=i, word_count=500, image_count=5)
            crud.create_page_visit(db_session, visit)
        
        # Get first page (10 results)
        page1 = crud.get_visits_by_url(db_session, "https://example.com", limit=10, offset=0)
        page2 = crud.get_visits_by_url(db_session, "https://example.com", limit=10, offset=10)
        page3 = crud.get_visits_by_url(db_session, "https://example.com", limit=10, offset=20)
        
        assert len(page1) == 10
        assert len(page2) == 10
        assert len(page3) == 5
        
        # Ensure no duplicates between pages
        page1_ids = {v.id for v in page1}
        page2_ids = {v.id for v in page2}
        assert page1_ids.isdisjoint(page2_ids)
    
    def test_get_visits_nonexistent_url(self, db_session):
        """Test getting visits for URL with no visits."""
        visits = crud.get_visits_by_url(db_session, "https://nonexistent.com")
        assert len(visits) == 0
    
    def test_get_visits_ordered_desc(self, db_session):
        """Test visits are ordered by datetime descending."""
        # Create visits with specific timestamps
        visit1 = PageVisitCreate(
            url="https://example.com",
            datetime_visited=datetime(2024, 1, 15, 10, 0, 0),
            link_count=1, word_count=500, image_count=5
        )
        visit2 = PageVisitCreate(
            url="https://example.com",
            datetime_visited=datetime(2024, 1, 15, 11, 0, 0),
            link_count=2, word_count=500, image_count=5
        )
        visit3 = PageVisitCreate(
            url="https://example.com",
            datetime_visited=datetime(2024, 1, 15, 12, 0, 0),
            link_count=3, word_count=500, image_count=5
        )
        
        crud.create_page_visit(db_session, visit1)
        crud.create_page_visit(db_session, visit2)
        crud.create_page_visit(db_session, visit3)
        
        visits = crud.get_visits_by_url(db_session, "https://example.com")
        
        # Most recent first
        assert visits[0].link_count == 3
        assert visits[1].link_count == 2
        assert visits[2].link_count == 1


class TestGetLatestVisitByUrl:
    """Test get_latest_visit_by_url function."""
    
    def test_get_latest_visit_success(self, db_session):
        """Test getting latest visit."""
        visit1 = PageVisitCreate(
            url="https://example.com",
            datetime_visited=datetime(2024, 1, 15, 10, 0, 0),
            link_count=10, word_count=500, image_count=5
        )
        visit2 = PageVisitCreate(
            url="https://example.com",
            datetime_visited=datetime(2024, 1, 15, 11, 0, 0),
            link_count=20, word_count=600, image_count=6
        )
        
        crud.create_page_visit(db_session, visit1)
        crud.create_page_visit(db_session, visit2)
        
        latest = crud.get_latest_visit_by_url(db_session, "https://example.com")
        
        assert latest is not None
        assert latest.link_count == 20  # Latest visit
    
    def test_get_latest_visit_nonexistent(self, db_session):
        """Test getting latest visit for non-existent URL."""
        latest = crud.get_latest_visit_by_url(db_session, "https://nonexistent.com")
        assert latest is None


class TestGetVisitCountByUrl:
    """Test get_visit_count_by_url function."""
    
    def test_count_visits(self, db_session):
        """Test counting visits for a URL."""
        # Create 5 visits
        for _ in range(5):
            visit = PageVisitCreate(url="https://example.com", link_count=10, word_count=500, image_count=5)
            crud.create_page_visit(db_session, visit)
        
        count = crud.get_visit_count_by_url(db_session, "https://example.com")
        assert count == 5
    
    def test_count_nonexistent_url(self, db_session):
        """Test counting visits for non-existent URL."""
        count = crud.get_visit_count_by_url(db_session, "https://nonexistent.com")
        assert count == 0


class TestGetAllVisits:
    """Test get_all_visits function."""
    
    def test_get_all_visits(self, db_session):
        """Test getting all visits across URLs."""
        visit1 = PageVisitCreate(url="https://example.com", link_count=10, word_count=500, image_count=5)
        visit2 = PageVisitCreate(url="https://other.com", link_count=15, word_count=600, image_count=6)
        
        crud.create_page_visit(db_session, visit1)
        crud.create_page_visit(db_session, visit2)
        
        visits = crud.get_all_visits(db_session)
        
        assert len(visits) == 2
    
    def test_get_all_visits_pagination(self, db_session):
        """Test pagination for all visits."""
        # Create 15 visits
        for i in range(15):
            visit = PageVisitCreate(url=f"https://example{i}.com", link_count=10, word_count=500, image_count=5)
            crud.create_page_visit(db_session, visit)
        
        page1 = crud.get_all_visits(db_session, limit=10, offset=0)
        page2 = crud.get_all_visits(db_session, limit=10, offset=10)
        
        assert len(page1) == 10
        assert len(page2) == 5