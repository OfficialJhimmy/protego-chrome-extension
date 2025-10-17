# 🎯 Chrome History Sidepanel

A modern Chrome Extension that intelligently tracks page visit history with real-time analytics. Built with React, FastAPI, and PostgreSQL for a seamless full-stack experience.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![TypeScript](https://img.shields.io/badge/typescript-5.3.2-blue)
![React](https://img.shields.io/badge/react-18+-blue)
![FastAPI](https://img.shields.io/badge/fastapi-0.104-green)

## 📸 Screenshots

### Side Panel Interface
![Side Panel Interface](./assets/sidepanel.png)

### Visit History
![Visit History](./assets/visit-history.png)

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Chrome Browser                          │
│  ┌────────────────┐  ┌──────────────┐  ┌─────────────────┐ │
│  │  Content       │  │  Background  │  │  Side Panel     │ │
│  │  Script        │─▶│  Service     │─▶│  (React UI)     │ │
│  │  (Extracts     │  │  Worker      │  │  (Displays      │ │
│  │   Metrics)     │  │  (API Calls) │  │   Data)         │ │
│  └────────────────┘  └──────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP/REST API
                              ▼
                    ┌───────────────────┐
                    │   FastAPI Backend │
                    │   (Python 3.11)   │
                    └───────────────────┘
                              │
                              │ SQLAlchemy ORM
                              ▼
                    ┌───────────────────┐
                    │   PostgreSQL DB   │
                    │   (Dockerized)    │
                    └───────────────────┘
```

### Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 18 + TypeScript | Side panel UI with modern design |
| **Extension** | Chrome Extension API (Manifest V3) | Content scripts & background workers |
| **Backend** | FastAPI (Python 3.11) | RESTful API for data operations |
| **Database** | PostgreSQL 15 | Persistent storage with indexing |
| **DevOps** | Docker + Docker Compose | Containerized deployment |
| **Migrations** | Alembic | Database schema versioning |

---

## ✨ Features

### 📊 Real-Time Analytics
- **Link Count**: Tracks all `<a>` tags on the page
- **Word Count**: Counts visible text words (excludes scripts/styles)
- **Image Count**: Tracks all `<img>` elements
- **Timestamp**: Records exact visit time

### 📜 Visit History
- Timeline view of all past visits to current page
- Relative timestamps ("2 hours ago", "yesterday")
- Historical metrics for each visit
- Chronological sorting (newest first)

### 🎨 Modern UI/UX
- Glassmorphism design with backdrop blur
- Smooth animations and micro-interactions
- Gradient accents and hover effects
- Professional typography (Inter font)
- Responsive layout
- Loading and error states

### 🔧 Technical Excellence
- TypeScript for type safety
- Proper error handling throughout
- Database indexing for performance
- CORS configuration for security
- RESTful API design
- Docker containerization
- Database migrations with Alembic

---

## 🚀 Quick Start

### Prerequisites

- **Docker Desktop** (version 20+)
- **Google Chrome** (version 100+)
- **Git**

### Installation

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd chrome-history-sidepanel

# 2. Run automated setup
./setup.sh
```

The setup script will:
- ✅ Build Docker images
- ✅ Start PostgreSQL and FastAPI services
- ✅ Run database migrations
- ✅ Verify system health

### Load Extension in Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top-right corner)
3. Click **Load unpacked**
4. Select the `extension/dist/` folder from this project
5. Extension should appear with no errors

### Verify Installation

```bash
# Check services are running
docker-compose ps

# Test API health
curl http://localhost:8000/health

# View API documentation
open http://localhost:8000/docs
```

---

## Usage

### Using the Extension

1. **Navigate to any webpage** (e.g., https://www.uhcprovider.com)
2. **Click the extension icon** in Chrome toolbar (puzzle piece)
3. **Select "Chrome History Sidepanel"** to open the side panel
4. **View real-time metrics** for the current page
5. **See visit history** if you've visited the page before
6. **Click "Refresh Data"** to update metrics

### API Endpoints

#### Health Check
```bash
GET http://localhost:8000/health
```

#### Create Page Visit
```bash
POST http://localhost:8000/api/visits
Content-Type: application/json

{
  "url": "https://example.com",
  "link_count": 42,
  "word_count": 1200,
  "image_count": 8
}
```

#### Get Visit History
```bash
GET http://localhost:8000/api/visits/url/{encoded_url}?limit=50&offset=0
```

#### Get Latest Visit
```bash
GET http://localhost:8000/api/visits/url/{encoded_url}/latest
```

#### Get All Visits
```bash
GET http://localhost:8000/api/visits?limit=100&offset=0
```

**Full API documentation available at:** http://localhost:8000/docs

---

## Project Structure

```
chrome-history-sidepanel/
├── backend/                      # FastAPI Backend
│   ├── app/
│   │   ├── main.py              # Application entry point
│   │   ├── models.py            # SQLAlchemy models
│   │   ├── schemas.py           # Pydantic schemas
│   │   ├── crud.py              # Database operations
│   │   ├── database.py          # DB configuration
│   │   └── routers/
│   │       └── visits.py        # API routes
│   ├── alembic/                 # Database migrations
│   │   ├── versions/            # Migration scripts
│   │   └── env.py               # Alembic config
│   ├── requirements.txt         # Python dependencies
│   ├── Dockerfile               # Backend container
│   └── alembic.ini              # Migration settings
│
├── extension/                    # Chrome Extension
│   ├── src/
│   │   ├── content/
│   │   │   └── content.ts       # Content script (extracts metrics)
│   │   ├── background/
│   │   │   └── background.ts    # Service worker (API calls)
│   │   ├── sidepanel/
│   │   │   ├── App.tsx          # Main React component
│   │   │   ├── index.tsx        # React entry point
│   │   │   ├── sidepanel.html   # HTML template
│   │   │   ├── components/      # React components
│   │   │   │   ├── MetricsCard.tsx
│   │   │   │   ├── HistoryCard.tsx
│   │   │   │   ├── LoadingState.tsx
│   │   │   │   └── ErrorState.tsx
│   │   │   └── styles/
│   │   │       └── App.css      # Modern CSS styling
│   │   ├── types/
│   │   │   └── index.ts         # TypeScript types
│   │   └── utils/
│   │       └── api.ts           # API utility functions
│   ├── public/
│   │   └── manifest.json        # Extension manifest
│   ├── dist/                    # Built extension (generated)
│   ├── package.json             # Node dependencies
│   ├── tsconfig.json            # TypeScript config
│   └── webpack.config.js        # Build configuration
│
├── docker-compose.yml           # Service orchestration
├── assets/                      # sidepanel screenshots
|    ├── sidepanel.png
│    └── visit-history.png        
├── .env                         # Environment variables
├── .env.example                 # Environment template
├── setup.sh                     # Automated setup script
├── test-api.sh                  # API testing script
├── README.md                    # This file
├── TESTING.md                   # Testing guide
└── .gitignore                   # Git ignore rules
```

---

## Database Schema

### `page_visits` Table

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `url` | TEXT | Page URL (indexed) |
| `datetime_visited` | TIMESTAMP | Visit timestamp (indexed) |
| `link_count` | INTEGER | Number of links |
| `word_count` | INTEGER | Number of words |
| `image_count` | INTEGER | Number of images |
| `created_at` | TIMESTAMP | Record creation time |

**Indexes:**
- `idx_url_datetime` - Composite index on (url, datetime_visited)
- Primary key index on `id`
- Index on `url` for fast lookups

---

## Development

### Backend Development

```bash
# View logs
docker-compose logs -f backend

# Access database
docker-compose exec postgres psql -U chromeuser -d chrome_history

# Run migrations
docker-compose exec backend alembic upgrade head

# Create new migration
docker-compose exec backend alembic revision --autogenerate -m "description"

# Restart services
docker-compose restart
```

### Extension Development

```bash
cd extension

# Install dependencies
npm install

# Build for production
npm run build

# Watch mode (auto-rebuild on changes)
npm run dev

# Clean build artifacts
npm run clean
```

### Testing

```bash
# Run API tests
./test-api.sh

# Manual testing
# See TESTING.md for comprehensive testing guide
```

---

## Configuration

### Environment Variables

Create a `.env` file in the project root (or use `.env.example` as template):

```bash
# Database Configuration
POSTGRES_USER=chromeuser
POSTGRES_PASSWORD=chromepass123
POSTGRES_DB=chrome_history
POSTGRES_HOST=postgres
POSTGRES_PORT=5432

# Database URL for FastAPI
DATABASE_URL=postgresql://chromeuser:chromepass123@postgres:5432/chrome_history

# FastAPI Configuration
API_HOST=0.0.0.0
API_PORT=8000
ENVIRONMENT=development
```

### CORS Configuration

The backend is configured to accept requests from:
- `chrome-extension://*` (all Chrome extensions)
- `http://localhost:3000` (React dev server)
- `http://localhost:8000` (FastAPI)

Modify `backend/app/main.py` to add more origins if needed.

---

## Testing

### Automated Tests

```bash
# API endpoint tests
./test-api.sh
```

### Manual Testing

See [TESTING.md](./TESTING.md) for comprehensive testing guide including:
- Extension functionality tests
- API endpoint tests
- Database verification
- UI/UX testing checklist
- Performance testing
- Edge case scenarios

### Test on Target Websites

As specified in requirements, test on:
- https://www.uhcprovider.com
- https://www.aetna.com/health-care-professionals/clinical-policy-bulletins/medical-clinical-policy-bulletins/ustekinumab.html

---

## Assumptions & Design Decisions

### Assumptions Made

1. **Single User**: No authentication required (local single-user deployment)
2. **URL Matching**: Exact URL matching (not domain-level grouping)
3. **Word Count**: Visible text only, excludes `<script>` and `<style>` content
4. **Performance**: Optimized for pages with < 10,000 elements
5. **Browser**: Chrome-only (no Firefox/Safari support needed)
6. **Network**: Assumes localhost backend (not production-ready for remote deployment)

### Design Decisions

1. **Manifest V3**: Used latest Chrome Extension API for future compatibility
2. **TypeScript**: Ensures type safety and better developer experience
3. **React**: Component-based architecture for maintainable UI code
4. **Glassmorphism**: Modern design trend that stands out
5. **PostgreSQL**: Robust relational database with excellent indexing
6. **Docker**: Ensures consistent deployment across environments
7. **Alembic**: Professional database migration management
8. **REST API**: Standard, well-understood API architecture

---

## Known Limitations

1. **Local Backend**: Requires Docker running locally (not cloud-deployed)
2. **Chrome-Only**: Works only in Chrome (Manifest V3 specific)
3. **No Authentication**: Single-user assumption (no multi-user support)
4. **URL Exact Match**: Doesn't group by domain (treats `page.html?v=1` and `page.html?v=2` as different)
5. **Large Pages**: May be slow on pages with 10,000+ links/images
6. **Protected Pages**: Cannot access pages behind authentication

---

## Troubleshooting

### Services Won't Start

```bash
# Check Docker is running
docker ps

# View logs
docker-compose logs

# Restart everything
docker-compose down -v
docker-compose up -d
```

### Extension Not Loading

```bash
# Rebuild extension
cd extension
npm run build

# Reload in Chrome
# Go to chrome://extensions/ and click reload button
```

### Backend Connection Failed

```bash
# Check backend health
curl http://localhost:8000/health

# Restart backend
docker-compose restart backend

# Check logs
docker-compose logs backend
```

### Database Issues

```bash
# Access database
docker-compose exec postgres psql -U chromeuser -d chrome_history

# Check tables exist
\dt

# View data
SELECT * FROM page_visits LIMIT 10;

# Exit
\q
```

---

## License

This project is created for assessment purposes.

---

## Acknowledgments

Built with modern web technologies:
- [FastAPI](https://fastapi.tiangolo.com/) - Modern Python web framework
- [React](https://react.dev/) - UI library for building components
- [TypeScript](https://www.typescriptlang.org/) - Type-safe JavaScript
- [PostgreSQL](https://www.postgresql.org/) - Powerful relational database
- [Docker](https://www.docker.com/) - Containerization platform
- [Alembic](https://alembic.sqlalchemy.org/) - Database migrations
- [SQLAlchemy](https://www.sqlalchemy.org/) - Python SQL toolkit
- [Lucide React](https://lucide.dev/) - Beautiful icon library

---

## Author
- Feyijimi Olufemi Erinle


**Candidate for Senior Full-Stack Engineer Position**

Demonstrating expertise in:
- Full-stack development (React + FastAPI + PostgreSQL)
- Modern Chrome Extension development (Manifest V3)
- Docker containerization and DevOps
- Database design and optimization
- TypeScript and type-safe development
- RESTful API design
- UI/UX design principles
- Testing and documentation

---

## 📞 Support

For questions or issues during review:
1. Check [TESTING.md](./TESTING.md) for troubleshooting
2. Review docker-compose logs: `docker-compose logs`
3. Verify all prerequisites are installed
4. Ensure Docker Desktop is running

---

## Assessment Deliverables Checklist

- ✅ Chrome Extension with side panel
- ✅ Content script extracting page metrics
- ✅ Background service worker
- ✅ React-based UI with modern design
- ✅ FastAPI backend with REST endpoints
- ✅ PostgreSQL database with proper schema
- ✅ Docker and Docker Compose setup
- ✅ Build script for easy deployment
- ✅ Database migrations (Alembic)
- ✅ Comprehensive README with instructions
- ✅ Testing documentation
- ✅ Works on target websites (UHC, Aetna)
- ✅ Clean, well-organized code structure
- ✅ Type safety (TypeScript + Pydantic)
- ✅ Error handling throughout
- ✅ Professional UI/UX design
- ✅ Git repository with proper .gitignore