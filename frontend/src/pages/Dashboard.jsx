import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, TrendingDown, Users, Receipt, CreditCard, ArrowRight, Plus } from 'lucide-react';
import api from '../services/api';
import useAuthStore from '../context/authStore';
import { format } from 'date-fns';

const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

const StatCard = ({ label, value, sub, icon: Icon, color, trend }) => (
  <div className="card p-5 flex items-start gap-4 hover:border-white/10 transition-all duration-300">
    <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
      <Icon size={20} className="text-white" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-slate-400 text-sm">{label}</p>
      <p className="text-2xl font-display font-bold text-white mt-0.5">{value}</p>
      {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
    </div>
    {trend !== undefined && (
      <div className={`flex items-center gap-1 text-xs font-medium ${trend >= 0 ? 'text-brand-400' : 'text-red-400'}`}>
        {trend >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
        {Math.abs(trend)}%
      </div>
    )}
  </div>
);

export default function Dashboard() {
  const { user } = useAuthStore();
  const [groups, setGroups] = useState([]);
  const [settlements, setSettlements] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [allExpenses, setAllExpenses] = useState([]);

  useEffect(() => {
    Promise.all([
      api.get('/groups'),
      api.get('/settlements/my'),
    ]).then(async ([g, s]) => {
      const fetchedGroups = g.data.groups || [];
      setGroups(fetchedGroups);
      setSettlements(s.data.settlements || []);

      // Fetch expenses for all groups
      const expArrays = await Promise.all(
          fetchedGroups.map((grp) =>
              api.get(`/groups/${grp.id}/expenses?limit=100`)
                  .then((r) => r.data.expenses.map((e) => ({ ...e, groupId: grp.id })))
                  .catch(() => [])
          )
      );
      setAllExpenses(expArrays.flat());
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const totalOwed = settlements.filter((s) => s.payeeId === user?.id && s.status !== 'completed').reduce((sum, s) => sum + parseFloat(s.amount), 0);
  const totalOwes = settlements.filter((s) => s.payerId === user?.id && s.status !== 'completed').reduce((sum, s) => sum + parseFloat(s.amount), 0);

  // Monthly spend chart data (last 6 months)
  const monthlyData = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(); d.setMonth(d.getMonth() - i);
    const label = format(d, 'MMM');
    const month = format(d, 'yyyy-MM');
    const total = settlements
      .filter((s) => s.payerId === user?.id && s.createdAt?.startsWith(month))
      .reduce((sum, s) => sum + parseFloat(s.amount), 0);
    monthlyData.push({ month: label, amount: Math.round(total) });
  }

  // Real spend per group from actual expenses
  const categoryData = groups.slice(0, 5).map((g) => {
    const groupExpenses = allExpenses?.filter((e) => e.groupId === g.id) || [];
    const total = groupExpenses.reduce((sum, e) => sum + parseFloat(e.totalAmount || 0), 0);
    return { name: g.name, value: parseFloat(total.toFixed(2)) };
  }).filter((d) => d.value > 0); // only show groups that have expenses

  const fmt = (n) => `₹${parseFloat(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

  if (loading) return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-48 bg-white/5 rounded-xl" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-white/5 rounded-2xl" />)}
      </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'},{' '}
            <span className="text-brand-400">{user?.name?.split(' ')[0]}</span> 👋
          </h1>
          <p className="text-slate-400 mt-1 text-sm">Here's your financial overview</p>
        </div>
        <Link to="/app/groups" className="btn-primary flex items-center gap-2 text-sm hidden sm:flex">
          <Plus size={16} /> New Group
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="You're owed" value={fmt(totalOwed)} sub="across all groups" icon={TrendingUp} color="bg-brand-500" />
        <StatCard label="You owe" value={fmt(totalOwes)} sub="pending settlements" icon={TrendingDown} color="bg-red-500" />
        <StatCard label="Active groups" value={groups.length} sub="groups you're in" icon={Users} color="bg-blue-500" />
        <StatCard label="Settlements" value={settlements.filter((s) => s.status === 'completed').length} sub="completed this month" icon={CreditCard} color="bg-purple-500" />
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Monthly Spend */}
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h2 className="section-title">Monthly Activity</h2>
            <span className="text-xs text-slate-500">Last 6 months</span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={monthlyData} barSize={32}>
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }}
                tickFormatter={(v) => `₹${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`} />
              <Tooltip
                contentStyle={{ background: '#1a2234', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', color: '#f1f5f9' }}
                formatter={(v) => [`₹${v.toLocaleString('en-IN')}`, 'Amount']}
              />
              <Bar dataKey="amount" fill="#22c55e" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Group spend pie */}
        <div className="card p-5">
          <h2 className="section-title mb-6">Spend by Group</h2>
          {categoryData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={categoryData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} dataKey="value" paddingAngle={3}>
                    {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-4">
                {categoryData.map((d, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                    <span className="text-xs text-slate-400 flex-1 truncate">{d.name}</span>
                    <span className="text-xs font-mono text-slate-300">{fmt(d.value)}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-40 text-slate-500 text-sm">No groups yet</div>
          )}
        </div>
      </div>

      {/* Recent Groups */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-title">Your Groups</h2>
          <Link to="/app/groups" className="text-brand-400 hover:text-brand-300 text-sm flex items-center gap-1">
            View all <ArrowRight size={14} />
          </Link>
        </div>
        {groups.length === 0 ? (
          <div className="text-center py-10">
            <Users size={40} className="text-slate-700 mx-auto mb-3" />
            <p className="text-slate-400">No groups yet</p>
            <Link to="/app/groups" className="btn-primary inline-flex items-center gap-2 mt-4 text-sm">
              <Plus size={15} /> Create your first group
            </Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {groups.slice(0, 6).map((g) => (
              <Link key={g.id} to={`/app/groups/${g.id}`}
                className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.05] hover:border-white/10 transition-all group">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500/20 to-brand-700/20 flex items-center justify-center text-brand-400 font-bold text-sm">
                  {g.name[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{g.name}</p>
                  <p className="text-xs text-slate-500">{g.members?.length || 0} members</p>
                </div>
                <ArrowRight size={14} className="text-slate-600 group-hover:text-brand-400 transition-colors" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
