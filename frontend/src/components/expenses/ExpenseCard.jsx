import { format } from 'date-fns';
import { Receipt, Trash2, Edit2, Tag } from 'lucide-react';
import useAuthStore from '../../context/authStore';

const CATEGORY_COLORS = {
  food: 'text-orange-400 bg-orange-400/10',
  transport: 'text-blue-400 bg-blue-400/10',
  accommodation: 'text-purple-400 bg-purple-400/10',
  entertainment: 'text-pink-400 bg-pink-400/10',
  utilities: 'text-cyan-400 bg-cyan-400/10',
  shopping: 'text-yellow-400 bg-yellow-400/10',
  health: 'text-red-400 bg-red-400/10',
  other: 'text-slate-400 bg-slate-400/10',
};

export default function ExpenseCard({ expense, onDelete, onEdit, isAdmin }) {
  const { user } = useAuthStore();
  const fmt = (n) => `₹${parseFloat(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
  const myShare = expense.shares?.find((s) => s.userId === user?.id);
  const iAmPayer = expense.paidBy === user?.id;
  const catClass = CATEGORY_COLORS[expense.category] || CATEGORY_COLORS.other;
  const canEdit = iAmPayer || isAdmin;

  return (
    <div className="card p-4 flex items-start gap-4 hover:border-white/10 transition-all duration-200 group">
      {/* Category icon */}
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${catClass}`}>
        <Receipt size={18} />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-medium text-white truncate">{expense.description}</p>
            <p className="text-xs text-slate-500 mt-0.5">
              {iAmPayer
                ? <span className="text-brand-400">You paid</span>
                : <><span className="text-slate-300">{expense.payer?.name}</span> paid</>
              }
              {' · '}{format(new Date(expense.date || expense.createdAt), 'dd MMM yyyy')}
            </p>
          </div>

          {/* Amount */}
          <div className="text-right shrink-0">
            <p className="font-mono font-bold text-white">{fmt(expense.totalAmount)}</p>
            <span className={`text-xs capitalize px-2 py-0.5 rounded-full font-medium ${catClass}`}>
              {expense.splitType}
            </span>
          </div>
        </div>

        {/* Share chips */}
        {expense.shares?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2.5">
            {expense.shares.map((s) => (
              <span key={s.id}
                className={`text-xs px-2 py-0.5 rounded-full transition-all ${
                  s.userId === user?.id
                    ? 'bg-brand-500/20 text-brand-300 border border-brand-500/30'
                    : 'bg-white/5 text-slate-400'
                }`}>
                {s.user?.name?.split(' ')[0]}: {fmt(s.amountOwed)}
                {s.isPaid && ' ✓'}
              </span>
            ))}
          </div>
        )}

        {/* My balance impact */}
        {myShare && (
          <div className="mt-2 flex items-center gap-2">
            <div className={`inline-flex items-center gap-1 text-xs font-medium ${iAmPayer ? 'text-brand-400' : 'text-red-400'}`}>
              <Tag size={11} />
              {iAmPayer
                ? `You lent ${fmt(parseFloat(expense.totalAmount) - parseFloat(myShare.amountOwed))}`
                : `Your share: ${fmt(myShare.amountOwed)}`}
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      {canEdit && (
        <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {onEdit && (
            <button onClick={() => onEdit(expense)} className="btn-ghost p-1.5 text-slate-500 hover:text-brand-400">
              <Edit2 size={14} />
            </button>
          )}
          {onDelete && (
            <button onClick={() => onDelete(expense.id)} className="btn-ghost p-1.5 text-slate-500 hover:text-red-400">
              <Trash2 size={14} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
