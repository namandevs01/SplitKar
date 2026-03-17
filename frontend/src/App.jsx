import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useEffect } from 'react';
import { SocketProvider } from './context/SocketContext';
import useAuthStore from './context/authStore';
import ProtectedRoute from './components/auth/ProtectedRoute';
import AppLayout from './components/dashboard/AppLayout';

// Pages
import Landing from './pages/Landing';
import NotFound from './pages/NotFound';
import Login from './pages/Login';
import Register from './pages/Register';
import OAuthCallback from './pages/OAuthCallback';
import Dashboard from './pages/Dashboard';
import Groups from './pages/Groups';
import GroupDetail from './pages/GroupDetail';
import Expenses from './pages/Expenses';
import Settlements from './pages/Settlements';
import Notifications from './pages/Notifications';
import Settings from './pages/Settings';

export default function App() {
  const { fetchMe } = useAuthStore();

  useEffect(() => { fetchMe(); }, []);

  return (
    <BrowserRouter>
      <SocketProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            style: { background: '#1a2234', color: '#f1f5f9', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px' },
            success: { iconTheme: { primary: '#22c55e', secondary: '#0a0f1e' } },
            error: { iconTheme: { primary: '#ef4444', secondary: '#0a0f1e' } },
          }}
        />

        <Routes>
          {/* Landing */}
          <Route path="/" element={<Landing />} />

          {/* Auth */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/auth/callback" element={<OAuthCallback />} />

          {/* Protected app */}
          <Route path="/app" element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="/app/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="groups" element={<Groups />} />
            <Route path="groups/:id" element={<GroupDetail />} />
            <Route path="expenses" element={<Expenses />} />
            <Route path="settlements" element={<Settlements />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="settings" element={<Settings />} />
          </Route>

          {/* Legacy /dashboard redirect */}
          <Route path="/dashboard" element={<Navigate to="/app/dashboard" replace />} />
          <Route path="/groups" element={<Navigate to="/app/groups" replace />} />

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </SocketProvider>
    </BrowserRouter>
  );
}
