import { Navigate } from 'react-router-dom';
import useAuthStore from '../../context/authStore';
import { Zap } from 'lucide-react';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuthStore();
  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <div className="w-12 h-12 rounded-xl bg-brand-500 flex items-center justify-center animate-pulse-soft">
        <Zap size={26} className="text-white" />
      </div>
      <p className="text-slate-500 text-sm animate-pulse">Loading...</p>
    </div>
  );
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}
