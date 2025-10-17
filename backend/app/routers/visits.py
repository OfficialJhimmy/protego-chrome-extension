"""
API routes for page visits.
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List
from urllib.parse import unquote

from app.database import get_db
from app.schemas import PageVisitCreate, PageVisitResponse, PageVisitList
from app import crud

router = APIRouter(
    prefix="/api/visits",
    tags=["visits"]
)


@router.post("/", response_model=PageVisitResponse, status_code=201)
def create_visit(
    visit: PageVisitCreate,
    db: Session = Depends(get_db)
):
    """
    Create a new page visit record.
    
    **Request Body:**
    - url: The page URL
    - datetime_visited: Timestamp (optional, defaults to now)
    - link_count: Number of links on the page
    - word_count: Number of words on the page
    - image_count: Number of images on the page
    """
    try:
        db_visit = crud.create_page_visit(db=db, visit=visit)
        return db_visit
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create visit: {str(e)}")


@router.get("/url/{url:path}", response_model=PageVisitList)
def get_visits_for_url(
    url: str,
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    """
    Get all visits for a specific URL.
    
    **Path Parameters:**
    - url: The page URL (URL-encoded)
    
    **Query Parameters:**
    - limit: Maximum number of results (default: 50, max: 100)
    - offset: Number of results to skip (default: 0)
    """
    # Decode URL if it's encoded
    decoded_url = unquote(url)
    
    visits = crud.get_visits_by_url(db=db, url=decoded_url, limit=limit, offset=offset)
    total = crud.get_visit_count_by_url(db=db, url=decoded_url)
    
    return PageVisitList(visits=visits, total=total)


@router.get("/url/{url:path}/latest", response_model=PageVisitResponse)
def get_latest_visit_for_url(
    url: str,
    db: Session = Depends(get_db)
):
    """
    Get the most recent visit for a specific URL.
    
    **Path Parameters:**
    - url: The page URL (URL-encoded)
    """
    # Decode URL if it's encoded
    decoded_url = unquote(url)
    
    visit = crud.get_latest_visit_by_url(db=db, url=decoded_url)
    
    if not visit:
        raise HTTPException(
            status_code=404, 
            detail=f"No visits found for URL: {decoded_url}"
        )
    
    return visit


@router.get("/", response_model=PageVisitList)
def get_all_visits(
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    """
    Get all visits across all URLs.
    
    **Query Parameters:**
    - limit: Maximum number of results (default: 100, max: 500)
    - offset: Number of results to skip (default: 0)
    """
    visits = crud.get_all_visits(db=db, limit=limit, offset=offset)
    total = len(visits)
    
    return PageVisitList(visits=visits, total=total)