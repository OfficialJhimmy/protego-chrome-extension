"""
API routes for page visits.
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from typing import List
from urllib.parse import unquote

from app.database import get_db
from app.schemas import PageVisitCreate, PageVisitResponse, PageVisitList
from app.response import success_response, error_response
from app import crud

router = APIRouter(
    prefix="/api/visits",
    tags=["visits"]
)


@router.post("/", status_code=201)
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
        return success_response(
            data=PageVisitResponse.model_validate(db_visit).model_dump(),
            message="Visit created successfully",
            status_code=201
        )
    except SQLAlchemyError as e:
        print(f"Database error creating visit: {str(e)}")
        return error_response(
            message="Failed to create visit",
            status_code=500,
            errors=[str(e)]
        )
    except Exception as e:
        print(f"Unexpected error creating visit: {str(e)}")
        return error_response(
            message="An unexpected error occurred",
            status_code=500
        )


@router.get("/url/{url:path}")
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
    try:
        # Decode URL if it's encoded
        decoded_url = unquote(url)
        
        visits = crud.get_visits_by_url(db=db, url=decoded_url, limit=limit, offset=offset)
        total = crud.get_visit_count_by_url(db=db, url=decoded_url)
        
        visits_data = [PageVisitResponse.model_validate(v).model_dump() for v in visits]
        
        return success_response(
            data={
                "visits": visits_data,
                "total": total
            }
        )
    except SQLAlchemyError as e:
        print(f"Database error fetching visits: {str(e)}")
        return error_response(
            message="Failed to fetch visits",
            status_code=500
        )
    except Exception as e:
        print(f"Unexpected error: {str(e)}")
        return error_response(
            message="An unexpected error occurred",
            status_code=500
        )


@router.get("/url/{url:path}/latest")
def get_latest_visit_for_url(
    url: str,
    db: Session = Depends(get_db)
):
    """
    Get the most recent visit for a specific URL.
    
    **Path Parameters:**
    - url: The page URL (URL-encoded)
    """
    try:
        # Decode URL if it's encoded
        decoded_url = unquote(url)
        
        visit = crud.get_latest_visit_by_url(db=db, url=decoded_url)
        
        if not visit:
            return error_response(
                message=f"No visits found for URL: {decoded_url}",
                status_code=404
            )
        
        return success_response(
            data=PageVisitResponse.model_validate(visit).model_dump()
        )
    except SQLAlchemyError as e:
        print(f"Database error: {str(e)}")
        return error_response(
            message="Failed to fetch visit",
            status_code=500
        )
    except Exception as e:
        print(f"Unexpected error: {str(e)}")
        return error_response(
            message="An unexpected error occurred",
            status_code=500
        )


@router.get("/")
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
    try:
        visits = crud.get_all_visits(db=db, limit=limit, offset=offset)
        total = len(visits)
        
        visits_data = [PageVisitResponse.model_validate(v).model_dump() for v in visits]
        
        return success_response(
            data={
                "visits": visits_data,
                "total": total
            }
        )
    except SQLAlchemyError as e:
        print(f"Database error: {str(e)}")
        return error_response(
            message="Failed to fetch visits",
            status_code=500
        )
    except Exception as e:
        print(f"Unexpected error: {str(e)}")
        return error_response(
            message="An unexpected error occurred",
            status_code=500
        )