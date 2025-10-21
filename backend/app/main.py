"""
Main FastAPI application entry point.
"""
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import datetime

from app.database import engine, get_db, Base
from app.routers import visits
from app.schemas import HealthResponse
from app.response import success_response, error_response

# Track application start time for uptime calculation
start_time = datetime.utcnow()
APP_VERSION = "1.0.0"
APP_TITLE = "Chrome History Sidepanel API"

# Create database tables
Base.metadata.create_all(bind=engine)

# Initialize FastAPI app
app = FastAPI(
    title=APP_TITLE,
    description="Backend API for Chrome extension that tracks page visit history and analytics",
    version=APP_VERSION,
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS to allow Chrome extension to communicate
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins (for development)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

# Include routers
app.include_router(visits.router)


@app.get("/", tags=["root"])
async def root():
    """Root endpoint - API information."""
    return success_response(
        data={
            "message": f"{APP_TITLE}",
            "version": APP_VERSION,
            "docs": "/docs",
            "health": "/health"
        }
    )


@app.get("/health", tags=["health"])
async def health_check(db: Session = Depends(get_db)):
    """
    Health check endpoint to verify API and database connectivity.
    """
    try:
        # Test database connection (SQLAlchemy 2.0 compatible)
        from sqlalchemy import text
        db.execute(text("SELECT 1"))
        db_status = "connected"
        status = "healthy"
        status_code = 200
    except Exception as e:
        db_status = "disconnected"
        status = "unhealthy"
        status_code = 503
        print(f"Database health check failed: {str(e)}")
    
    # Calculate uptime
    uptime_seconds = (datetime.utcnow() - start_time).total_seconds()
    
    health_data = {
        "status": status,
        "version": APP_VERSION,
        "uptime_seconds": round(uptime_seconds, 2),
        "database": db_status
    }
    
    if status == "healthy":
        return success_response(
            data=health_data,
            message="Service healthy"
        )
    else:
        return error_response(
            message="Service unhealthy",
            status_code=status_code,
            data=health_data
        )


@app.on_event("startup")
async def startup_event():
    """Run on application startup."""
    print(f"🚀 {APP_TITLE} is starting...")
    print(f"📊 Database tables created/verified")
    print(f"✅ API is ready to accept requests")


@app.on_event("shutdown")
async def shutdown_event():
    """Run on application shutdown."""
    print(f"👋 {APP_TITLE} is shutting down...")