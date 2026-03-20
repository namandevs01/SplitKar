import { useState, useRef, useEffect, createContext, useContext } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Zap, LogOut } from 'lucide-react';
import { cn } from '../../lib/utils';
import useAuthStore from '../../context/authStore';

// ── Context ──────────────────────────────────────────────
const SidebarContext = createContext(undefined);
const useSidebar = () => useContext(SidebarContext);

// ── Main Export ───────────────────────────────────────────
export function AnimatedSidebar({ navItems, unreadCount }) {
    const [open, setOpen] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();
    const sidebarRef = useRef(null);
    const timeoutRef = useRef(null);
    const isHoveringRef = useRef(false);

    const handleLogout = () => { logout(); navigate('/login'); };
    const initials = user?.name?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || 'SK';

    // Single global mousemove listener — no child interference
    useEffect(() => {
        const handleMouseMove = (e) => {
            if (!sidebarRef.current) return;
            const rect = sidebarRef.current.getBoundingClientRect();
            const inside =
                e.clientX >= rect.left &&
                e.clientX <= rect.right &&
                e.clientY >= rect.top &&
                e.clientY <= rect.bottom;

            if (inside && !isHoveringRef.current) {
                isHoveringRef.current = true;
                if (timeoutRef.current) clearTimeout(timeoutRef.current);
                setOpen(true);
            } else if (!inside && isHoveringRef.current) {
                isHoveringRef.current = false;
                if (timeoutRef.current) clearTimeout(timeoutRef.current);
                timeoutRef.current = setTimeout(() => setOpen(false), 300);
            }
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, []);

    return (
        <>
            {/* ── DESKTOP SIDEBAR ── */}
            <motion.div
                ref={sidebarRef}
                className="h-full px-3 py-4 hidden md:flex md:flex-col bg-slate-950 border-r border-white/[0.06] flex-shrink-0 overflow-hidden"
                animate={{ width: open ? '240px' : '64px' }}
                transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            >
                {/* Logo */}
                <div className="flex items-center gap-3 px-2 mb-8 h-10 overflow-hidden">
                    <div className="w-8 h-8 rounded-xl bg-brand-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-brand-500/30">
                        <Zap size={16} className="text-white" />
                    </div>
                    <motion.span
                        animate={{ opacity: open ? 1 : 0, width: open ? 'auto' : 0 }}
                        transition={{ duration: 0.2 }}
                        className="font-display text-lg font-bold text-white whitespace-nowrap overflow-hidden"
                    >
                        SplitKar
                    </motion.span>
                </div>

                {/* Nav links */}
                <div className="flex flex-col gap-1 flex-1">
                    {navItems.map((item) => (
                        <div key={item.href} className="relative group/item">
                            <NavLink
                                to={item.href}
                                className={({ isActive }) => cn(
                                    'flex items-center py-2.5 rounded-xl transition-all duration-200 overflow-hidden',
                                    open ? 'gap-3 px-2' : 'justify-center px-0',
                                    isActive
                                        ? 'bg-brand-500/15 text-brand-400 border border-brand-500/20'
                                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                                )}
                            >
                                <span className="flex-shrink-0">{item.icon}</span>
                                <motion.span
                                    animate={{ opacity: open ? 1 : 0, width: open ? 'auto' : 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="text-sm font-medium whitespace-nowrap overflow-hidden"
                                >
                                    {item.label}
                                </motion.span>
                                {item.label === 'Notifications' && unreadCount > 0 && open && (
                                    <span className="ml-auto w-5 h-5 rounded-full bg-brand-500 text-white text-xs flex items-center justify-center font-bold flex-shrink-0">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                                )}
                            </NavLink>

                            {/* Tooltip when collapsed */}
                            {!open && (
                                <div className="absolute left-14 top-1/2 -translate-y-1/2 bg-slate-800 text-white text-xs px-2.5 py-1.5 rounded-lg opacity-0 group-hover/item:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 border border-white/10 shadow-xl">
                                    {item.label}
                                    {item.label === 'Notifications' && unreadCount > 0 && (
                                        <span className="ml-1.5 bg-brand-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                      {unreadCount}
                    </span>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* User section */}
                <div className="border-t border-white/[0.06] pt-3 overflow-hidden">
                    <div className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-white/5 transition-all group/user">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {initials}
                        </div>
                        <motion.div
                            animate={{ opacity: open ? 1 : 0, width: open ? 'auto' : 0 }}
                            transition={{ duration: 0.2 }}
                            className="flex-1 flex items-center justify-between overflow-hidden min-w-0"
                        >
                            <div className="min-w-0 mr-2">
                                <p className="text-sm font-medium text-white truncate">{user?.name}</p>
                                <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                            </div>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleLogout();
                                }}
                                onMouseEnter={() => {
                                    // Prevent sidebar from closing when hovering logout
                                    isHoveringRef.current = true;
                                    if (timeoutRef.current) clearTimeout(timeoutRef.current);
                                }}
                                className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-all flex-shrink-0 opacity-0 group-hover/user:opacity-100"
                            >
                                <LogOut size={14} />
                            </button>
                        </motion.div>
                    </div>
                </div>
            </motion.div>

            {/* ── MOBILE HEADER ── */}
            <div className="md:hidden sticky top-0 z-40 flex items-center justify-between px-4 py-3 bg-slate-950/90 backdrop-blur-xl border-b border-white/[0.06]">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-brand-500 flex items-center justify-center">
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
                    <button
                        onClick={() => setMobileOpen(true)}
                        className="p-2 rounded-lg border border-white/10 text-slate-400 hover:text-white transition-all"
                    >
                        <Menu size={18} />
                    </button>
                </div>
            </div>

            {/* ── MOBILE DRAWER ── */}
            <AnimatePresence>
                {mobileOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 md:hidden"
                            onClick={() => setMobileOpen(false)}
                        />
                        <motion.div
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ duration: 0.25, ease: 'easeInOut' }}
                            className="fixed top-0 left-0 h-full w-72 bg-slate-950 border-r border-white/[0.06] z-50 flex flex-col p-4 md:hidden"
                        >
                            {/* Mobile header */}
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-xl bg-brand-500 flex items-center justify-center">
                                        <Zap size={16} className="text-white" />
                                    </div>
                                    <span className="font-display text-lg font-bold text-white">SplitKar</span>
                                </div>
                                <button
                                    onClick={() => setMobileOpen(false)}
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            {/* Mobile nav */}
                            <div className="flex flex-col gap-1 flex-1">
                                {navItems.map((item) => (
                                    <NavLink
                                        key={item.href}
                                        to={item.href}
                                        onClick={() => setMobileOpen(false)}
                                        className={({ isActive }) => cn(
                                            'flex items-center gap-3 px-3 py-3 rounded-xl transition-all text-sm font-medium',
                                            isActive
                                                ? 'bg-brand-500/15 text-brand-400 border border-brand-500/20'
                                                : 'text-slate-400 hover:text-white hover:bg-white/5'
                                        )}
                                    >
                                        {item.icon}
                                        <span className="flex-1">{item.label}</span>
                                        {item.label === 'Notifications' && unreadCount > 0 && (
                                            <span className="w-5 h-5 rounded-full bg-brand-500 text-white text-xs flex items-center justify-center font-bold">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                                        )}
                                    </NavLink>
                                ))}
                            </div>

                            {/* Mobile user */}
                            <div className="border-t border-white/[0.06] pt-4 mt-4">
                                <div className="flex items-center gap-3 px-3 py-2 mb-2">
                                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white text-sm font-bold">
                                        {initials}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-white truncate">{user?.name}</p>
                                        <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-400 hover:bg-red-500/10 transition-all text-sm font-medium"
                                >
                                    <LogOut size={16} /> Sign out
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}