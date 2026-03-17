import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, Receipt, CreditCard,
  Bell, Settings, LogOut, Zap, ChevronRight,
} from 'lucide-react';
import useAuthStore from '../../context/authStore';

const NAV = [
  { to: '/app/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/app/groups', icon: Users, label: 'Groups' },
  { to: '/app/expenses', icon: Receipt, label: 'Expenses' },
  { to: '/app/settlements', icon: CreditCard, label: 'Settlements' },
  { to: '/app/notifications', icon: Bell, label: 'Notifications' },
  { to: '/app/settings', icon: Settings, label: 'Settings' },
];

export default function Sidebar({ unreadCount = 0 }) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  const initials = user?.name?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || 'SK';

  return (
    <aside className="hidden lg:flex flex-col w-64 shrink-0 h-screen sticky top-0 border-r border-white/[0.06] bg-slate-950/80 backdrop-blur-xl">
      {/* Logo */}
      <div className="p-6 border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-brand-500 flex items-center justify-center shadow-lg shadow-brand-500/30">
            <Zap size={18} className="text-white" />
          </div>
          <span className="font-display text-xl font-bold text-white">SplitKar</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group
              ${isActive
                ? 'bg-brand-500/15 text-brand-400 border border-brand-500/20'
                : 'text-slate-400 hover:text-white hover:bg-white/5'}`
            }>
            {({ isActive }) => (
              <>
                <Icon size={18} className={isActive ? 'text-brand-400' : 'text-slate-500 group-hover:text-slate-300'} />
                <span className="flex-1">{label}</span>
                {label === 'Notifications' && unreadCount > 0 && (
                  <span className="w-5 h-5 rounded-full bg-brand-500 text-white text-xs flex items-center justify-center font-bold">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
                {isActive && <ChevronRight size={14} className="text-brand-400" />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div className="p-4 border-t border-white/[0.06]">
        <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-all cursor-pointer group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white text-sm font-bold shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{user?.name}</p>
            <p className="text-xs text-slate-500 truncate">{user?.email}</p>
          </div>
          <button onClick={handleLogout} title="Logout"
            className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100">
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </aside>
  );
}
