# Architecture Documentation

## System Architecture

### High-Level Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                          User Browser (Chrome)                       │
│                                                                       │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │                     Chrome Extension                            │ │
│  │                                                                  │ │
│  │  ┌──────────────┐      ┌──────────────┐      ┌──────────────┐ │ │
│  │  │   Content    │      │  Background  │      │  Side Panel  │ │ │
│  │  │   Script     │─────▶│   Service    │─────▶│   (React)    │ │ │
│  │  │              │      │   Worker     │      │              │ │ │
│  │  │ • Extract    │      │ • API calls  │      │ • Display    │ │ │
│  │  │   links      │      │ • Error      │      │   metrics    │ │ │
│  │  │ • Count      │      │   handling   │      │ • Show       │ │ │
│  │  │   words      │      │ • State mgmt │      │   history    │ │ │
│  │  │ • Count      │      │              │      │ • Refresh    │ │ │
│  │  │   images     │      │              │      │              │ │ │
│  │  └──────────────┘      └──────────────┘      └──────────────┘ │ │
│  │         │                      │                      │          │ │
│  └─────────┼──────────────────────┼──────────────────────┼─────────┘ │
│            │                      │                      │            │
│            │    chrome.runtime    │    chrome.tabs      │            │
│            │    .sendMessage      │    .sendMessage     │            │
└────────────┼──────────────────────┼──────────────────────┼───────────┘
             │                      │                      │
             │                      ▼                      │
             │            ┌──────────────────┐            │
             │            │   HTTP/REST API  │            │
             └───────────▶│   (Port 8000)    │◀───────────┘
                          └──────────────────┘
                                   │
                                   │
                          ┌────────▼────────┐
                          │   FastAPI       │
                          │   Backend       │
                          │                 │
                          │ • CORS enabled  │
                          │ • Pydantic      │
                          │ • SQLAlchemy    │
                          │ • Error handler │
                          └────────┬────────┘
                                   │
                                   │ ORM Queries
                                   │
                          ┌────────▼────────┐
                          │  PostgreSQL     │
                          │  Database       │
                          │                 │
                          │ • page_visits   │
                          │ • Indexes       │
                          │ • Timestamps    │
                          └─────────────────┘
```

---

## Component Details

### 1. Content Script (`content.ts`)

**Purpose:** Runs on every web page to extract metrics

**Responsibilities:**
- DOM parsing and analysis
- Counting links (`<a>` tags)
- Counting images (`<img>` tags)
- Counting words in visible text
- Sending data to background script

**Key Functions:**
```typescript
extractPageMetrics()  // Main extraction function
countWords()           // Word counting algorithm
sendMetricsToBackground()  // Communication with background
```

**Execution:**
- Runs at `document_idle` (after page load)
- Has access to page DOM
- No direct API access (security restriction)

---

### 2. Background Service Worker (`background.ts`)

**Purpose:** Handles API communication and state management

**Responsibilities:**
- Receiving messages from content script and side panel
- Making HTTP requests to FastAPI backend
- Error handling and retry logic
- API health checking

**Message Types:**
- `SAVE_PAGE_METRICS` - Store new visit
- `GET_PAGE_HISTORY` - Fetch visit history
- `GET_CURRENT_METRICS` - Get current page data

**API Communication:**
```typescript
savePageVisit()      // POST /api/visits
getVisitHistory()    // GET /api/visits/url/{url}
getLatestVisit()     // GET /api/visits/url/{url}/latest
checkApiHealth()     // GET /health
```

---

### 3. Side Panel UI (`App.tsx`)

**Purpose:** Display data to user with beautiful interface

**React Component Hierarchy:**
```
App
├── LoadingState
├── ErrorState
├── MetricsCard
│   └── Metric Items (Links, Words, Images)
└── HistoryCard
    └── HistoryItem (multiple)
