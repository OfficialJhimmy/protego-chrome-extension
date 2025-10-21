"""
Integration tests for visits API endpoints.
"""
import pytest
from datetime import datetime


class TestCreateVisit:
    """Test POST /api/visits endpoint."""
    
    def test_create_visit_success(self, client, sample_visit_data):
        """Test successful visit creation."""
        response = client.post("/api/visits", json=sample_visit_data)
        
        assert response.status_code == 201
        data = response.json()
        assert data["success"] is True
        assert data["message"] == "Visit created successfully"
        assert data["data"]["url"] == sample_visit_data["url"]
        assert data["data"]["link_count"] == sample_visit_data["link_count"]
        assert data["data"]["word_count"] == sample_visit_data["word_count"]
        assert data["data"]["image_count"] == sample_visit_data["image_count"]
        assert "id" in data["data"]
        assert "created_at" in data["data"]
        assert "datetime_visited" in data["data"]
    
    def test_create_visit_with_timestamp(self, client):
        """Test creating visit with explicit timestamp."""
        visit_time = "2024-01-15T10:30:00"
        visit_data = {
            "url": "https://example.com",
            "datetime_visited": visit_time,
            "link_count": 10,
            "word_count": 500,
            "image_count": 5
        }
        
        response = client.post("/api/visits", json=visit_data)
        
        assert response.status_code == 201
        data = response.json()
        assert data["success"] is True
        # Timestamp should be preserved
        assert visit_time in data["data"]["datetime_visited"]
    
    def test_create_visit_invalid_url(self, client):
        """Test creating visit with invalid URL."""
        invalid_data = {
            "url": "not-a-valid-url",
            "link_count": 10,
            "word_count": 500,
            "image_count": 5
        }
        
        response = client.post("/api/visits", json=invalid_data)
        
        assert response.status_code == 422  # Validation error
    
    def test_create_visit_missing_required_fields(self, client):
        """Test creating visit without required fields."""
        invalid_data = {
            "url": "https://example.com"
            # Missing link_count, word_count, image_count
        }
        
        response = client.post("/api/visits", json=invalid_data)
        
        assert response.status_code == 422
    
    def test_create_visit_negative_counts(self, client):
        """Test creating visit with negative counts."""
        invalid_data = {
            "url": "https://example.com",
            "link_count": -5,
            "word_count": 500,
            "image_count": 5
        }
        
        response = client.post("/api/visits", json=invalid_data)
        
        assert response.status_code == 422
    
    def test_create_visit_zero_counts(self, client):
        """Test creating visit with zero counts (should be valid)."""
        visit_data = {
            "url": "https://example.com",
            "link_count": 0,
            "word_count": 0,
            "image_count": 0
        }
        
        response = client.post("/api/visits", json=visit_data)
        
        assert response.status_code == 201
        data = response.json()
        assert data["success"] is True
        assert data["data"]["link_count"] == 0


class TestGetVisitHistory:
    """Test GET /api/visits/url/{url} endpoint."""
    
    def test_get_history_success(self, client, sample_visit_data):
        """Test getting visit history for a URL."""
        # Create two visits
        client.post("/api/visits", json=sample_visit_data)
        client.post("/api/visits", json=sample_visit_data)
        
        # Get history
        encoded_url = "https%3A%2F%2Fwww.uhcprovider.com%2Fen%2Fhealth-plans.html"
        response = client.get(f"/api/visits/url/{encoded_url}")
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["data"]["total"] == 2
        assert len(data["data"]["visits"]) == 2
    
    def test_get_history_pagination(self, client, sample_visit_data):
        """Test pagination of visit history."""
        # Create 15 visits
        for _ in range(15):
            client.post("/api/visits", json=sample_visit_data)
        
        # Get first page (limit 10)
        encoded_url = "https%3A%2F%2Fwww.uhcprovider.com%2Fen%2Fhealth-plans.html"
        response_page1 = client.get(f"/api/visits/url/{encoded_url}?limit=10&offset=0")
        
        # Get second page
        response_page2 = client.get(f"/api/visits/url/{encoded_url}?limit=10&offset=10")
        
        assert response_page1.status_code == 200
        assert response_page2.status_code == 200
        
        data_page1 = response_page1.json()
        data_page2 = response_page2.json()
        
        assert data_page1["data"]["total"] == 15
        assert len(data_page1["data"]["visits"]) == 10
        assert len(data_page2["data"]["visits"]) == 5
        
        # Ensure visits are different between pages
        page1_ids = [v["id"] for v in data_page1["data"]["visits"]]
        page2_ids = [v["id"] for v in data_page2["data"]["visits"]]
        assert set(page1_ids).isdisjoint(set(page2_ids))
    
    def test_get_history_empty_results(self, client):
        """Test getting history for URL with no visits."""
        encoded_url = "https%3A%2F%2Fnonexistent.com"
        response = client.get(f"/api/visits/url/{encoded_url}")
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["data"]["total"] == 0
        assert len(data["data"]["visits"]) == 0
    
    def test_get_history_limit_validation(self, client):
        """Test limit parameter validation."""
        encoded_url = "https%3A%2F%2Fexample.com"
        
        # Limit too high (max 100)
        response = client.get(f"/api/visits/url/{encoded_url}?limit=200")
        assert response.status_code == 422
        
        # Limit too low (min 1)
        response = client.get(f"/api/visits/url/{encoded_url}?limit=0")
        assert response.status_code == 422
        
        # Valid limit
        response = client.get(f"/api/visits/url/{encoded_url}?limit=50")
        assert response.status_code == 200
    
    def test_get_history_offset_validation(self, client):
        """Test offset parameter validation."""
        encoded_url = "https%3A%2F%2Fexample.com"
        
        # Negative offset
        response = client.get(f"/api/visits/url/{encoded_url}?offset=-1")
        assert response.status_code == 422
        
        # Valid offset
        response = client.get(f"/api/visits/url/{encoded_url}?offset=0")
        assert response.status_code == 200


