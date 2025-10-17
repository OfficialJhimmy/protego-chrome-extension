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

# Create database tables
Base.metadata.create_all(bind=engine)

# Initialize FastAPI app
app = FastAPI(
    title="Chrome History Sidepanel API",
    description="Backend API for Chrome extension that tracks page visit history and analytics",
    version="1.0.0",
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
    return {
        "message": "Chrome History Sidepanel API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health"
    }


@app.get("/health", response_model=HealthResponse, tags=["health"])
async def health_check(db: Session = Depends(get_db)):
    """
    Health check endpoint to verify API and database connectivity.
    """
    try:
        # Test database connection (SQLAlchemy 2.0 compatible)
        from sqlalchemy import text
        db.execute(text("SELECT 1"))
        db_status = "connected"
    except Exception as e:
        db_status = f"error: {str(e)}"
    
    return HealthResponse(
        status="healthy" if db_status == "connected" else "unhealthy",
        timestamp=datetime.utcnow(),
        database=db_status
    )


@app.on_event("startup")
async def startup_event():
    """Run on application startup."""
    print("🚀 Chrome History Sidepanel API is starting...")
    print("📊 Database tables created/verified")
    print("✅ API is ready to accept requests")


@app.on_event("shutdown")
async def shutdown_event():
    """Run on application shutdown."""
    print("👋 Chrome History Sidepanel API is shutting down...")