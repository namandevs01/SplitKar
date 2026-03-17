import { useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ArrowLeft, Plus, X, Users, BarChart2,
  Activity, Wallet, UserPlus, Trash2, Search,
} from 'lucide-react';
import { format } from 'date-fns';

import { useGroup } from '../hooks/useGroup';
import { useSettlement } from '../hooks/useSettlement';
import useAuthStore from '../context/authStore';
import api from '../services/api';

import ExpenseCard from '../components/expenses/ExpenseCard';
import AddExpenseModal from '../components/expenses/AddExpenseModal';
import BalanceSummary from '../components/groups/BalanceSummary';
import AnalyticsDashboard from '../components/groups/AnalyticsDashboard';
import QRModal from '../components/settlements/QRModal';
import ConfirmModal from '../components/shared/ConfirmModal';

const TAB = { EXPENSES: 'expenses', BALANCES: 'balances', ANALYTICS: 'analytics', MEMBERS: 'members', ACTIVITY: 'activity' };

export default function GroupDetail() {
  const { id } = useParams();
  const { user } = useAuthStore();
  const { group, expenses, balances, activity, loading, error, refetch, deleteExpense } = useGroup(id);
  const [tab, setTab] = useState(TAB.EXPENSES);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrTarget, setQrTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [memberEmail, setMemberEmail] = useState('');
  const [memberSearch, setMemberSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [addingMember, setAddingMember] = useState(false);
  const { initiateRazorpay, recordManual } = useSettlement(refetch);
  const isAdmin = group?.members?.find((m) => m.id === user?.id)?.GroupMember?.role === 'admin';

  const handleDeleteExpense = async () => {
    setDeleting(true);
    try {
      await deleteExpense(deleteTarget);
      toast.success('Expense deleted');
      setDeleteTarget(null);
    } catch { toast.error('Failed to delete'); }
    finally { setDeleting(false); }
  };

  const searchMembers = useCallback(async (q) => {
    setMemberSearch(q);
    if (q.length < 2) { setSearchResults([]); return; }
    try {
      const res = await api.get(`/users/search?q=${q}`);
      setSearchResults(res.data.users || []);
    } catch { setSearchResults([]); }
  }, []);

  const addMemberByEmail = async (email) => {
    if (!email) return;
    setAddingMember(true);
    try {
      await api.post(`/groups/${id}/members`, { email });
      toast.success('Member added!');
      setShowMemberModal(false);
      setMemberEmail(''); setMemberSearch(''); setSearchResults([]);
      refetch();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to add member'); }
    finally { setAddingMember(false); }
  };

  const removeMember = async (userId) => {
    try {
      await api.delete(`/groups/${id}/members/${userId}`);
      toast.success('Member removed'); refetch();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handlePayQR = (tx) => {
    const payeeM = group?.members?.find((m) => m.id === tx.to.userId);
    setQrTarget({ amount: tx.amount, payeeName: tx.to.name, payeeUpi: payeeM?.profile?.upiId || '', groupId: id, payeeId: tx.to.userId });
    setShowQRModal(true);
  };

  const fmt = (n) => `₹${parseFloat(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
  const myBalance = balances?.memberBalances?.find((b) => b.userId === user?.id);

  if (loading) return (
    <div className="animate-pulse space-y-5">
      <div className="h-8 w-56 bg-white/5 rounded-xl" />
      <div className="h-24 bg-white/5 rounded-2xl" />
      <div className="h-10 bg-white/5 rounded-xl" />
      {[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-white/5 rounded-2xl" />)}
    </div>
  );

  if (error || !group) return (
    <div className="text-center py-20">
      <p className="text-slate-400 mb-4">{error || 'Group not found'}</p>
      <Link to="/app/groups" className="btn-secondary inline-flex items-center gap-2"><ArrowLeft size={15} />Back</Link>
    </div>
  );

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Link to="/app/groups" className="btn-ghost p-2 mt-1 shrink-0"><ArrowLeft size={18} /></Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="font-display text-2xl font-bold text-white leading-tight">{group.name}</h1>
              {group.description && <p className="text-slate-400 text-sm mt-0.5">{group.description}</p>}
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <span className="badge-green capitalize">{group.category}</span>
                <span className="text-xs text-slate-500">· <Users size={10} className="inline" /> {group.members?.length} members</span>
                <span className="text-xs text-slate-500">· {expenses.length} expenses</span>
              </div>
            </div>
            <button onClick={() => setShowExpenseModal(true)} className="btn-primary flex items-center gap-1.5 text-sm shrink-0 px-3 py-2">
              <Plus size={15} /> Add
            </button>
          </div>
        </div>
      </div>

      {/* Balance banner */}
      {myBalance && Math.abs(myBalance.balance) > 0.01 && (
        <div className={`card px-4 py-3 flex items-center justify-between border-l-4 ${myBalance.balance > 0 ? 'border-l-brand-500' : 'border-l-red-500'}`}>
          <div>
            <p className="text-xs text-slate-400">{myBalance.balance > 0 ? 'You are owed' : 'You owe'}</p>
            <p className={`font-display text-2xl font-bold ${myBalance.balance > 0 ? 'text-brand-400' : 'text-red-400'}`}>
              {myBalance.balance > 0 ? '+' : ''}{fmt(myBalance.balance)}
            </p>
          </div>
          {myBalance.balance < -0.01 && (
            <button onClick={() => setTab(TAB.BALANCES)} className="btn-primary text-sm px-3 py-2">Settle Up</button>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-white/5 rounded-xl p-1 overflow-x-auto">
        {Object.values(TAB).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 min-w-fit px-3 py-2 rounded-lg text-xs font-medium capitalize whitespace-nowrap transition-all
              ${tab === t ? 'bg-brand-500 text-white' : 'text-slate-400 hover:text-white'}`}>
            {t}
          </button>
        ))}
      </div>

      {/* Expenses */}
      {tab === TAB.EXPENSES && (
        <div className="space-y-3">
          {expenses.length === 0 ? (
            <div className="card p-14 text-center">
              <Wallet size={44} className="text-slate-700 mx-auto mb-3" />
              <p className="text-slate-400 font-medium">No expenses yet</p>
              <button onClick={() => setShowExpenseModal(true)} className="btn-primary inline-flex items-center gap-2 text-sm mt-5">
                <Plus size={15} /> Add First Expense
              </button>
            </div>
          ) : expenses.map((e) => (
            <ExpenseCard key={e.id} expense={e} isAdmin={isAdmin} onDelete={(expId) => setDeleteTarget(expId)} />
          ))}
        </div>
      )}

      {/* Balances */}
      {tab === TAB.BALANCES && (
        <BalanceSummary
          balances={balances}
          currentUserId={user?.id}
          onPay={(tx) => initiateRazorpay({ groupId: id, payeeId: tx.to.userId, payeeName: tx.to.name, amount: tx.amount })}
          onQR={handlePayQR}
        />
      )}

      {/* Analytics */}
      {tab === TAB.ANALYTICS && <AnalyticsDashboard groupId={id} />}

      {/* Members */}
      {tab === TAB.MEMBERS && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="section-title">Members ({group.members?.length})</h3>
            {isAdmin && (
              <button onClick={() => setShowMemberModal(true)} className="btn-secondary text-xs px-3 py-2 flex items-center gap-1.5">
                <UserPlus size={14} /> Add
              </button>
            )}
          </div>
          <div className="space-y-2">
            {group.members?.map((m) => (
              <div key={m.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] group">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500/20 to-brand-700/20 flex items-center justify-center text-brand-400 font-bold shrink-0">
                  {m.name?.[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {m.name} {m.id === user?.id && <span className="text-slate-600 text-xs">(you)</span>}
                  </p>
                  <p className="text-xs text-slate-500 truncate">{m.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  {m.GroupMember?.role === 'admin' && <span className="badge-yellow text-xs">Admin</span>}
                  {isAdmin && m.id !== user?.id && (
                    <button onClick={() => removeMember(m.id)}
                      className="btn-ghost p-1.5 text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Activity */}
      {tab === TAB.ACTIVITY && (
        <div className="card p-5">
          <h3 className="section-title mb-5">Activity Timeline</h3>
          {activity.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-8">No activity yet</p>
          ) : (
            <div className="relative pl-5 space-y-0">
              <div className="absolute left-2 top-2 bottom-2 w-px bg-white/10" />
              {activity.map((log, i) => (
                <div key={log._id || i} className="relative pb-5 last:pb-0">
                  <div className="absolute -left-3 top-1 w-2 h-2 rounded-full bg-brand-500 ring-2 ring-slate-900" />
                  <p className="text-sm text-slate-300">{log.description}</p>
                  <p className="text-xs text-slate-600 mt-1">{format(new Date(log.createdAt), 'dd MMM yyyy, hh:mm a')}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <AddExpenseModal isOpen={showExpenseModal} onClose={() => setShowExpenseModal(false)}
        groupId={id} members={group?.members || []} onSuccess={() => { refetch(); setShowExpenseModal(false); }} />

      {showMemberModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowMemberModal(false)} />
          <div className="relative card p-6 w-full max-w-sm animate-slide-up">
            <div className="flex items-center justify-between mb-5">
              <h2 className="section-title">Add Member</h2>
              <button onClick={() => setShowMemberModal(false)} className="btn-ghost p-1.5"><X size={18} /></button>
            </div>
            <div className="relative mb-3">
              <Search size={15} className="absolute left-3.5 top-3.5 text-slate-500" />
              <input className="input pl-10" placeholder="Search by name or email..."
                value={memberSearch} onChange={(e) => searchMembers(e.target.value)} />
            </div>
            {searchResults.length > 0 && (
              <div className="space-y-1.5 mb-3 max-h-44 overflow-y-auto">
                {searchResults.map((u) => (
                  <button key={u.id} onClick={() => addMemberByEmail(u.email)}
                    className="w-full flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] text-left transition-all border border-white/[0.05]">
                    <div className="w-8 h-8 rounded-lg bg-brand-500/10 flex items-center justify-center text-brand-400 text-xs font-bold">{u.name?.[0]}</div>
                    <div><p className="text-sm text-white">{u.name}</p><p className="text-xs text-slate-500">{u.email}</p></div>
                  </button>
                ))}
              </div>
            )}
            <div className="divider" />
            <p className="text-xs text-slate-500 mb-2">Or enter email directly:</p>
            <div className="flex gap-2">
              <input className="input text-sm" type="email" placeholder="friend@example.com"
                value={memberEmail} onChange={(e) => setMemberEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addMemberByEmail(memberEmail)} />
              <button onClick={() => addMemberByEmail(memberEmail)} disabled={addingMember || !memberEmail}
                className="btn-primary px-3 shrink-0 disabled:opacity-40">
                {addingMember ? '...' : <Plus size={16} />}
              </button>
            </div>
          </div>
        </div>
      )}

      <QRModal isOpen={showQRModal} onClose={() => { setShowQRModal(false); setQrTarget(null); }}
        amount={qrTarget?.amount} payeeName={qrTarget?.payeeName} payeeUpi={qrTarget?.payeeUpi}
        onManualConfirm={(notes) => recordManual({ groupId: qrTarget?.groupId, payeeId: qrTarget?.payeeId, amount: qrTarget?.amount, notes })} />

      <ConfirmModal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteExpense} loading={deleting}
        title="Delete Expense" message="This will permanently remove the expense and recalculate all balances."
        confirmLabel="Delete" danger />
    </div>
  );
}
