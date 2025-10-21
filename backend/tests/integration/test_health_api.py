"""
Integration tests for health and root endpoints.
"""
from unittest.mock import patch
from sqlalchemy.exc import OperationalError


class TestHealthEndpoints:
    """Test health check and root endpoints."""
    
    def test_root_endpoint(self, client):
        """Test root endpoint returns API information."""
        response = client.get("/")
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "Chrome History Sidepanel API" in data["data"]["message"]
        assert data["data"]["version"] == "1.0.0"
        assert data["data"]["docs"] == "/docs"
        assert data["data"]["health"] == "/health"
    
    def test_health_check_healthy(self, client):
        """Test health check when database is connected."""
        response = client.get("/health")
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["message"] == "Service healthy"
        assert data["data"]["status"] == "healthy"
        assert data["data"]["version"] == "1.0.0"
        assert "uptime_seconds" in data["data"]
        assert isinstance(data["data"]["uptime_seconds"], (int, float))
        assert data["data"]["database"] == "connected"
    
    def test_health_check_response_structure(self, client):
        """Test health check response has correct structure."""
        response = client.get("/health")
        data = response.json()
        
        # Check top-level keys
        assert "success" in data
        assert "message" in data
        assert "data" in data
        
        # Check health data keys
        health_data = data["data"]
        assert "status" in health_data
        assert "version" in health_data
        assert "uptime_seconds" in health_data
        assert "database" in health_data
    
    def test_health_check_uptime_increases(self, client):
        """Test uptime increases between requests."""
        response1 = client.get("/health")
        uptime1 = response1.json()["data"]["uptime_seconds"]
        
        import time
        time.sleep(0.1)  # Wait 100ms
        
        response2 = client.get("/health")
        uptime2 = response2.json()["data"]["uptime_seconds"]
        
        assert uptime2 > uptime1
    
    def test_health_check_database_failure(self, client, db_session):
        """Test health check when database connection fails."""
        with patch.object(db_session, 'execute', side_effect=OperationalError("Connection failed", None, None)):
            response = client.get("/health")
            
            assert response.status_code == 503
            data = response.json()
            assert data["success"] is False
            assert data["message"] == "Service unhealthy"
            assert data["data"]["status"] == "unhealthy"
            assert data["data"]["database"] == "disconnected"