import { Link } from 'react-router-dom';
import { Zap, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-6">
      <div className="w-16 h-16 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center mb-6">
        <Zap size={30} className="text-brand-400" />
      </div>
      <h1 className="font-display text-8xl font-bold text-white/10 mb-2">404</h1>
      <h2 className="font-display text-2xl font-bold text-white mb-3">Page not found</h2>
      <p className="text-slate-400 mb-8 max-w-sm">The page you're looking for doesn't exist or has been moved.</p>
      <Link to="/app/dashboard" className="btn-primary inline-flex items-center gap-2">
        <Home size={16} /> Back to Dashboard
      </Link>
    </div>
  );
}
