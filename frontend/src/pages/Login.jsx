import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Mail, Lock, Phone, ArrowRight, Zap } from 'lucide-react';
import api from '../services/api';
import useAuthStore from '../context/authStore';

const TAB = { EMAIL: 'email', PHONE: 'phone' };

export default function Login() {
  const [tab, setTab] = useState(TAB.EMAIL);
  const [showPwd, setShowPwd] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, getValues, formState: { errors } } = useForm();
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  const onEmailLogin = async (data) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/login', data);
      setAuth(res.data.user, res.data.token);
      toast.success('Welcome back! 👋');
      navigate('/app/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally { setLoading(false); }
  };

  const onSendOtp = async () => {
    const phone = getValues('phone');
    if (!phone || phone.length < 10) return toast.error('Enter a valid phone number');
    setLoading(true);
    try {
      await api.post('/auth/send-otp', { phone });
      setOtpSent(true);
      toast.success('OTP sent!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send OTP');
    } finally { setLoading(false); }
  };

  const onVerifyOtp = async (data) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/verify-otp', { phone: data.phone, otp: data.otp });
      setAuth(res.data.user, res.data.token);
      toast.success('Logged in!');
      navigate('/app/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid OTP');
    } finally { setLoading(false); }
  };

  const onGoogleLogin = () => { window.location.href = '/api/auth/google'; };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl bg-brand-500 flex items-center justify-center">
              <Zap size={22} className="text-white" />
            </div>
            <span className="font-display text-2xl font-bold text-white">SplitKar</span>
          </div>
          <h1 className="text-3xl font-display font-bold text-white mb-1">Welcome back</h1>
          <p className="text-slate-400">Sign in to manage your shared expenses</p>
        </div>

        <div className="card p-6 animate-slide-up">
          {/* Tabs */}
          <div className="flex bg-white/5 rounded-xl p-1 mb-6">
            {[{ id: TAB.EMAIL, label: 'Email', Icon: Mail }, { id: TAB.PHONE, label: 'Phone', Icon: Phone }].map(({ id, label, Icon }) => (
              <button key={id} onClick={() => setTab(id)}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all
                  ${tab === id ? 'bg-brand-500 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>
                <Icon size={15} />{label}
              </button>
            ))}
          </div>

          {/* Email Login */}
          {tab === TAB.EMAIL && (
            <form onSubmit={handleSubmit(onEmailLogin)} className="space-y-4">
              <div>
                <label className="label">Email address</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-3.5 text-slate-500" />
                  <input className="input pl-10" placeholder="you@example.com"
                    {...register('email', { required: true, pattern: /^\S+@\S+$/i })} />
                </div>
                {errors.email && <p className="text-red-400 text-xs mt-1">Valid email required</p>}
              </div>
              <div>
                <div className="flex justify-between mb-1.5">
                  <label className="label mb-0">Password</label>
                  <Link to="/forgot-password" className="text-xs text-brand-400 hover:text-brand-300">Forgot?</Link>
                </div>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-3.5 text-slate-500" />
                  <input className="input pl-10 pr-10" type={showPwd ? 'text' : 'password'} placeholder="••••••••"
                    {...register('password', { required: true, minLength: 6 })} />
                  <button type="button" onClick={() => setShowPwd(!showPwd)}
                    className="absolute right-3.5 top-3.5 text-slate-500 hover:text-white">
                    {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && <p className="text-red-400 text-xs mt-1">Password required (min 6 chars)</p>}
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 mt-2">
                {loading ? <span className="animate-pulse">Signing in...</span> : <><span>Sign in</span><ArrowRight size={16} /></>}
              </button>
            </form>
          )}

          {/* Phone OTP Login */}
          {tab === TAB.PHONE && (
            <form onSubmit={handleSubmit(onVerifyOtp)} className="space-y-4">
              <div>
                <label className="label">Phone number</label>
                <div className="flex gap-2">
                  <span className="input w-14 text-center shrink-0 text-slate-400">+91</span>
                  <input className="input" placeholder="9876543210" type="tel"
                    {...register('phone', { required: true, minLength: 10 })} />
                </div>
              </div>
              {otpSent && (
                <div>
                  <label className="label">Enter OTP</label>
                  <input className="input tracking-widest text-center text-lg font-mono" placeholder="••••••" maxLength={6}
                    {...register('otp', { required: otpSent })} />
                </div>
              )}
              {!otpSent ? (
                <button type="button" onClick={onSendOtp} disabled={loading} className="btn-primary w-full">
                  {loading ? 'Sending...' : 'Send OTP'}
                </button>
              ) : (
                <button type="submit" disabled={loading} className="btn-primary w-full">
                  {loading ? 'Verifying...' : 'Verify & Login'}
                </button>
              )}
            </form>
          )}

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-slate-500 text-xs">or continue with</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          {/* Google */}
          <button onClick={onGoogleLogin} className="btn-secondary w-full flex items-center justify-center gap-3">
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span>Google</span>
          </button>
        </div>

        <p className="text-center text-slate-400 text-sm mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="text-brand-400 hover:text-brand-300 font-medium">Sign up</Link>
        </p>
      </div>
    </div>
  );
}
