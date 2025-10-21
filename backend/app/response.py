"""
Standardized API response helpers for consistent error handling.
"""
from typing import Any, Optional, Dict
from fastapi.responses import JSONResponse


def success_response(
    data: Any = None,
    message: str = "Success",
    status_code: int = 200
) -> Dict[str, Any]:
    """
    Standardized success response format.
    
    Args:
        data: Response data
        message: Success message
        status_code: HTTP status code
    
    Returns:
        Standardized success response
    """
    return {
        "success": True,
        "message": message,
        "data": data
    }


def error_response(
    message: str,
    status_code: int = 400,
    errors: Optional[list] = None,
    data: Optional[Dict] = None
) -> JSONResponse:
    """
    Standardized error response format.
    
    Args:
        message: Error message
        status_code: HTTP status code
        errors: List of detailed errors
        data: Additional error context
    
    Returns:
        JSONResponse with error details
    """
    response_data = {
        "success": False,
        "message": message
    }
    
    if errors:
        response_data["errors"] = errors
    
    if data:
        response_data["data"] = data
    
    return JSONResponse(
        status_code=status_code,
        content=response_data
    )