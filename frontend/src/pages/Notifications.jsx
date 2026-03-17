import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Bell, CheckCheck, Trash2, Receipt, Users, CreditCard, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import api from '../services/api';
import toast from 'react-hot-toast';

const TYPE_ICONS = {
  expense_added: Receipt,
  expense_updated: Receipt,
  expense_deleted: Receipt,
  settlement_requested: CreditCard,
  settlement_completed: CreditCard,
  group_invite: Users,
  group_joined: Users,
  payment_reminder: AlertCircle,
  balance_update: CreditCard,
  general: Bell,
};

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const ctx = useOutletContext();

  const fetchNotifications = async () => {
    try {
      const r = await api.get('/notifications?limit=50');
      setNotifications(r.data.notifications || []);
      if (ctx?.setUnreadCount) ctx.setUnreadCount(0);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchNotifications(); }, []);

  const markAllRead = async () => {
    await api.put('/notifications/read-all');
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    toast.success('All marked as read');
  };

  const markRead = async (id) => {
    await api.put(`/notifications/${id}/read`);
    setNotifications((prev) => prev.map((n) => n._id === id ? { ...n, isRead: true } : n));
  };

  const deleteNotif = async (id) => {
    await api.delete(`/notifications/${id}`);
    setNotifications((prev) => prev.filter((n) => n._id !== id));
  };

  const unread = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Notifications</h1>
          <p className="text-slate-400 text-sm mt-1">{unread > 0 ? `${unread} unread` : 'All caught up!'}</p>
        </div>
        {unread > 0 && (
          <button onClick={markAllRead} className="btn-secondary text-sm flex items-center gap-2">
            <CheckCheck size={15} /> Mark all read
          </button>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-white/5 rounded-2xl animate-pulse" />)}</div>
      ) : notifications.length === 0 ? (
        <div className="card p-16 text-center">
          <Bell size={48} className="text-slate-700 mx-auto mb-4" />
          <p className="text-slate-400">No notifications yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => {
            const Icon = TYPE_ICONS[n.type] || Bell;
            return (
              <div key={n._id}
                onClick={() => !n.isRead && markRead(n._id)}
                className={`card p-4 flex items-start gap-4 cursor-pointer transition-all hover:border-white/10
                  ${!n.isRead ? 'border-brand-500/20 bg-brand-500/[0.03]' : ''}`}>
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${!n.isRead ? 'bg-brand-500/20 text-brand-400' : 'bg-white/5 text-slate-500'}`}>
                  <Icon size={17} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${!n.isRead ? 'text-white' : 'text-slate-400'}`}>{n.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{n.message}</p>
                  <p className="text-xs text-slate-600 mt-1">{format(new Date(n.createdAt), 'dd MMM yyyy, hh:mm a')}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {!n.isRead && <div className="w-2 h-2 rounded-full bg-brand-500" />}
                  <button onClick={(e) => { e.stopPropagation(); deleteNotif(n._id); }} className="btn-ghost p-1 text-slate-600 hover:text-red-400">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
