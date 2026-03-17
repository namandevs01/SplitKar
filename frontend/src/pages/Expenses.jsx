import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Receipt, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import api from '../services/api';
import useAuthStore from '../context/authStore';

export default function Expenses() {
  const { user } = useAuthStore();
  const [groups, setGroups] = useState([]);
  const [allExpenses, setAllExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterGroup, setFilterGroup] = useState('all');
  const [filterCat, setFilterCat] = useState('all');

  useEffect(() => {
    api.get('/groups').then(async (gr) => {
      setGroups(gr.data.groups || []);
      const expArrays = await Promise.all(
        (gr.data.groups || []).map((g) => api.get(`/groups/${g.id}/expenses?limit=100`).then((r) => r.data.expenses.map((e) => ({ ...e, groupName: g.name }))))
      );
      const all = expArrays.flat().sort((a, b) => new Date(b.date) - new Date(a.date));
      setAllExpenses(all);
    }).finally(() => setLoading(false));
  }, []);

  const filtered = allExpenses.filter((e) =>
    (filterGroup === 'all' || e.groupId === parseInt(filterGroup)) &&
    (filterCat === 'all' || e.category === filterCat)
  );

  const totalSpend = filtered.reduce((s, e) => {
    const share = e.shares?.find((sh) => sh.userId === user?.id);
    return s + (share ? parseFloat(share.amountOwed) : 0);
  }, 0);

  const fmt = (n) => `₹${parseFloat(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display text-2xl font-bold text-white">Expenses</h1>
        <p className="text-slate-400 text-sm mt-1">Your share: <span className="text-brand-400 font-semibold">{fmt(totalSpend)}</span> across {filtered.length} expenses</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <select className="input py-2 text-sm w-auto" value={filterGroup} onChange={(e) => setFilterGroup(e.target.value)}>
          <option value="all" className="bg-slate-900">All Groups</option>
          {groups.map((g) => <option key={g.id} value={g.id} className="bg-slate-900">{g.name}</option>)}
        </select>
        <select className="input py-2 text-sm w-auto" value={filterCat} onChange={(e) => setFilterCat(e.target.value)}>
          {['all', 'food', 'transport', 'accommodation', 'entertainment', 'utilities', 'shopping', 'health', 'other'].map((c) => (
            <option key={c} value={c} className="bg-slate-900 capitalize">{c === 'all' ? 'All Categories' : c}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(6)].map((_, i) => <div key={i} className="h-20 bg-white/5 rounded-2xl animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="card p-16 text-center">
          <Receipt size={48} className="text-slate-700 mx-auto mb-4" />
          <p className="text-slate-400 mb-4">No expenses found</p>
          <Link to="/app/groups" className="btn-primary inline-flex items-center gap-2 text-sm"><ArrowRight size={15} /> Go to Groups</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((e) => {
            const myShare = e.shares?.find((s) => s.userId === user?.id);
            const iAmPayer = e.paidBy === user?.id;
            return (
              <Link key={e.id} to={`/app/groups/${e.groupId}`}
                className="card p-4 flex items-center gap-4 hover:border-white/10 transition-all group">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-400 shrink-0">
                  <Receipt size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white truncate">{e.description}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    <span className="text-brand-400">{e.groupName}</span>
                    {' · '}{e.payer?.name || 'You'} paid{' · '}{format(new Date(e.date), 'dd MMM yyyy')}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-mono font-bold text-white">{fmt(e.totalAmount)}</p>
                  {myShare && (
                    <p className={`text-xs font-mono ${iAmPayer ? 'text-brand-400' : 'text-red-400'}`}>
                      {iAmPayer ? 'you paid' : `your share: ${fmt(myShare.amountOwed)}`}
                    </p>
                  )}
                </div>
                <ArrowRight size={14} className="text-slate-600 group-hover:text-brand-400 transition-colors" />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
