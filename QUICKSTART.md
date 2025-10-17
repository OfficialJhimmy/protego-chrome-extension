# ⚡ Quick Start Guide

Get up and running in 5 minutes!

## Prerequisites Checklist

- [ ] Docker Desktop installed and **running**
- [ ] Google Chrome browser (version 100+)
- [ ] Terminal/Command line access
- [ ] Git installed

---

## Step 1: Clone & Setup (2 minutes)

```bash
# Clone the repository
git clone <your-repo-url>
cd chrome-history-sidepanel

# Run automated setup
./setup.sh
```

**What happens:**
- ✅ Builds Docker containers
- ✅ Starts PostgreSQL database
- ✅ Starts FastAPI backend
- ✅ Runs database migrations
- ✅ Verifies everything is healthy

**Expected output:** Green checkmarks and "Setup Complete!"

---

## Step 2: Load Extension (1 minute)

1. Open Chrome → `chrome://extensions/`
2. Toggle **Developer mode** ON (top-right)
3. Click **Load unpacked**
4. Select: `chrome-history-sidepanel/extension/dist/`
5. Done! ✅

---

## Step 3: Test It (2 minutes)

### Test 1: Basic Functionality
1. Visit https://www.uhcprovider.com
2. Click extension icon (puzzle piece in toolbar)
3. Select "Chrome History Sidepanel"
4. **See:** Beautiful UI with metrics! 🎉

### Test 2: Visit History
1. Refresh the page 2-3 times
2. Open side panel again
3. **See:** Timeline showing past visits! 📜

### Test 3: API Check
```bash
# Open in browser
open http://localhost:8000/docs
```
**See:** Interactive API documentation 📚

---

## Troubleshooting

### "Extension won't load"
```bash
cd extension
npm install
npm run build
# Then reload extension in Chrome
```

### "Backend not responding"
```bash
docker-compose ps  # Check if running
docker-compose up -d  # Start if not
```

### "No data showing"
```bash
# Check console (F12) for errors
# Verify backend: curl http://localhost:8000/health
```

---

## Quick Commands

```bash
# View logs
docker-compose logs -f

# Restart services
docker-compose restart

# Stop everything
docker-compose down

# Rebuild extension
cd extension && npm run build

# Run tests
./test-api.sh

# View database
docker-compose exec postgres psql -U chromeuser -d chrome_history
```

---

## What to Show Reviewers

1. **Running Services:**
   ```bash
   docker-compose ps
   ```
   Shows: Both services Up and healthy ✅

2. **API Documentation:**
   http://localhost:8000/docs
   Shows: Interactive Swagger UI 📚

3. **Extension in Action:**
   - Open side panel on any website
   - Shows: Beautiful metrics and history ✨

4. **Database Content:**
   ```bash
   docker-compose exec postgres psql -U chromeuser -d chrome_history -c "SELECT COUNT(*) FROM page_visits;"
   ```
   Shows: Number of visits tracked 📊

---

## Next Steps

- See [README.md](./README.md) for full documentation
- See [TESTING.md](./TESTING.md) for comprehensive testing
- See [ARCHITECTURE.md](./ARCHITECTURE.md) for technical details

---

**Questions? Check the main README or run `./test-api.sh` to verify everything works!**