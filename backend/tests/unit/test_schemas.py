"""
Unit tests for Pydantic schemas.
"""
import pytest
from pydantic import ValidationError
from datetime import datetime

from app.schemas import PageVisitCreate, PageVisitResponse, PageVisitList


class TestPageVisitCreate:
    """Test PageVisitCreate schema validation."""
    
    def test_valid_visit_create(self):
        """Test creating valid PageVisitCreate."""
        data = {
            "url": "https://example.com",
            "link_count": 10,
            "word_count": 500,
            "image_count": 5
        }
        
        visit = PageVisitCreate(**data)
        
        assert visit.url == "https://example.com"
        assert visit.link_count == 10
        assert visit.word_count == 500
        assert visit.image_count == 5
        assert visit.datetime_visited is None  # Optional
    
    def test_visit_with_timestamp(self):
        """Test creating visit with timestamp."""
        data = {
            "url": "https://example.com",
            "datetime_visited": datetime(2024, 1, 15, 10, 30, 0),
            "link_count": 10,
            "word_count": 500,
            "image_count": 5
        }
        
        visit = PageVisitCreate(**data)
        
        assert visit.datetime_visited == datetime(2024, 1, 15, 10, 30, 0)
    
    def test_missing_required_fields(self):
        """Test validation fails with missing required fields."""
        data = {
            "url": "https://example.com"
            # Missing link_count, word_count, image_count
        }
        
        with pytest.raises(ValidationError) as exc_info:
            PageVisitCreate(**data)
        
        errors = exc_info.value.errors()
        error_fields = {error['loc'][0] for error in errors}
        assert 'link_count' in error_fields
        assert 'word_count' in error_fields
        assert 'image_count' in error_fields
    
    def test_negative_counts_rejected(self):
        """Test negative counts are rejected."""
        data = {
            "url": "https://example.com",
            "link_count": -1,
            "word_count": 500,
            "image_count": 5
        }
        
        with pytest.raises(ValidationError) as exc_info:
            PageVisitCreate(**data)
        
        errors = exc_info.value.errors()
        assert any('greater than or equal to 0' in str(error) for error in errors)
    
    def test_zero_counts_accepted(self):
        """Test zero counts are valid."""
        data = {
            "url": "https://example.com",
            "link_count": 0,
            "word_count": 0,
            "image_count": 0
        }
        
        visit = PageVisitCreate(**data)
        
        assert visit.link_count == 0
        assert visit.word_count == 0
        assert visit.image_count == 0
    
    def test_invalid_url_type(self):
        """Test invalid URL type is rejected."""
        data = {
            "url": 12345,  # Not a string
            "link_count": 10,
            "word_count": 500,
            "image_count": 5
        }
        
        with pytest.raises(ValidationError):
            PageVisitCreate(**data)
    
    def test_invalid_count_types(self):
        """Test invalid count types are rejected."""
        data = {
            "url": "https://example.com",
            "link_count": "ten",  # Not an integer
            "word_count": 500,
            "image_count": 5
        }
        
        with pytest.raises(ValidationError):
            PageVisitCreate(**data)


class TestPageVisitResponse:
    """Test PageVisitResponse schema."""
    
    def test_visit_response_from_dict(self):
        """Test creating PageVisitResponse from dict."""
        data = {
            "id": "550e8400-e29b-41d4-a716-446655440000",
            "url": "https://example.com",
            "datetime_visited": datetime(2024, 1, 15, 10, 30, 0),
            "link_count": 10,
            "word_count": 500,
            "image_count": 5,
            "created_at": datetime(2024, 1, 15, 10, 30, 0)
        }
        
        response = PageVisitResponse(**data)
        
        assert str(response.id) == "550e8400-e29b-41d4-a716-446655440000"
        assert response.url == "https://example.com"
        assert response.link_count == 10


class TestPageVisitList:
    """Test PageVisitList schema."""
    
    def test_visit_list(self):
        """Test creating PageVisitList."""
        visit_data = {
            "id": "550e8400-e29b-41d4-a716-446655440000",
            "url": "https://example.com",
            "datetime_visited": datetime(2024, 1, 15, 10, 30, 0),
            "link_count": 10,
            "word_count": 500,
            "image_count": 5,
            "created_at": datetime(2024, 1, 15, 10, 30, 0)
        }
        
        visit = PageVisitResponse(**visit_data)
        
        visit_list = PageVisitList(visits=[visit], total=1)
        
        assert len(visit_list.visits) == 1
        assert visit_list.total == 1
    
    def test_empty_visit_list(self):
        """Test creating empty PageVisitList."""
        visit_list = PageVisitList(visits=[], total=0)
        
        assert len(visit_list.visits) == 0
        assert visit_list.total == 0