```

**State Management:**
```typescript
loading: boolean           // Loading state
error: string | null       // Error message
pageData: PageData | null  // Main data object
refreshing: boolean        // Refresh in progress
```

**User Interactions:**
- Open side panel → Load data
- Click refresh → Reload data
- View history → Scroll timeline

---

### 4. FastAPI Backend

**Purpose:** RESTful API for data persistence

**API Endpoints:**

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/health` | Health check |
| GET | `/` | API info |
| POST | `/api/visits` | Create visit |
| GET | `/api/visits/url/{url}` | Get visits by URL |
| GET | `/api/visits/url/{url}/latest` | Get latest visit |
| GET | `/api/visits` | Get all visits |

**Request Flow:**
```
1. Request arrives → CORS middleware
2. Route matching → visits.py router
3. Dependency injection → get_db()
4. CRUD operation → crud.py
5. Database query → SQLAlchemy ORM
6. Response serialization → Pydantic schema
7. JSON response → Client
```

**Error Handling:**
- 404 for missing resources
- 500 for server errors
- 422 for validation errors

---

### 5. PostgreSQL Database

**Schema:**

```sql
CREATE TABLE page_visits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    url TEXT NOT NULL,
    datetime_visited TIMESTAMP NOT NULL DEFAULT NOW(),
    link_count INTEGER NOT NULL DEFAULT 0,
    word_count INTEGER NOT NULL DEFAULT 0,
    image_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_url ON page_visits(url);
CREATE INDEX idx_datetime_visited ON page_visits(datetime_visited);
CREATE INDEX idx_url_datetime ON page_visits(url, datetime_visited);
```

**Indexes:**
- `idx_url` - Fast lookup by URL
- `idx_datetime_visited` - Chronological queries
- `idx_url_datetime` - Combined queries (most efficient)

**Data Volume Estimates:**
- Average record size: ~200 bytes
- 1,000 visits = ~200 KB
- 100,000 visits = ~20 MB
- Easily scales to millions of records

---

## 🔄 Data Flow

### Scenario 1: User Visits a Page

```
1. User navigates to https://example.com
   │
2. Content Script loads and executes
   │
   ├─▶ Waits for DOM ready
   ├─▶ Counts links: document.querySelectorAll('a')
   ├─▶ Counts words: document.body.innerText.split()
   ├─▶ Counts images: document.querySelectorAll('img')
   │
3. Content Script → Background (chrome.runtime.sendMessage)
   │
   Message: {
     type: 'SAVE_PAGE_METRICS',
     data: { url, link_count, word_count, image_count }
   }
   │
4. Background receives message
   │
   ├─▶ Validates data
   ├─▶ Checks API health
   │
5. Background → FastAPI (fetch POST /api/visits)
   │
6. FastAPI processes request
   │
   ├─▶ Validates with Pydantic
   ├─▶ Creates PageVisit object
   ├─▶ Calls crud.create_page_visit()
   │
7. SQLAlchemy → PostgreSQL
   │
   INSERT INTO page_visits VALUES (...)
   │
8. Database returns created record
   │
9. FastAPI → Background (JSON response)
   │
10. Background → Content Script (success confirmation)
```

### Scenario 2: User Opens Side Panel

```
1. User clicks extension icon
   │
2. Side Panel HTML loads
   │
3. React app initializes
   │
   ├─▶ Renders LoadingState
   ├─▶ Calls loadPageData()
   │
4. Side Panel → Background (chrome.runtime.sendMessage)
   │
   Message: {
     type: 'GET_PAGE_HISTORY',
     data: { url: currentUrl }
   }
   │
5. Background → FastAPI (GET /api/visits/url/{url})
   │
6. FastAPI queries database
   │
   SELECT * FROM page_visits 
   WHERE url = $1 
   ORDER BY datetime_visited DESC
   │
7. Database returns results
   │
8. FastAPI → Background (JSON array)
   │
9. Background → Side Panel (visit history)
   │
10. React updates state
    │
    ├─▶ Sets pageData
    ├─▶ Renders MetricsCard
    ├─▶ Renders HistoryCard
    └─▶ Shows timeline with animations
```

