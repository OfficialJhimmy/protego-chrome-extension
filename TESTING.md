# Testing Guide - Chrome History Sidepanel

This document provides comprehensive testing instructions for reviewers.

## Quick Start Testing

### Prerequisites
- Docker Desktop installed and running
- Google Chrome browser
- Terminal access

### 1. Start the Backend

```bash
# Navigate to project directory
cd chrome-history-sidepanel

# Run setup script (first time only)
./setup.sh

# Or manually start services
docker-compose up -d

# Verify services are running
docker-compose ps
```

**Expected Output:**
- `chrome_history_db` - Status: Up
- `chrome_history_api` - Status: Up

### 2. Load the Extension

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top-right)
3. Click **Load unpacked**
4. Select the `chrome-history-sidepanel/extension/dist/` folder
5. Verify extension appears with no errors

### 3. Test the Extension

#### Test Case 1: Basic Functionality
1. Visit https://www.uhcprovider.com
2. Wait 2-3 seconds for page to fully load
3. Click the extension icon to open side panel
4. **Expected Results:**
   - Side panel opens with beautiful gradient UI
   - Current URL is displayed
   - Three metric cards show:
     - Links count (should be > 50)
     - Words count (should be > 1000)
     - Images count (should be > 5)
   - "Live Tracking Active" badge is visible
   - No history shown (first visit)

#### Test Case 2: Visit History
1. Refresh the page (Cmd+R or Ctrl+R)
2. Wait 2-3 seconds
3. Open side panel again
4. **Expected Results:**
   - New metrics are displayed
   - History section shows "1 visit"
   - Timeline shows "X seconds ago" or "X minutes ago"
   - Previous visit shows old metrics

#### Test Case 3: Multiple Visits
1. Visit the same page 3-4 more times (refresh)
2. Open side panel
3. **Expected Results:**
   - History shows "4-5 visits"
   - Timeline displays all visits in chronological order
   - Each visit shows different timestamps
   - Most recent visit is at the top

#### Test Case 4: Different Pages
1. Visit https://www.aetna.com/health-care-professionals/clinical-policy-bulletins/medical-clinical-policy-bulletins/ustekinumab.html
2. Open side panel
3. **Expected Results:**
   - Different metrics displayed
   - No history (first visit to this URL)
   - URL is correctly displayed

#### Test Case 5: Refresh Data
1. On any page, open side panel
2. Click **"Refresh Data"** button
3. **Expected Results:**
   - Button shows "Refreshing..." with spinning icon
   - Data updates after ~1 second
   - All metrics are current

## Backend API Testing

### Manual API Tests

#### Test Health Endpoint
```bash
curl http://localhost:8000/health
```
**Expected:** `{"status":"healthy","timestamp":"...","database":"connected"}`

#### Test Create Visit
```bash
curl -X POST http://localhost:8000/api/visits \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://test.com",
    "link_count": 10,
    "word_count": 100,
    "image_count": 5
  }'
```
**Expected:** Returns created visit with UUID, timestamps, etc.

#### Test Get Visits
```bash
curl "http://localhost:8000/api/visits/url/https%3A%2F%2Ftest.com"
```
**Expected:** Returns list of visits for the URL

### Automated API Tests

Run the automated test suite:
```bash
./test-api.sh
```

**Expected:** All tests pass (green checkmarks)

## Database Verification

### View All Visits
```bash
docker-compose exec postgres psql -U chromeuser -d chrome_history \
  -c "SELECT url, link_count, word_count, image_count, datetime_visited FROM page_visits ORDER BY datetime_visited DESC LIMIT 10;"
```

### Count Total Visits
```bash
docker-compose exec postgres psql -U chromeuser -d chrome_history \
  -c "SELECT COUNT(*) as total_visits FROM page_visits;"
```

### View Visits by URL
```bash
docker-compose exec postgres psql -U chromeuser -d chrome_history \
  -c "SELECT COUNT(*) as visit_count, url FROM page_visits GROUP BY url ORDER BY visit_count DESC;"
```

