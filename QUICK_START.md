# 🚀 Quick Start - Category Management

## ⚡ 30-Second Setup

### Terminal 1: Start Backend
```bash
cd backend
npm start
# ✓ Server listening on port 4000
```

### Terminal 2: Start Frontend
```bash
cd frontend
npm run dev
# ✓ Local: http://localhost:5173
```

---

## 🧪 Test It (1 Minute)

1. **Open browser**: http://localhost:5173
2. **Login** as admin or manager (your hotel credentials)
3. **Click**: Menu in sidebar
4. **Click**: **+** button next to "Categories"
5. **Type**: Category name (e.g., "Appetizers")
6. **Click**: "Add Category"
7. **See**: New category appears in sidebar + dropdown ✅

---

## 📊 What's Working

| Feature | Frontend | Backend | Database | Status |
|---------|----------|---------|----------|--------|
| View Categories | ✓ | ✓ | ✓ | ✅ |
| Add Category | ✓ | ✓ | ✓ | ✅ |
| Edit Category | ✓ | ✓ | ✓ | ✅ |
| Delete Category | ✓ | ✓ | ✓ | ✅ |
| Category Dropdown | ✓ | - | ✓ | ✅ |
| Multi-Hotel Support | ✓ | ✓ | ✓ | ✅ |
| Role-Based Access | ✓ | ✓ | - | ✅ |

---

## 🔌 How Data Flows

```
Frontend              Backend              Database
(React)              (Express)            (Supabase)
   
Menu.jsx  ────→  GET /api/categories  ────→  menu_categories
   ↓ (Bearer Token)         ↓                      ↓
Add Category Modal   Validate JWT      SELECT * FROM menu_categories
   ↓                  Check hotel_id    WHERE hotel_id = ?
POST Request      ────→  Controller  ────→  INSERT INTO menu_categories
   ↓                         ↓                    ↓
Update Sidebar       Return data          Data saved ✓
```

---

## ✨ Features

- ✅ Real-time category list from database
- ✅ Add unlimited categories
- ✅ Categories scoped by hotel
- ✅ Role-based permissions (admin/manager only)
- ✅ JWT authentication
- ✅ Form validation
- ✅ Error handling
- ✅ Auto token refresh on 401

---

## 📁 Key Files

**Backend**:
- `backend/src/controllers/categories.controller.js` - Category operations
- `backend/src/routes/categories.js` - API endpoints
- `backend/src/middleware/auth.middleware.js` - JWT validation

**Frontend**:
- `frontend/src/pages/Menu.jsx` - UI & API calls
- `frontend/src/App.jsx` - Axios configuration
- `frontend/.env` - API URL configuration

**Database**:
- `menu_categories` table - Stores categories
- Auto-scoped by `hotel_id`

---

## 🔒 Security

- ✅ Bearer token required
- ✅ Hotel-level isolation
- ✅ Admin/manager only write access
- ✅ CORS enabled
- ✅ 401 auto-redirect on token expiry

---

## 🐛 Troubleshooting

**Categories not showing?**
- Check backend is running: `http://localhost:4000`
- Check token in browser: `localStorage.getItem('token')`
- Check browser console for errors

**Can't add category?**
- Must be logged in as admin or manager
- Check Network tab in DevTools for API response

**CORS errors?**
- Ensure frontend URL matches: `http://localhost:5173`
- Backend CORS is already enabled

---

## 🎯 You're All Set! 

Frontend and backend are connected. Categories save to database and load from database.

**Next**: Test adding categories and using them in menu items!
