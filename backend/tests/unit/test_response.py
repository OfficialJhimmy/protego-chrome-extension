"""
Unit tests for response helper functions.
"""
import json
from app.response import success_response, error_response


class TestSuccessResponse:
    """Test success_response helper function."""
    
    def test_success_response_default(self):
        """Test default success response."""
        response = success_response(data={"test": "data"})
        
        assert isinstance(response, dict)
        assert response["success"] is True
        assert response["message"] == "Success"
        assert response["data"] == {"test": "data"}
    
    def test_success_response_custom_message(self):
        """Test success response with custom message."""
        response = success_response(
            data={"test": "data"},
            message="Custom success message"
        )
        
        assert response["success"] is True
        assert response["message"] == "Custom success message"
        assert response["data"] == {"test": "data"}
    
    def test_success_response_none_data(self):
        """Test success response with None data."""
        response = success_response(data=None)
        
        assert response["success"] is True
        assert response["data"] is None
    
    def test_success_response_complex_data(self):
        """Test success response with complex nested data."""
        complex_data = {
            "visits": [
                {"id": 1, "url": "https://example.com"},
                {"id": 2, "url": "https://other.com"}
            ],
            "total": 2,
            "metadata": {
                "page": 1,
                "has_more": False
            }
        }
        
        response = success_response(data=complex_data)
        
        assert response["success"] is True
        assert response["data"] == complex_data


class TestErrorResponse:
    """Test error_response helper function."""
    
    def test_error_response_default(self):
        """Test default error response."""
        response = error_response(message="Error occurred")
        
        assert response.status_code == 400
        body = json.loads(response.body)
        assert body["success"] is False
        assert body["message"] == "Error occurred"
    
    def test_error_response_custom_status_code(self):
        """Test error response with custom status code."""
        response = error_response(
            message="Not found",
            status_code=404
        )
        
        assert response.status_code == 404
        body = json.loads(response.body)
        assert body["success"] is False
        assert body["message"] == "Not found"
    
    def test_error_response_with_errors_list(self):
        """Test error response with errors list."""
        response = error_response(
            message="Validation failed",
            status_code=422,
            errors=["Field 'url' is required", "Field 'link_count' must be >= 0"]
        )
        
        assert response.status_code == 422
        body = json.loads(response.body)
        assert body["success"] is False
        assert body["message"] == "Validation failed"
        assert "errors" in body
        assert len(body["errors"]) == 2
    
    def test_error_response_with_data(self):
        """Test error response with additional data."""
        response = error_response(
            message="Service unavailable",
            status_code=503,
            data={
                "status": "unhealthy",
                "database": "disconnected",
                "uptime_seconds": 12.34
            }
        )
        
        assert response.status_code == 503
        body = json.loads(response.body)
        assert body["success"] is False
        assert body["message"] == "Service unavailable"
        assert "data" in body
        assert body["data"]["status"] == "unhealthy"
        assert body["data"]["database"] == "disconnected"
    
    def test_error_response_no_optional_fields(self):
        """Test error response without optional fields."""
        response = error_response(message="Simple error")
        
        body = json.loads(response.body)
        assert body["success"] is False
        assert body["message"] == "Simple error"
        assert "errors" not in body
        assert "data" not in body