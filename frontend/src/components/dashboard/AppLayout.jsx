import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../shared/Sidebar';
import MobileNav from '../shared/MobileNav';
import useAuthStore from '../../context/authStore';
import api from '../../services/api';
import { useSocket } from '../../context/SocketContext';
import toast from 'react-hot-toast';
import { Bell } from 'lucide-react';

export default function AppLayout() {
  const { user } = useAuthStore();
  const socket = useSocket();
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch unread notification count
  useEffect(() => {
    api.get('/notifications?limit=1').then((r) => setUnreadCount(r.data.unreadCount || 0)).catch(() => {});
  }, []);

  // Socket notifications
  useEffect(() => {
    if (!socket) return;
    // Join user's groups
    api.get('/groups').then((r) => {
      r.data.groups?.forEach((g) => socket.emit('join_group', g.id));
    }).catch(() => {});

    socket.on('notification', (data) => {
      setUnreadCount((c) => c + 1);
      toast.custom((t) => (
        <div className={`card px-4 py-3 flex items-start gap-3 max-w-sm shadow-xl ${t.visible ? 'animate-slide-up' : ''}`}>
          <div className="w-8 h-8 rounded-lg bg-brand-500/20 flex items-center justify-center shrink-0">
            <Bell size={16} className="text-brand-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-white">{data.title || 'New notification'}</p>
            <p className="text-xs text-slate-400 mt-0.5">{data.message || ''}</p>
          </div>
        </div>
      ), { duration: 4000 });
    });

    return () => socket.off('notification');
  }, [socket]);

  return (
    <div className="flex min-h-screen">
      <Sidebar unreadCount={unreadCount} />
      <div className="flex-1 flex flex-col min-w-0">
        <MobileNav unreadCount={unreadCount} />
        <main className="flex-1 p-4 lg:p-8 max-w-6xl w-full mx-auto">
          <Outlet context={{ unreadCount, setUnreadCount }} />
        </main>
      </div>
    </div>
  );
}
