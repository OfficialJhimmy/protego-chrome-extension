"""
Pytest configuration and shared fixtures.
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.database import Base, get_db
from app.models import PageVisit

# Create in-memory SQLite database for testing
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)

TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def db_session():
    """
    Create a fresh database session for each test.
    """
    # Create tables
    Base.metadata.create_all(bind=engine)
    
    # Create session
    session = TestingSessionLocal()
    
    try:
        yield session
    finally:
        session.close()
        # Drop all tables after test
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db_session):
    """
    Create a test client with dependency override.
    """
    def override_get_db():
        try:
            yield db_session
        finally:
            pass
    
    app.dependency_overrides[get_db] = override_get_db
    
    with TestClient(app) as test_client:
        yield test_client
    
    app.dependency_overrides.clear()


@pytest.fixture
def sample_visit_data():
    """
    Sample visit data for testing.
    """
    return {
        "url": "https://www.uhcprovider.com/en/health-plans.html",
        "link_count": 45,
        "word_count": 1200,
        "image_count": 8
    }


@pytest.fixture
def sample_visits_batch():
    """
    Batch of sample visits for testing.
    """
    return [
        {
            "url": "https://www.uhcprovider.com",
            "link_count": 42,
            "word_count": 1150,
            "image_count": 7
        },
        {
            "url": "https://www.aetna.com",
            "link_count": 55,
            "word_count": 1450,
            "image_count": 10
        }
    ]