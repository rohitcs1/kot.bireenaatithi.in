import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import { Provider, useSelector, useDispatch } from 'react-redux';
import axios from 'axios';
import { store } from './redux/store';
import { loginSuccess } from './redux/authSlice';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import ProtectedRoute from './components/ProtectedRoute';
import Loader from './components/Loader';
import { OrderProvider } from './context/OrderContext';
import { NotificationProvider } from './context/NotificationContext';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import SuperadminLogin from './pages/SuperadminLogin';
import SuperadminDashboard from './pages/SuperadminDashboard';
import HotelsManagement from './pages/HotelsManagement';
import CreateHotel from './pages/CreateHotel';
import HotelDetails from './pages/HotelDetails';
import SubscriptionManagement from './pages/SubscriptionManagement';
import SuperadminSettings from './pages/SuperadminSettings';
import AllUsers from './pages/AllUsers';
import SuperadminProtectedRoute from './components/SuperadminProtectedRoute';
import Tables from './pages/Tables';
import Menu from './pages/Menu';
import POS from './pages/POS';
import Kitchen from './pages/Kitchen';
import OrderDetails from './pages/OrderDetails';
import Billing from './pages/Billing';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Notifications from './pages/Notifications';
import OfflineSync from './pages/OfflineSync';

const OrderDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  return (
    <OrderDetails
      orderId={id || '1'}
      isOpen={true}
      onClose={() => navigate(-1)}
    />
  );
};

const MainLayout = ({ children }) => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // On desktop, sidebar should always be open
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(true);
      }
    };
    
    // Set initial state based on screen size
    handleResize();
    window.addEventListener('resize', handleResize);
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getActiveRoute = () => {
    const path = location.pathname;
    if (path.startsWith('/dashboard')) return 'dashboard';
    if (path.startsWith('/tables')) return 'tables';
    if (path.startsWith('/menu')) return 'menu';
    if (path.startsWith('/pos')) return 'pos';
    if (path.startsWith('/kds')) return 'kitchen';
    if (path.startsWith('/billing')) return 'billing';
    if (path.startsWith('/reports')) return 'reports';
    if (path.startsWith('/settings')) return 'settings';
    return '';
  };

  const handleMenuToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleSidebarCollapse = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header onMenuToggle={handleMenuToggle} />
      <div className="flex flex-1 overflow-hidden main-layout-container">
        <Sidebar
          activeItem={getActiveRoute()}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          collapsed={sidebarCollapsed}
          onCollapse={handleSidebarCollapse}
        />
        <main className={`main-content-area flex-1 overflow-y-auto ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`} style={{ backgroundColor: 'transparent' }}>
          <div className="page-content-wrapper">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

// Helper function to get role-based redirect path
const getRoleRedirect = (role) => {
  if (!role) return '/login';
  const r = String(role).toLowerCase();
  if (r === 'admin' || r === 'manager') return '/dashboard';
  if (r === 'waiter') return '/pos';
  if (r === 'kitchen') return '/kds';
  return '/dashboard';
};

