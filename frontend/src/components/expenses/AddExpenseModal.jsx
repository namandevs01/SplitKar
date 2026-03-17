import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { X, Plus, Receipt, IndianRupee } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

const SPLIT_TYPES = [
  { id: 'equal', label: 'Equal', desc: 'Split evenly' },
  { id: 'percentage', label: '%', desc: 'By percent' },
  { id: 'exact', label: 'Exact', desc: 'Set amounts' },
  { id: 'share', label: 'Shares', desc: 'By ratio' },
];

const CATEGORIES = ['food', 'transport', 'accommodation', 'entertainment', 'utilities', 'shopping', 'health', 'other'];

export default function AddExpenseModal({ isOpen, onClose, groupId, members, onSuccess }) {
  const [splitType, setSplitType] = useState('equal');
  const [splitData, setSplitData] = useState([]);
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm({
    defaultValues: { date: new Date().toISOString().split('T')[0], category: 'food' },
  });
  const totalAmount = parseFloat(watch('totalAmount') || 0);

  useEffect(() => {
    if (!members?.length) return;
    if (splitType === 'equal') {
      setSplitData(members.map((m) => ({ userId: m.id, name: m.name })));
    } else if (splitType === 'percentage') {
      const pct = parseFloat((100 / members.length).toFixed(2));
      setSplitData(members.map((m) => ({ userId: m.id, name: m.name, percentage: pct })));
    } else if (splitType === 'exact') {
      const each = totalAmount ? parseFloat((totalAmount / members.length).toFixed(2)) : 0;
      setSplitData(members.map((m) => ({ userId: m.id, name: m.name, amount: each })));
    } else if (splitType === 'share') {
      setSplitData(members.map((m) => ({ userId: m.id, name: m.name, shares: 1 })));
    }
  }, [splitType, members]);

  // Update exact amounts when total changes
  useEffect(() => {
    if (splitType === 'exact' && totalAmount > 0) {
      const each = parseFloat((totalAmount / (splitData.length || 1)).toFixed(2));
      setSplitData((prev) => prev.map((d) => ({ ...d, amount: each })));
    }
  }, [totalAmount, splitType]);

  const updateSplitField = (index, field, value) => {
    setSplitData((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: parseFloat(value) || 0 };
      return updated;
    });
  };

  const getSplitPreview = (sd) => {
    if (!totalAmount) return '₹0';
    if (splitType === 'equal') return `₹${(totalAmount / (splitData.length || 1)).toFixed(2)}`;
    if (splitType === 'percentage') return `₹${((sd.percentage / 100) * totalAmount).toFixed(2)}`;
    if (splitType === 'exact') return `₹${(sd.amount || 0).toFixed(2)}`;
    if (splitType === 'share') {
      const total = splitData.reduce((s, d) => s + (d.shares || 1), 0);
      return `₹${(((sd.shares || 1) / total) * totalAmount).toFixed(2)}`;
    }
    return '';
  };

  const validateSplit = () => {
    if (splitType === 'percentage') {
      const total = splitData.reduce((s, d) => s + (d.percentage || 0), 0);
      if (Math.abs(total - 100) > 0.1) { toast.error(`Percentages must add up to 100% (currently ${total.toFixed(1)}%)`); return false; }
    }
    if (splitType === 'exact') {
      const total = splitData.reduce((s, d) => s + (d.amount || 0), 0);
      if (Math.abs(total - totalAmount) > 0.1) { toast.error(`Exact amounts must sum to ₹${totalAmount} (currently ₹${total.toFixed(2)})`); return false; }
    }
    return true;
  };

  const onSubmit = async (data) => {
    if (!validateSplit()) return;
    setSaving(true);
    try {
      const res = await api.post(`/groups/${groupId}/expenses`, {
        ...data, splitType, splitData,
      });
      toast.success('Expense added!');
      onSuccess?.(res.data.expense);
      reset();
      setSplitType('equal');
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add expense');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative card w-full sm:max-w-lg animate-slide-up rounded-t-3xl sm:rounded-2xl max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-slate-900/95 backdrop-blur-sm flex items-center justify-between p-5 pb-4 border-b border-white/[0.06] z-10 rounded-t-3xl sm:rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand-500/15 flex items-center justify-center text-brand-400">
              <Receipt size={18} />
            </div>
            <h2 className="section-title">Add Expense</h2>
          </div>
          <button onClick={onClose} className="btn-ghost p-1.5"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-5">
          {/* Description */}
          <div>
            <label className="label">What was it for?</label>
            <input className="input text-lg" placeholder="Dinner, cab fare, groceries..."
              {...register('description', { required: 'Please describe the expense' })} />
            {errors.description && <p className="text-red-400 text-xs mt-1">{errors.description.message}</p>}
          </div>

          {/* Amount + Category */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Total Amount</label>
              <div className="relative">
                <IndianRupee size={15} className="absolute left-3.5 top-3.5 text-slate-500" />
                <input className="input pl-9 font-mono text-lg" type="number" step="0.01" min="0.01" placeholder="0.00"
                  {...register('totalAmount', { required: 'Amount is required', min: { value: 0.01, message: 'Must be > 0' } })} />
              </div>
              {errors.totalAmount && <p className="text-red-400 text-xs mt-1">{errors.totalAmount.message}</p>}
            </div>
            <div>
              <label className="label">Category</label>
              <select className="input capitalize" {...register('category')}>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c} className="bg-slate-900 capitalize">{c}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Date + Notes */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Date</label>
              <input className="input" type="date" {...register('date')} />
            </div>
            <div>
              <label className="label">Notes <span className="text-slate-600 font-normal">(optional)</span></label>
              <input className="input" placeholder="Any notes" {...register('notes')} />
            </div>
          </div>

          {/* Split type selector */}
          <div>
            <label className="label">How to split?</label>
            <div className="grid grid-cols-4 gap-2">
              {SPLIT_TYPES.map(({ id, label, desc }) => (
                <button key={id} type="button" onClick={() => setSplitType(id)}
                  className={`flex flex-col items-center gap-1 p-3 rounded-xl border text-center transition-all
                    ${splitType === id
                      ? 'border-brand-500 bg-brand-500/15 text-brand-400'
                      : 'border-white/10 text-slate-400 hover:border-white/20 hover:text-white'}`}>
                  <span className="font-bold text-sm">{label}</span>
                  <span className="text-xs opacity-70">{desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Split details (non-equal) */}
          {splitType !== 'equal' && splitData.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="label mb-0">Split Details</label>
                {splitType === 'percentage' && (
                  <span className={`text-xs font-mono ${Math.abs(splitData.reduce((s, d) => s + (d.percentage || 0), 0) - 100) < 0.1 ? 'text-brand-400' : 'text-red-400'}`}>
                    {splitData.reduce((s, d) => s + (d.percentage || 0), 0).toFixed(1)}%
                  </span>
                )}
                {splitType === 'exact' && (
                  <span className={`text-xs font-mono ${Math.abs(splitData.reduce((s, d) => s + (d.amount || 0), 0) - totalAmount) < 0.1 ? 'text-brand-400' : 'text-red-400'}`}>
                    ₹{splitData.reduce((s, d) => s + (d.amount || 0), 0).toFixed(2)} / ₹{totalAmount}
                  </span>
                )}
              </div>
              <div className="space-y-2">
                {splitData.map((sd, i) => (
                  <div key={sd.userId} className="flex items-center gap-3 p-2.5 bg-white/[0.03] rounded-xl border border-white/[0.05]">
                    <div className="w-7 h-7 rounded-lg bg-brand-500/10 flex items-center justify-center text-brand-400 text-xs font-bold shrink-0">
                      {sd.name?.[0]?.toUpperCase()}
                    </div>
                    <span className="text-sm text-slate-300 flex-1 truncate">{sd.name}</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        step={splitType === 'share' ? '1' : '0.01'}
                        min="0"
                        value={sd[splitType === 'percentage' ? 'percentage' : splitType === 'exact' ? 'amount' : 'shares'] || ''}
                        onChange={(e) => updateSplitField(i, splitType === 'percentage' ? 'percentage' : splitType === 'exact' ? 'amount' : 'shares', e.target.value)}
                        placeholder={splitType === 'percentage' ? '%' : splitType === 'share' ? 'shares' : '₹'}
                        className="input py-1.5 text-sm text-right w-20"
                      />
                      <span className="text-xs text-brand-400 font-mono w-16 text-right">{getSplitPreview(sd)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Equal split preview */}
          {splitType === 'equal' && totalAmount > 0 && members?.length > 0 && (
            <div className="p-3 bg-brand-500/5 rounded-xl border border-brand-500/15 text-sm text-brand-300 text-center">
              Each person pays <span className="font-mono font-bold">₹{(totalAmount / members.length).toFixed(2)}</span>
            </div>
          )}

          {/* Submit */}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {saving ? <span className="animate-pulse">Adding...</span> : <><Plus size={16} />Add Expense</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
