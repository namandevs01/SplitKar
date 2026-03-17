import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Zap } from 'lucide-react';
import useAuthStore from '../context/authStore';

export default function OAuthCallback() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { fetchMe } = useAuthStore();

  useEffect(() => {
    const token = params.get('token');
    if (token) {
      localStorage.setItem('sk_token', token);
      fetchMe().then(() => navigate('/app/dashboard'));
    } else {
      navigate('/login?error=oauth_failed');
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <div className="w-12 h-12 rounded-xl bg-brand-500 flex items-center justify-center animate-pulse-soft">
        <Zap size={26} className="text-white" />
      </div>
      <p className="text-slate-400 animate-pulse">Signing you in...</p>
    </div>
  );
}
