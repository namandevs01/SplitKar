import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useSocket } from '../context/SocketContext';
import toast from 'react-hot-toast';

export const useGroup = (groupId) => {
  const socket = useSocket();
  const [group, setGroup] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [balances, setBalances] = useState(null);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchGroup = useCallback(async () => {
    if (!groupId) return;
    try {
      setError(null);
      const [gRes, eRes, aRes] = await Promise.all([
        api.get(`/groups/${groupId}`),
        api.get(`/groups/${groupId}/expenses?limit=50`),
        api.get(`/groups/${groupId}/activity`),
      ]);
      setGroup(gRes.data.group);
      setBalances(gRes.data.balances);
      setExpenses(eRes.data.expenses || []);
      setActivity(aRes.data.logs || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load group');
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    fetchGroup();
  }, [fetchGroup]);

  useEffect(() => {
    if (!socket || !groupId) return;
    const id = parseInt(groupId);

    socket.emit('join_group', id);

    socket.on('expense_added', ({ expense }) => {
      setExpenses((prev) => {
        if (prev.find((e) => e.id === expense.id)) return prev;
        return [expense, ...prev];
      });
    });

    socket.on('expense_updated', ({ expense }) => {
      setExpenses((prev) => prev.map((e) => (e.id === expense.id ? expense : e)));
    });

    socket.on('expense_deleted', ({ expenseId }) => {
      setExpenses((prev) => prev.filter((e) => e.id !== expenseId));
    });

    socket.on('balance_updated', () => {
      fetchGroup();
    });

    socket.on('member_added', () => {
      fetchGroup();
    });

    socket.on('member_removed', () => {
      fetchGroup();
    });

    return () => {
      socket.off('expense_added');
      socket.off('expense_updated');
      socket.off('expense_deleted');
      socket.off('balance_updated');
      socket.off('member_added');
      socket.off('member_removed');
    };
  }, [socket, groupId, fetchGroup]);

  const addExpense = async (data) => {
    const res = await api.post(`/groups/${groupId}/expenses`, data);
    return res.data.expense;
  };

  const deleteExpense = async (expId) => {
    await api.delete(`/groups/${groupId}/expenses/${expId}`);
  };

  const addMember = async (email) => {
    const res = await api.post(`/groups/${groupId}/members`, { email });
    return res.data.member;
  };

  const removeMember = async (userId) => {
    await api.delete(`/groups/${groupId}/members/${userId}`);
  };

  return {
    group, expenses, balances, activity,
    loading, error, refetch: fetchGroup,
    addExpense, deleteExpense, addMember, removeMember,
  };
};
