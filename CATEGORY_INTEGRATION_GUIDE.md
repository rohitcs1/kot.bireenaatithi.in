## Frontend-Backend Integration Guide - Categories Feature

### ✅ What's Been Set Up

#### Backend Setup (Complete)
1. **Database Table**: `menu_categories` (already exists in schema)
   - Fields: id, hotel_id, name, created_at
   - Automatically scoped by hotel_id

2. **API Controllers**: `/backend/src/controllers/categories.controller.js`
   - listCategories() - GET all categories
   - createCategory() - POST new category
   - updateCategory() - PUT to update
   - deleteCategory() - DELETE category

3. **API Routes**: `/backend/src/routes/categories.js`
   - GET /api/categories - List categories
   - POST /api/categories - Add category (admin/manager only)
   - PUT /api/categories/:id - Update category
   - DELETE /api/categories/:id - Delete category

4. **Route Registration**: Routes registered in `/backend/src/routes/index.js`

#### Frontend Setup (Complete)
1. **Menu Component**: `/frontend/src/pages/Menu.jsx`
   - Fetches categories from API on component mount
   - "Add Category" button with + icon in sidebar
   - Modal form to add new categories
   - Category dropdown automatically populated from database
   - Real-time category list updates

2. **Axios Configuration**: `/frontend/src/App.jsx`
   - Axios configured with base URL: `http://localhost:4000/api`
   - Bearer token automatically attached to all requests
   - 401 error handling (redirects to login)

### 🚀 How to Test

#### Step 1: Start Backend
```bash
cd backend
npm start
# Server will listen on port 4000
```

#### Step 2: Start Frontend
```bash
cd frontend
npm run dev
# Frontend will be on http://localhost:5173
```

#### Step 3: Test Categories Feature

1. **Login as Admin/Manager** (required to add categories)
   - Email: admin@example.com
   - Password: (password set in database)

2. **Go to Menu Page**
   - Click "Menu" in sidebar

3. **Add a New Category**
   - Click the **+** icon next to "Categories" heading
   - Enter category name (e.g., "Appetizers", "Soups", "Salads")
   - Click "Add Category"
   - Category appears in sidebar list immediately

4. **Use Category in Menu Item**
   - Click "Add Item" button
   - Fill in item details
   - Select category from dropdown (now populated from database!)
   - Save item

### 📊 API Endpoints Reference

All endpoints require authentication with Bearer token

#### List Categories
```
GET /api/categories
Headers: Authorization: Bearer <token>
Response: { categories: [{id, hotel_id, name, created_at}, ...] }
```

#### Add Category
```
POST /api/categories
Headers: Authorization: Bearer <token>
Body: { name: "Category Name" }
Response: { category: {id, hotel_id, name, created_at} }
```

#### Update Category
```
PUT /api/categories/:id
Headers: Authorization: Bearer <token>
Body: { name: "New Name" }
Response: { category: {id, hotel_id, name, created_at} }
```

#### Delete Category
```
DELETE /api/categories/:id
Headers: Authorization: Bearer <token>
Response: { ok: true }
```

### 🔐 Security Features

- ✅ JWT Bearer token authentication
- ✅ Hotel-level data scoping (categories only visible to their hotel)
- ✅ Role-based access control (admin/manager can add/edit, others can only view)
- ✅ Automatic 401 redirect to login if token expires
- ✅ Token stored securely in localStorage (development)

### 📝 Frontend Flow

1. App.jsx loads and configures axios
   - Sets base URL
   - Adds Bearer token interceptor
   - Sets up 401 error handling

2. User logs in → token saved to localStorage

3. Menu.jsx component mounts
   - useEffect triggers fetchCategories()
   - Calls GET /api/categories with Bearer token
   - Categories populate in sidebar

4. User clicks "Add Category"
   - Modal opens with form
   - User enters name and clicks "Add"
   - POST /api/categories sent with Bearer token
   - Frontend refetches categories
   - New category appears immediately in sidebar and dropdown

### 🛠️ Troubleshooting

**Issue**: Categories not showing up
- Check browser console for errors
- Verify token is present: `localStorage.getItem('token')`
- Ensure user is logged in as admin/manager
- Check backend console for 401/403 errors

**Issue**: Can't add category
- Verify user role is admin or manager
- Check if token is valid
- Look for 400/422 error for invalid category name

**Issue**: CORS errors
- Backend CORS is enabled in `/backend/src/index.js`
- Verify frontend API URL matches backend (localhost:4000)

### 📦 Package Requirements

Frontend dependencies already installed:
- axios (for HTTP requests)
- react (for component)
- react-router-dom (for navigation)

### ✨ Features Implemented

- ✅ Fetch categories from database on component load
- ✅ Display categories in sidebar
- ✅ Add new categories via modal form
- ✅ Validation and error handling
- ✅ Real-time UI updates
- ✅ Dynamic category dropdown in menu item form
- ✅ Bearer token authentication
- ✅ Hotel-scoped data
- ✅ Role-based permissions
