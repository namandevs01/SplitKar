import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Receipt, CreditCard, Bell, Settings, LogOut, Zap, X, Menu } from 'lucide-react';
import useAuthStore from '../../context/authStore';

const NAV = [
  { to: '/app/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/app/groups', icon: Users, label: 'Groups' },
  { to: '/app/expenses', icon: Receipt, label: 'Expenses' },
  { to: '/app/settlements', icon: CreditCard, label: 'Settlements' },
  { to: '/app/notifications', icon: Bell, label: 'Notifications' },
  { to: '/app/settings', icon: Settings, label: 'Settings' },
];

export default function MobileNav({ unreadCount = 0 }) {
  const [open, setOpen] = useState(false);
  const { user, logout } = useNavigate ? { user: useAuthStore((s) => s.user), logout: useAuthStore((s) => s.logout) } : {};
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); setOpen(false); };
  const initials = user?.name?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || 'SK';

  return (
    <>
      <header className="lg:hidden sticky top-0 z-40 flex items-center justify-between px-4 py-3 bg-slate-950/90 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center">
            <Zap size={16} className="text-white" />
          </div>
          <span className="font-display text-lg font-bold text-white">SplitKar</span>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-brand-500 text-white text-xs flex items-center justify-center font-bold">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
          <button onClick={() => setOpen(true)} className="btn-ghost p-2">
            <Menu size={20} />
          </button>
        </div>
      </header>

      {/* Drawer */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative w-72 h-full bg-slate-900 border-r border-white/[0.06] flex flex-col animate-slide-in-right">
            <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center">
                  <Zap size={16} className="text-white" />
                </div>
                <span className="font-display text-lg font-bold text-white">SplitKar</span>
              </div>
              <button onClick={() => setOpen(false)} className="btn-ghost p-1.5"><X size={18} /></button>
            </div>
            <nav className="flex-1 p-4 space-y-1">
              {NAV.map(({ to, icon: Icon, label }) => (
                <NavLink key={to} to={to} onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
                    ${isActive ? 'bg-brand-500/15 text-brand-400' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
                  <Icon size={18} />
                  <span className="flex-1">{label}</span>
                  {label === 'Notifications' && unreadCount > 0 && (
                    <span className="w-5 h-5 rounded-full bg-brand-500 text-white text-xs flex items-center justify-center font-bold">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </NavLink>
              ))}
            </nav>
            <div className="p-4 border-t border-white/[0.06]">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white text-sm font-bold">
                  {initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{user?.name}</p>
                  <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                </div>
              </div>
              <button onClick={handleLogout} className="btn-secondary w-full flex items-center justify-center gap-2 text-red-400 border-red-500/20 hover:bg-red-500/10">
                <LogOut size={15} /> Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
