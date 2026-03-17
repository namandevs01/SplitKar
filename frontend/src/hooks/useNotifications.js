import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useSocket } from '../context/SocketContext';

export const useNotifications = () => {
  const socket = useSocket();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await api.get('/notifications?limit=30');
      setNotifications(res.data.notifications || []);
      setUnreadCount(res.data.unreadCount || 0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    if (!socket) return;

    socket.on('notification', (data) => {
      setUnreadCount((c) => c + 1);
      setNotifications((prev) => [
        {
          _id: Date.now().toString(),
          ...data,
          isRead: false,
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ]);
    });

    return () => socket.off('notification');
  }, [socket]);

  const markRead = async (id) => {
    await api.put(`/notifications/${id}/read`);
    setNotifications((prev) =>
      prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
    );
    setUnreadCount((c) => Math.max(0, c - 1));
  };

  const markAllRead = async () => {
    await api.put('/notifications/read-all');
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  const deleteNotification = async (id) => {
    await api.delete(`/notifications/${id}`);
    setNotifications((prev) => prev.filter((n) => n._id !== id));
  };

  return {
    notifications, unreadCount, loading,
    markRead, markAllRead, deleteNotification,
    refetch: fetchNotifications,
  };
};