## UI/UX Testing

### Visual Elements Checklist
- [ ] Gradient background displays correctly
- [ ] Glassmorphism cards have blur effect
- [ ] Metrics cards have hover animations
- [ ] Timeline items animate on load
- [ ] Refresh button spins when clicked
- [ ] Loading state shows spinner
- [ ] Error states display clearly
- [ ] Typography is clean and readable
- [ ] Status badge pulses smoothly

### Responsive Design
- [ ] UI works in narrow sidepanel (320px width)
- [ ] Text doesn't overflow
- [ ] Metrics grid stacks properly
- [ ] Scrolling works in history section

### Accessibility
- [ ] All text is readable
- [ ] Sufficient color contrast
- [ ] Hover states are visible
- [ ] Loading/error states are clear

## Troubleshooting Tests

### Extension Not Working

**Issue:** Content script not running
```bash
# Solution: Reload extension
# 1. Go to chrome://extensions/
# 2. Click reload button on extension
# 3. Refresh the webpage
```

**Issue:** Side panel blank
```bash
# Solution: Check console for errors
# 1. Right-click in side panel
# 2. Select "Inspect"
# 3. Check Console tab for errors
```

**Issue:** Backend not reachable
```bash
# Solution: Verify backend is running
docker-compose ps
docker-compose logs backend

# Restart if needed
docker-compose restart backend
```

### Database Issues

**Issue:** No data in database
```bash
# Solution: Check if visits are being created
docker-compose logs backend | grep POST

# Manually create a test visit
curl -X POST http://localhost:8000/api/visits \
  -H "Content-Type: application/json" \
  -d '{"url":"https://test.com","link_count":1,"word_count":1,"image_count":1}'
```

**Issue:** Database connection failed
```bash
# Solution: Restart PostgreSQL
docker-compose restart postgres

# Wait for it to be healthy
docker-compose ps
```

## Performance Testing

### Load Testing
1. Visit 10 different websites
2. Verify all data is captured
3. Check database size
4. Verify no memory leaks

### Stress Testing
1. Visit a page with 1000+ links
2. Verify extension handles it gracefully
3. Check response time in side panel

### Edge Cases
- [ ] Test on pages with no links
- [ ] Test on pages with no images
- [ ] Test on pages with minimal text
- [ ] Test on non-HTML pages (PDFs, etc.)
- [ ] Test on localhost pages
- [ ] Test on chrome:// pages (should handle gracefully)

## Success Criteria

All tests pass when:
1. ✅ Backend API responds to all endpoints
2. ✅ Extension loads without errors
3. ✅ Content script captures metrics correctly
4. ✅ Data persists in PostgreSQL
5. ✅ Side panel UI displays beautifully
6. ✅ History timeline shows past visits
7. ✅ Refresh functionality works
8. ✅ No console errors
9. ✅ Works on target websites (UHC, Aetna)
10. ✅ Docker containers run reliably

## Test Report Template

Use this template to document your testing:

```
Test Date: [DATE]
Tester: [NAME]
Environment: [macOS/Windows/Linux]
Chrome Version: [VERSION]

Backend Tests:
- Health Check: [PASS/FAIL]
- Create Visit: [PASS/FAIL]
- Get Visits: [PASS/FAIL]
- Database Persistence: [PASS/FAIL]

Extension Tests:
- Load Extension: [PASS/FAIL]
- Content Script: [PASS/FAIL]
- Side Panel UI: [PASS/FAIL]
- Metrics Capture: [PASS/FAIL]
- History Display: [PASS/FAIL]
- Refresh Button: [PASS/FAIL]

Website Tests:
- UHCprovider.com: [PASS/FAIL]
- Aetna.com: [PASS/FAIL]

Issues Found:
[List any issues]

Notes:
[Additional observations]
```

## Next Steps

After completing all tests:
1. Document any issues found
2. Fix critical bugs
3. Optimize performance if needed
4. Prepare for code review discussion