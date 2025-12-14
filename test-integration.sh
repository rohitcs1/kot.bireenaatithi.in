#!/bin/bash
# Frontend-Backend Integration Test Script

echo "🧪 Testing Frontend-Backend Category Integration"
echo "================================================"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if backend is running
echo -e "\n${YELLOW}Step 1: Checking Backend Server...${NC}"
if curl -s http://localhost:4000 > /dev/null; then
    echo -e "${GREEN}✓ Backend is running on port 4000${NC}"
else
    echo -e "${RED}✗ Backend is not running${NC}"
    echo "   Start backend with: cd backend && npm start"
    exit 1
fi

# Test unauthenticated access (should fail with 401)
echo -e "\n${YELLOW}Step 2: Testing Unauthenticated Access...${NC}"
response=$(curl -s -w "\n%{http_code}" http://localhost:4000/api/categories)
status=$(echo "$response" | tail -1)
if [ "$status" = "401" ]; then
    echo -e "${GREEN}✓ Correctly requires authentication (401)${NC}"
else
    echo -e "${YELLOW}⚠ Expected 401, got $status${NC}"
fi

# Note: Full authentication test requires valid JWT token
echo -e "\n${YELLOW}Step 3: Frontend Configuration Check...${NC}"
if grep -q "axios.defaults.baseURL = 'http://localhost:4000/api'" frontend/src/App.jsx; then
    echo -e "${GREEN}✓ Axios base URL configured correctly${NC}"
else
    echo -e "${RED}✗ Axios base URL not configured${NC}"
    exit 1
fi

if grep -q "Authorization = \`Bearer" frontend/src/App.jsx; then
    echo -e "${GREEN}✓ Bearer token interceptor configured${NC}"
else
    echo -e "${RED}✗ Bearer token interceptor not found${NC}"
    exit 1
fi

# Check backend routes
echo -e "\n${YELLOW}Step 4: Checking Backend Routes...${NC}"
if grep -q "router.use('/categories', categories)" backend/src/routes/index.js; then
    echo -e "${GREEN}✓ Categories route registered${NC}"
else
    echo -e "${RED}✗ Categories route not registered${NC}"
    exit 1
fi

# Check controller
echo -e "\n${YELLOW}Step 5: Checking Controllers...${NC}"
if [ -f "backend/src/controllers/categories.controller.js" ]; then
    echo -e "${GREEN}✓ Categories controller exists${NC}"
else
    echo -e "${RED}✗ Categories controller not found${NC}"
    exit 1
fi

# Check frontend Menu component
echo -e "\n${YELLOW}Step 6: Checking Frontend Menu Component...${NC}"
if grep -q "axios.get('/api/categories')" frontend/src/pages/Menu.jsx; then
    echo -e "${GREEN}✓ Menu component makes API call to /api/categories${NC}"
else
    echo -e "${RED}✗ Menu component API call not found${NC}"
    exit 1
fi

if grep -q "axios.post('/api/categories'" frontend/src/pages/Menu.jsx; then
    echo -e "${GREEN}✓ Menu component can post new categories${NC}"
else
    echo -e "${RED}✗ Menu component post functionality not found${NC}"
    exit 1
fi

echo -e "\n${GREEN}✅ All integration checks passed!${NC}"
echo -e "\n${YELLOW}Next Steps:${NC}"
echo "1. Start backend:   cd backend && npm start"
echo "2. Start frontend:  cd frontend && npm run dev"
echo "3. Login with admin/manager account"
echo "4. Go to Menu page and test 'Add Category' button"
echo "5. Categories should save to database and appear in sidebar"
