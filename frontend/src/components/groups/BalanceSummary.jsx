import { ArrowRight, CreditCard, TrendingUp, TrendingDown } from 'lucide-react';

const fmt = (n) => `₹${parseFloat(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

export default function BalanceSummary({ balances, currentUserId, onPay, onQR }) {
  if (!balances) return null;

  const { memberBalances = [], suggestedTransactions = [] } = balances;
  const myBalance = memberBalances.find((b) => b.userId === currentUserId);

  const myTransactions = suggestedTransactions.filter(
    (tx) => tx.from.userId === currentUserId || tx.to.userId === currentUserId
  );

  return (
    <div className="space-y-4">
      {/* My balance */}
      {myBalance && (
        <div className={`card p-4 border-l-4 ${myBalance.balance >= 0 ? 'border-l-brand-500' : 'border-l-red-500'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Your balance</p>
              <p className={`font-display text-3xl font-bold mt-0.5 ${myBalance.balance >= 0 ? 'text-brand-400' : 'text-red-400'}`}>
                {myBalance.balance >= 0 ? '+' : ''}{fmt(myBalance.balance)}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {myBalance.balance > 0.01
                  ? 'You are owed money'
                  : myBalance.balance < -0.01
                  ? 'You owe money'
                  : 'You\'re all settled up! 🎉'}
              </p>
            </div>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${myBalance.balance >= 0 ? 'bg-brand-500/15 text-brand-400' : 'bg-red-500/15 text-red-400'}`}>
              {myBalance.balance >= 0 ? <TrendingUp size={22} /> : <TrendingDown size={22} />}
            </div>
          </div>
        </div>
      )}

      {/* All member balances */}
      <div className="card p-4">
        <h3 className="text-sm font-semibold text-slate-300 mb-3">Group Balances</h3>
        <div className="space-y-2.5">
          {memberBalances.map((b) => (
            <div key={b.userId} className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-brand-500/10 flex items-center justify-center text-brand-400 text-xs font-bold shrink-0">
                {b.name?.[0]?.toUpperCase()}
              </div>
              <span className="text-sm text-slate-300 flex-1 truncate">
                {b.name}
                {b.userId === currentUserId && <span className="text-slate-600 text-xs ml-1">(you)</span>}
              </span>
              <div className="flex items-center gap-2">
                <div className="w-20 h-1.5 rounded-full bg-white/5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${b.balance >= 0 ? 'bg-brand-500' : 'bg-red-500'}`}
                    style={{ width: `${Math.min(100, Math.abs(b.balance) / 500 * 100)}%` }}
                  />
                </div>
                <span className={`font-mono text-sm font-semibold w-24 text-right ${b.balance >= 0 ? 'text-brand-400' : 'text-red-400'}`}>
                  {b.balance >= 0 ? '+' : ''}{fmt(b.balance)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Suggested settlements */}
      {suggestedTransactions.length > 0 && (
        <div className="card p-4">
          <h3 className="text-sm font-semibold text-slate-300 mb-3">
            Suggested Settlements
            <span className="ml-2 text-xs text-slate-500 font-normal">({suggestedTransactions.length} transaction{suggestedTransactions.length > 1 ? 's' : ''})</span>
          </h3>
          <div className="space-y-2.5">
            {suggestedTransactions.map((tx, i) => {
              const isMyTransaction = tx.from.userId === currentUserId;
              return (
                <div key={i} className={`flex items-center gap-3 p-3 rounded-xl transition-all ${isMyTransaction ? 'bg-red-500/5 border border-red-500/10' : 'bg-white/[0.03] border border-white/[0.05]'}`}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 text-sm">
                      <span className={isMyTransaction ? 'text-red-400 font-medium' : 'text-slate-400'}>
                        {isMyTransaction ? 'You' : tx.from.name}
                      </span>
                      <ArrowRight size={12} className="text-slate-600 shrink-0" />
                      <span className={tx.to.userId === currentUserId ? 'text-brand-400 font-medium' : 'text-slate-300'}>
                        {tx.to.userId === currentUserId ? 'You' : tx.to.name}
                      </span>
                    </div>
                  </div>
                  <span className="font-mono font-bold text-white shrink-0">{fmt(tx.amount)}</span>
                  {isMyTransaction && (
                    <div className="flex items-center gap-1.5 shrink-0">
                      {onQR && (
                        <button onClick={() => onQR(tx)} className="btn-secondary text-xs px-2.5 py-1.5 flex items-center gap-1">
                          QR
                        </button>
                      )}
                      {onPay && (
                        <button onClick={() => onPay(tx)} className="btn-primary text-xs px-2.5 py-1.5">
                          Pay
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {suggestedTransactions.length === 0 && memberBalances.length > 0 && (
        <div className="card p-5 text-center">
          <div className="w-12 h-12 rounded-xl bg-brand-500/10 flex items-center justify-center text-brand-400 mx-auto mb-3">
            <CreditCard size={22} />
          </div>
          <p className="text-white font-semibold">All settled up!</p>
          <p className="text-slate-500 text-sm mt-1">No pending transactions in this group</p>
        </div>
      )}
    </div>
  );
}