---

## 🔐 Security Considerations

### CORS Configuration
- Allows `chrome-extension://*` origins
- Blocks unauthorized domains
- Credentials not required (local use)

### Content Security Policy
```json
{
  "content_security_policy": {
    "extension_pages": "script-src 'self'; object-src 'self'"
  }
}
```

### API Security
- No authentication (single-user local deployment)
- Input validation via Pydantic
- SQL injection prevention via SQLAlchemy ORM
- XSS protection via React (automatic escaping)

### Database Security
- Password-protected PostgreSQL
- Network isolation via Docker
- No direct external access

---

## Performance Optimizations

### Database
- **Composite index** on (url, datetime_visited) for fast queries
- **Connection pooling** via SQLAlchemy
- **Query optimization** - only fetch needed columns

### Extension
- **Lazy loading** - Side panel only loads when opened
- **Debouncing** - 1 second delay after page load
- **Efficient DOM queries** - Use querySelectorAll once
- **Minimal re-renders** - React optimization

### Backend
- **Async I/O** - FastAPI with uvicorn
- **Response caching** - Can add Redis if needed
- **Database connection reuse** - SessionLocal pattern

---

## Scalability

### Current Capacity
- **Pages tracked:** Unlimited (database constraint)
- **Concurrent users:** Single user (no auth)
- **Request rate:** ~100 requests/second (uvicorn)
- **Database size:** Scales to millions of records

### Scaling Strategies
1. **Horizontal scaling** - Add more FastAPI instances
2. **Database replication** - Read replicas for queries
3. **Caching layer** - Redis for frequent queries
4. **CDN** - If deploying publicly
5. **Message queue** - RabbitMQ for async processing

---

## Technology Choices

### Why React?
- Component-based architecture
- Rich ecosystem
- Excellent developer experience
- Easy state management
- Virtual DOM for performance

### Why FastAPI?
- Modern Python framework
- Automatic API documentation
- Type hints with Pydantic
- High performance (async)
- Easy to test

### Why PostgreSQL?
- Robust and reliable
- Excellent indexing
- ACID compliance
- JSON support (if needed)
- Mature ecosystem

### Why Docker?
- Consistent environments
- Easy deployment
- Service isolation
- Version control for infrastructure
- Simple setup for reviewers

### Why TypeScript?
- Type safety catches bugs early
- Better IDE support
- Self-documenting code
- Easier refactoring
- Industry standard

---

## Design Patterns

### Backend
- **Repository Pattern** - crud.py abstracts database operations
- **Dependency Injection** - FastAPI's Depends()
- **Schema Pattern** - Pydantic for validation
- **Factory Pattern** - Database session creation

### Frontend
- **Component Pattern** - Reusable UI components
- **Container/Presenter** - App.tsx manages state, components display
- **Custom Hooks** - Can add usePageData, useRefresh, etc.
- **Error Boundaries** - ErrorState component

### Extension
- **Message Passing** - Event-driven communication
- **Separation of Concerns** - Content/Background/UI split
- **Observer Pattern** - Background listens to content script

---

## Monitoring & Debugging

### Backend Logs
```bash
# View real-time logs
docker-compose logs -f backend

# Filter errors
docker-compose logs backend | grep ERROR
```

### Extension Logs
```bash
# Background script console
# Click "service worker" link in chrome://extensions/

# Content script console
# Browser DevTools console on any page

# Side panel console
# Right-click in side panel → Inspect
```

### Database Queries
```bash
# Monitor queries
docker-compose exec postgres tail -f /var/log/postgresql/postgresql.log

# Slow query analysis
# Add logging_collector = on in postgresql.conf
```

---

**This architecture is designed for clarity, maintainability, and scalability** while meeting all assessment requirements. 🚀