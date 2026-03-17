import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { CreditCard, CheckCircle, Clock, XCircle, ArrowRight, Filter } from 'lucide-react';
import api from '../services/api';
import useAuthStore from '../context/authStore';
import toast from 'react-hot-toast';

const STATUS_CONFIG = {
  completed: { label: 'Paid', class: 'badge-green', Icon: CheckCircle },
  pending: { label: 'Pending', class: 'badge-yellow', Icon: Clock },
  initiated: { label: 'Processing', class: 'badge-yellow', Icon: Clock },
  failed: { label: 'Failed', class: 'badge-red', Icon: XCircle },
};

export default function Settlements() {
  const { user } = useAuthStore();
  const [settlements, setSettlements] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/settlements/my').then((r) => setSettlements(r.data.settlements || [])).finally(() => setLoading(false));
  }, []);

  const filtered = settlements.filter((s) => filter === 'all' ? true : filter === 'owe' ? s.payerId === user?.id : s.payeeId === user?.id);

  const totalPaid = settlements.filter((s) => s.payerId === user?.id && s.status === 'completed').reduce((sum, s) => sum + parseFloat(s.amount), 0);
  const totalReceived = settlements.filter((s) => s.payeeId === user?.id && s.status === 'completed').reduce((sum, s) => sum + parseFloat(s.amount), 0);
  const totalPending = settlements.filter((s) => s.payerId === user?.id && s.status === 'pending').reduce((sum, s) => sum + parseFloat(s.amount), 0);

  const fmt = (n) => `₹${parseFloat(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

  const initiatePayment = async (s) => {
    try {
      const res = await api.post('/settlements/initiate', { groupId: s.groupId, payeeId: s.payeeId, amount: s.amount });
      const { razorpayOrder, payee, settlement } = res.data;
      const options = {
        key: razorpayOrder.key,
        amount: razorpayOrder.amount,
        currency: 'INR',
        name: 'SplitKar',
        description: `Settlement to ${payee.name}`,
        order_id: razorpayOrder.id,
        handler: async (response) => {
          await api.post('/settlements/verify', { ...response, settlementId: settlement.id });
          toast.success(`Payment successful!`);
          const r = await api.get('/settlements/my');
          setSettlements(r.data.settlements || []);
        },
        prefill: { email: user?.email },
        theme: { color: '#22c55e' },
      };
      new window.Razorpay(options).open();
    } catch (err) {
      toast.error('Payment failed');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display text-2xl font-bold text-white">Settlements</h1>
        <p className="text-slate-400 text-sm mt-1">Track all your payments and dues</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total paid', value: fmt(totalPaid), color: 'text-brand-400' },
          { label: 'Received', value: fmt(totalReceived), color: 'text-blue-400' },
          { label: 'Still owe', value: fmt(totalPending), color: 'text-red-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className="card p-4 text-center">
            <p className="text-slate-500 text-xs">{label}</p>
            <p className={`font-display font-bold text-xl mt-1 ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex bg-white/5 rounded-xl p-1 gap-1 w-fit">
        {['all', 'owe', 'owed'].map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-all
              ${filter === f ? 'bg-brand-500 text-white' : 'text-slate-400 hover:text-white'}`}>
            {f === 'all' ? 'All' : f === 'owe' ? 'I owe' : 'Owed to me'}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-white/5 rounded-2xl animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="card p-16 text-center">
          <CreditCard size={48} className="text-slate-700 mx-auto mb-4" />
          <p className="text-slate-400">No settlements found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((s) => {
            const cfg = STATUS_CONFIG[s.status] || STATUS_CONFIG.pending;
            const isPayer = s.payerId === user?.id;
            return (
              <div key={s.id} className="card p-4 flex items-center gap-4 hover:border-white/10 transition-all">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isPayer ? 'bg-red-500/10 text-red-400' : 'bg-brand-500/10 text-brand-400'}`}>
                  <cfg.Icon size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-white">
                      {isPayer ? 'You' : s.payer?.name}
                      <ArrowRight size={12} className="inline mx-1 text-slate-500" />
                      {isPayer ? s.payee?.name : 'You'}
                    </p>
                    <span className={cfg.class}>{cfg.label}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {s.Group?.name} · {format(new Date(s.createdAt), 'dd MMM yyyy')}
                    {s.notes && ` · ${s.notes}`}
                  </p>
                </div>
                <div className="text-right">
                  <p className={`font-mono font-bold ${isPayer ? 'text-red-400' : 'text-brand-400'}`}>{fmt(s.amount)}</p>
                  {isPayer && s.status === 'pending' && (
                    <button onClick={() => initiatePayment(s)} className="btn-primary text-xs px-3 py-1 mt-1">Pay</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