class TestGetLatestVisit:
    """Test GET /api/visits/url/{url}/latest endpoint."""
    
    def test_get_latest_visit_success(self, client, sample_visit_data):
        """Test getting latest visit."""
        # Create two visits
        client.post("/api/visits", json=sample_visit_data)
        
        modified_data = sample_visit_data.copy()
        modified_data["link_count"] = 999  # Different count
        client.post("/api/visits", json=modified_data)
        
        # Get latest
        encoded_url = "https%3A%2F%2Fwww.uhcprovider.com%2Fen%2Fhealth-plans.html"
        response = client.get(f"/api/visits/url/{encoded_url}/latest")
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["data"]["link_count"] == 999  # Latest visit
    
    def test_get_latest_visit_not_found(self, client):
        """Test getting latest visit for non-existent URL."""
        encoded_url = "https%3A%2F%2Fnonexistent.com"
        response = client.get(f"/api/visits/url/{encoded_url}/latest")
        
        assert response.status_code == 404
        data = response.json()
        assert data["success"] is False
        assert "No visits found" in data["message"]


class TestGetAllVisits:
    """Test GET /api/visits endpoint."""
    
    def test_get_all_visits_success(self, client, sample_visits_batch):
        """Test getting all visits across URLs."""
        # Create visits for different URLs
        for visit_data in sample_visits_batch:
            client.post("/api/visits", json=visit_data)
        
        response = client.get("/api/visits")
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["data"]["total"] == 2
        assert len(data["data"]["visits"]) == 2
    
    def test_get_all_visits_pagination(self, client, sample_visit_data):
        """Test pagination for all visits."""
        # Create 25 visits
        for _ in range(25):
            client.post("/api/visits", json=sample_visit_data)
        
        # Get first page
        response_page1 = client.get("/api/visits?limit=10&offset=0")
        response_page2 = client.get("/api/visits?limit=10&offset=10")
        
        assert response_page1.status_code == 200
        assert response_page2.status_code == 200
        
        data_page1 = response_page1.json()
        data_page2 = response_page2.json()
        
        assert len(data_page1["data"]["visits"]) == 10
        assert len(data_page2["data"]["visits"]) == 10
    
    def test_get_all_visits_empty(self, client):
        """Test getting all visits when none exist."""
        response = client.get("/api/visits")
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["data"]["total"] == 0
        assert len(data["data"]["visits"]) == 0
    
    def test_get_all_visits_limit_validation(self, client):
        """Test limit validation for get all visits."""
        # Limit too high (max 500)
        response = client.get("/api/visits?limit=1000")
        assert response.status_code == 422
        
        # Valid limit
        response = client.get("/api/visits?limit=100")
        assert response.status_code == 200


class TestVisitOrdering:
    """Test that visits are ordered correctly."""
    
    def test_visits_ordered_by_datetime_desc(self, client, sample_visit_data):
        """Test visits are returned in reverse chronological order."""
        # Create visits with different timestamps
        visit1 = sample_visit_data.copy()
        visit1["datetime_visited"] = "2024-01-15T10:00:00"
        client.post("/api/visits", json=visit1)
        
        visit2 = sample_visit_data.copy()
        visit2["datetime_visited"] = "2024-01-15T11:00:00"
        client.post("/api/visits", json=visit2)
        
        visit3 = sample_visit_data.copy()
        visit3["datetime_visited"] = "2024-01-15T12:00:00"
        client.post("/api/visits", json=visit3)
        
        # Get visits
        encoded_url = "https%3A%2F%2Fwww.uhcprovider.com%2Fen%2Fhealth-plans.html"
        response = client.get(f"/api/visits/url/{encoded_url}")
        
        visits = response.json()["data"]["visits"]
        
        # Most recent should be first
        assert "12:00:00" in visits[0]["datetime_visited"]
        assert "11:00:00" in visits[1]["datetime_visited"]
        assert "10:00:00" in visits[2]["datetime_visited"]