const AppRoutes = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isAuthenticated, loading, user } = useSelector((state) => state.auth);

  // Configure axios with Bearer token interceptor
  useEffect(() => {
    // Set API base URL
    axios.defaults.baseURL = 'http://localhost:4000/api';

    // Add Bearer token to all requests
    const interceptor = axios.interceptors.request.use((config) => {
      // Read the persistent token key used by the app
      const token = localStorage.getItem('kot-token') || localStorage.getItem('token') || sessionStorage.getItem('kot-token') || sessionStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    }, (error) => {
      return Promise.reject(error);
    });

    // Handle 401 responses by redirecting to login
    const responseInterceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('kot-user');
          localStorage.removeItem('kot-token');
          navigate('/login');
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.request.eject(interceptor);
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, [navigate]);

  useEffect(() => {
    const storedUser = localStorage.getItem('kot-user');
    const storedToken = localStorage.getItem('kot-token');
    
    if (storedUser && storedToken && !isAuthenticated) {
      try {
        const user = JSON.parse(storedUser);
        dispatch(loginSuccess(user));
      } catch (error) {
        console.error('Error loading user:', error);
        localStorage.removeItem('kot-user');
        localStorage.removeItem('kot-token');
      }
    }

    // Development-only auto-login: seed a mock user so ProtectedRoute allows access
    // This makes the app fully front-end runnable without a backend during development.
    // DISABLED: Commented out to show login page by default
    // if (process.env.NODE_ENV === 'development' && !storedUser && !isAuthenticated) {
    //   const mockUser = {
    //     id: 999,
    //     name: 'Dev Admin',
    //     email: 'dev@local',
    //     role: 'Admin',
    //     avatar: 'D',
    //     token: 'dev-token-' + Date.now(),
    //     loginTime: new Date().toISOString()
    //   };
    //   try {
    //     localStorage.setItem('kot-user', JSON.stringify(mockUser));
    //     localStorage.setItem('kot-token', mockUser.token);
    //     dispatch(loginSuccess(mockUser));
    //   } catch (err) {
    //     console.error('Dev auto-login failed:', err);
    //   }
    // }
  }, [dispatch, isAuthenticated]);

  if (loading) {
    return <Loader fullScreen />;
  }

  return (
    <Routes>
      {/* Superadmin area routes */}
      <Route path="/superadmin/login" element={<SuperadminLogin />} />
      <Route path="/superadmin/dashboard" element={<SuperadminProtectedRoute><SuperadminDashboard /></SuperadminProtectedRoute>} />
      <Route path="/superadmin/hotels" element={<SuperadminProtectedRoute><HotelsManagement /></SuperadminProtectedRoute>} />
      <Route path="/superadmin/hotels/create" element={<SuperadminProtectedRoute><CreateHotel /></SuperadminProtectedRoute>} />
      <Route path="/superadmin/hotels/:id" element={<SuperadminProtectedRoute><HotelDetails /></SuperadminProtectedRoute>} />
      <Route path="/superadmin/users" element={<SuperadminProtectedRoute><AllUsers /></SuperadminProtectedRoute>} />
      <Route path="/superadmin/subscriptions" element={<SuperadminProtectedRoute><SubscriptionManagement /></SuperadminProtectedRoute>} />
      <Route path="/superadmin/settings" element={<SuperadminProtectedRoute><SuperadminSettings /></SuperadminProtectedRoute>} />

      {/* Default route - redirect to login */}
      <Route
        path="/"
        element={<Navigate to="/login" replace />}
      />

      {/* Login route - redirect logged-in users to their role homepage */}
      <Route
        path="/login"
        element={
          isAuthenticated && user ? (
            <Navigate to={getRoleRedirect(user.role)} replace />
          ) : (
            <Login />
          )
        }
      />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <MainLayout>
              <Dashboard />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/tables"
        element={
          <ProtectedRoute>
            <MainLayout>
              <Tables />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/menu"
        element={
          <ProtectedRoute>
            <MainLayout>
              <Menu />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/pos"
        element={
          <ProtectedRoute>
            <MainLayout>
              <POS />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/kds"
        element={
          <ProtectedRoute>
            <MainLayout>
              <Kitchen />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/order-details/:id?"
        element={
          <ProtectedRoute>
            <MainLayout>
              <OrderDetailsPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/billing"
        element={
          <ProtectedRoute>
            <MainLayout>
              <Billing />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/reports"
        element={
          <ProtectedRoute>
            <MainLayout>
              <Reports />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <MainLayout>
              <Settings />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/notifications"
        element={
          <ProtectedRoute>
            <MainLayout>
              <Notifications />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/offline"
        element={
          <ProtectedRoute>
            <MainLayout>
              <OfflineSync />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="*"
        element={
          <ProtectedRoute>
            <MainLayout>
              <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                  <h1 className="text-4xl font-bold text-gray-800 mb-4">404</h1>
                  <p className="text-gray-600 mb-4">Page not found</p>
                  <button
                    onClick={() => navigate(-1)}
                    className="btn btn-primary"
                  >
                    Go Back
                  </button>
                </div>
              </div>
            </MainLayout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};

const AppContent = () => {
  return <AppRoutes />;
};

const App = () => {
  return (
    <Provider store={store}>
      <OrderProvider>
        <NotificationProvider>
          <AppContent />
        </NotificationProvider>
      </OrderProvider>
    </Provider>
  );
};

export default App;
