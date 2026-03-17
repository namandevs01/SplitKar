import { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend,
} from 'recharts';
import { TrendingUp, BarChart2, PieChart as PieIcon } from 'lucide-react';
import api from '../../services/api';

const PALETTE = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16'];

const fmt = (n) => `₹${parseFloat(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="card px-3 py-2 text-sm shadow-xl">
      <p className="text-slate-400 text-xs mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="font-mono font-semibold">
          {fmt(p.value)}
        </p>
      ))}
    </div>
  );
};

export default function AnalyticsDashboard({ groupId }) {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!groupId) return;
    api.get(`/groups/${groupId}/analytics`)
      .then((r) => setAnalytics(r.data.analytics))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [groupId]);

  if (loading) return (
    <div className="grid grid-cols-2 gap-4 animate-pulse">
      {[...Array(4)].map((_, i) => <div key={i} className="h-40 bg-white/5 rounded-2xl" />)}
    </div>
  );

  if (!analytics) return null;

  const categoryData = Object.entries(analytics.byCategory || {}).map(([name, value]) => ({ name, value }));
  const monthData = Object.entries(analytics.byMonth || {})
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([month, amount]) => ({
      month: new Date(month + '-01').toLocaleString('en-IN', { month: 'short' }),
      amount: parseFloat(amount.toFixed(2)),
    }));

  return (
    <div className="space-y-5">
      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total Spent', value: fmt(analytics.totalSpend), icon: TrendingUp, color: 'text-brand-400 bg-brand-500/10' },
          { label: 'Expenses', value: analytics.expenseCount, icon: BarChart2, color: 'text-blue-400 bg-blue-500/10' },
          { label: 'Avg / Expense', value: fmt(analytics.expenseCount ? analytics.totalSpend / analytics.expenseCount : 0), icon: PieIcon, color: 'text-purple-400 bg-purple-500/10' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card p-4 text-center">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center mx-auto mb-2 ${color}`}>
              <Icon size={16} />
            </div>
            <p className="font-display font-bold text-lg text-white">{value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Monthly bar chart */}
      {monthData.length > 0 && (
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-slate-300 mb-4">Monthly Spending</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={monthData} barSize={28}>
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }}
                tickFormatter={(v) => v >= 1000 ? `₹${(v / 1000).toFixed(0)}k` : `₹${v}`} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="amount" fill="#22c55e" radius={[5, 5, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Category pie chart */}
      {categoryData.length > 0 && (
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-slate-300 mb-4">Spend by Category</h3>
          <div className="flex items-start gap-4">
            <ResponsiveContainer width="50%" height={140}>
              <PieChart>
                <Pie data={categoryData} cx="50%" cy="50%" innerRadius={35} outerRadius={65}
                  dataKey="value" paddingAngle={2}>
                  {categoryData.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-2 py-1">
              {categoryData
                .sort((a, b) => b.value - a.value)
                .map((d, i) => (
                  <div key={d.name} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ background: PALETTE[i % PALETTE.length] }} />
                    <span className="text-xs text-slate-400 flex-1 capitalize">{d.name}</span>
                    <span className="text-xs font-mono text-slate-300">{fmt(d.value)}</span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
