"""
Pydantic schemas for request/response validation.
"""
from pydantic import BaseModel, Field, HttpUrl
from datetime import datetime
from typing import Optional
from uuid import UUID


class PageVisitCreate(BaseModel):
    """Schema for creating a new page visit."""
    url: str = Field(..., description="The URL of the visited page")
    datetime_visited: Optional[datetime] = Field(
        default=None, 
        description="Timestamp of visit (defaults to current time)"
    )
    link_count: int = Field(..., ge=0, description="Number of links on the page")
    word_count: int = Field(..., ge=0, description="Number of words on the page")
    image_count: int = Field(..., ge=0, description="Number of images on the page")

    class Config:
        json_schema_extra = {
            "example": {
                "url": "https://www.uhcprovider.com/en/health-plans.html",
                "datetime_visited": "2025-10-12T10:30:00",
                "link_count": 45,
                "word_count": 1200,
                "image_count": 8
            }
        }


class PageVisitResponse(BaseModel):
    """Schema for page visit response."""
    id: UUID
    url: str
    datetime_visited: datetime
    link_count: int
    word_count: int
    image_count: int
    created_at: datetime

    class Config:
        from_attributes = True


class PageVisitList(BaseModel):
    """Schema for list of page visits."""
    visits: list[PageVisitResponse]
    total: int


class HealthResponse(BaseModel):
    """Schema for health check response."""
    status: str
    timestamp: datetime
    database: str