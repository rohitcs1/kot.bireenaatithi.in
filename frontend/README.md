# KOT System - Restaurant POS Frontend

A modern, responsive Point-of-Sale (POS) system for restaurants built with React, Redux Toolkit, and Tailwind CSS.

## Features

- **Dashboard**: Real-time stats (sales, active tables, pending orders, kitchen time)
- **Sales Trend Chart**: 7-day visual analytics placeholder
- **Recent Orders Table**: Live order tracking with status indicators
- **Responsive Layout**: Desktop sidebar, mobile overlay navigation
- **Order Management**: Tables, Menu, POS, Kitchen, Order Details, Billing
- **Authentication**: Mock login with role-based access (Waiter, Kitchen, Admin)
- **Offline Support**: Local queue for offline order syncing
- **Notifications**: Real-time notification center
- **Reports**: Sales and performance analytics
- **Settings**: System configuration

## Tech Stack

- **Frontend**: React 18, React Router v6
- **State Management**: Redux Toolkit
- **Styling**: Tailwind CSS + Custom CSS
- **Build Tool**: Vite
- **HTTP Client**: Axios
- **Development**: Node.js

## Project Structure

```
frontend/
├── src/
│   ├── pages/           # Page components (Dashboard, Login, Tables, POS, etc.)
│   ├── components/      # Reusable components (Header, Sidebar, Modal, etc.)
│   ├── context/         # React Context (Auth, Order, Notification)
│   ├── redux/           # Redux slices (auth, menu, orders)
│   ├── hooks/           # Custom hooks (useFetch, useLocalQueue, useOnlineStatus)
│   ├── styles/          # Global & page-specific CSS
│   ├── utils/           # Helper functions & constants
│   ├── App.jsx          # Main app component with routing
│   └── index.jsx        # React entry point
├── public/              # Static assets
├── package.json         # Dependencies
├── vite.config.js       # Vite configuration
└── README.md            # This file
```

## Installation

### Prerequisites
- Node.js (v16+)
- npm or yarn

### Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/kot-system.git
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to:
```
http://localhost:5173/
```

## Development

### Available Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Key Features for Development

- **Dev Auto-Login**: In development mode, a mock user is automatically logged in, enabling frontend-only testing without a backend.
- **Mock Data**: All pages use mock data from constants. Replace with API calls when backend is ready.
- **Tailwind CSS**: Use Tailwind utility classes for styling. Custom CSS files are available for page-specific styles.

### File Naming Convention

- **Pages**: `src/pages/PageName.jsx` with `src/pages/PageName.css` for styles
- **Components**: `src/components/ComponentName.jsx`
- **Contexts**: `src/context/ContextName.jsx`
- **Redux Slices**: `src/redux/featureSlice.js`
- **Hooks**: `src/hooks/useHookName.js`

## Authentication

### Mock Login
- **Default Email**: any valid email (e.g., `admin@kot.com`)
- **Default Password**: any string (min 6 chars, e.g., `password123`)
- **Roles**: Waiter, Kitchen, Admin

### Development Mode
- Automatic login as "Dev Admin" with Admin role
- Token stored in `localStorage` as `kot-token`
- User data stored in `localStorage` as `kot-user`

## API Integration

Replace mock API calls with real endpoints:

### Example Mock Call (to replace)
```javascript
// src/pages/Dashboard.jsx
const fetchDashboardData = async () => {
  // MOCK - Replace with: const response = await fetch('/api/dashboard/stats');
};
```

### API Base URL
When backend is ready, set `API_URL` in `.env`:
```
VITE_API_URL=http://localhost:3000/api
```

Then use in code:
```javascript
const API_URL = import.meta.env.VITE_API_URL;
```

## Responsive Design

- **Mobile** (< 640px): Sidebar as overlay, single-column layout
- **Tablet** (640px - 1024px): Narrower sidebar, 2-column grid
- **Desktop** (1024px+): Full sidebar, 3+ column grid, collapsible sidebar

### Sidebar Collapse (Desktop)
Click the collapse button (next to title) to toggle sidebar width. Sidebar hides labels when collapsed.

## Styling

### Tailwind CSS
Use Tailwind utility classes for most styling:
```jsx
<div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
  Content
</div>
```

### Custom CSS Files
Page-specific styles in separate CSS files:
- `src/styles/global.css` - Global styles
- `src/styles/pages.css` - Page-level utilities
- `src/pages/Dashboard.css` - Dashboard page styles
- `src/pages/Login.css` - Login page styles
- `src/pages/Billing.css` - Billing page styles

## Keyboard Shortcuts

- `h + Enter` (in dev server terminal): Show Vite help
- `r`: Restart dev server
- `q`: Quit dev server

## Troubleshooting

### Dev Server Won't Start
```bash
# Clear node_modules and reinstall
rm -r node_modules
npm install
npm run dev
```

### Styles Not Loading
1. Check CSS import in component: `import './ComponentName.css';`
2. Ensure Tailwind classes are properly configured in `tailwind.config.js`
3. Clear browser cache (Ctrl+Shift+Delete or Cmd+Shift+Delete)

### Build Errors
```bash
# Check for syntax errors
npm run build

# Review error messages and fix
```

## Git Workflow

1. **Before pushing**:
```bash
# Check for uncommitted changes
git status

# Stage changes
git add .

# Commit with meaningful message
git commit -m "feat: Add dashboard chart styling"

# Push to repository
git push origin main
```

2. **Branch naming**:
   - `feature/feature-name` - New features
   - `bugfix/bug-name` - Bug fixes
   - `refactor/refactor-name` - Code refactoring

## Future Enhancements

- [ ] Backend API integration
- [ ] Real Chart.js integration (sales trends)
- [ ] Payment gateway integration
- [ ] Print receipt functionality
- [ ] Export reports to PDF/Excel
- [ ] Multi-language support
- [ ] Dark mode theme
- [ ] Advanced analytics dashboard

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit changes: `git commit -m 'Add your feature'`
4. Push to branch: `git push origin feature/your-feature`
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For issues, questions, or feature requests, please open an issue on GitHub.

---

**Last Updated**: November 16, 2025  
**Version**: 1.0.0
