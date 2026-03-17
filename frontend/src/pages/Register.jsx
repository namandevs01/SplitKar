import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Mail, Lock, User, Phone, Zap, ArrowRight } from 'lucide-react';
import api from '../services/api';
import useAuthStore from '../context/authStore';

export default function Register() {
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors }, watch } = useForm();
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/register', {
        name: data.name, email: data.email,
        password: data.password, phone: data.phone || undefined,
      });
      setAuth(res.data.user, res.data.token);
      toast.success('Account created! Welcome to SplitKar 🎉');
      navigate('/app/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl bg-brand-500 flex items-center justify-center">
              <Zap size={22} className="text-white" />
            </div>
            <span className="font-display text-2xl font-bold text-white">SplitKar</span>
          </div>
          <h1 className="text-3xl font-display font-bold text-white mb-1">Create account</h1>
          <p className="text-slate-400">Start splitting expenses fairly with your group</p>
        </div>

        <div className="card p-6 animate-slide-up">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="label">Full name</label>
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-3.5 text-slate-500" />
                <input className="input pl-10" placeholder="Rahul Sharma"
                  {...register('name', { required: 'Name is required', minLength: { value: 2, message: 'Too short' } })} />
              </div>
              {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
            </div>

            <div>
              <label className="label">Email address</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-3.5 text-slate-500" />
                <input className="input pl-10" placeholder="rahul@example.com" type="email"
                  {...register('email', { required: 'Email is required', pattern: { value: /^\S+@\S+$/i, message: 'Invalid email' } })} />
              </div>
              {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="label">Phone <span className="text-slate-600 font-normal">(optional)</span></label>
              <div className="flex gap-2">
                <span className="input w-14 text-center shrink-0 text-slate-400 cursor-default">+91</span>
                <input className="input" placeholder="9876543210" type="tel"
                  {...register('phone', { minLength: { value: 10, message: 'Enter 10 digits' }, maxLength: 10 })} />
              </div>
              {errors.phone && <p className="text-red-400 text-xs mt-1">{errors.phone.message}</p>}
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-3.5 text-slate-500" />
                <input className="input pl-10 pr-10" type={showPwd ? 'text' : 'password'} placeholder="Min 6 characters"
                  {...register('password', { required: 'Password is required', minLength: { value: 6, message: 'Min 6 characters' } })} />
                <button type="button" onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3.5 top-3.5 text-slate-500 hover:text-white">
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
            </div>

            <div>
              <label className="label">Confirm password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-3.5 text-slate-500" />
                <input className="input pl-10" type="password" placeholder="Repeat password"
                  {...register('confirmPassword', {
                    required: 'Please confirm your password',
                    validate: (v) => v === watch('password') || 'Passwords do not match',
                  })} />
              </div>
              {errors.confirmPassword && <p className="text-red-400 text-xs mt-1">{errors.confirmPassword.message}</p>}
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 mt-2">
              {loading ? <span className="animate-pulse">Creating account...</span> : <><span>Create account</span><ArrowRight size={16} /></>}
            </button>
          </form>

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-slate-500 text-xs">or</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          <button onClick={() => window.location.href = '/api/auth/google'} className="btn-secondary w-full flex items-center justify-center gap-3">
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>
        </div>

        <p className="text-center text-slate-400 text-sm mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-brand-400 hover:text-brand-300 font-medium">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
