import { useState, useEffect, useRef } from 'react';
import { X, QrCode, Copy, CheckCircle, Download, Smartphone } from 'lucide-react';
import toast from 'react-hot-toast';

// Generates a simple QR code placeholder using a public API
// In production replace with a proper QR library like qrcode.react
const QR_API = (text) =>
  `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(text)}&bgcolor=0a0f1e&color=22c55e&qzone=2`;

export default function QRModal({ isOpen, onClose, amount, payeeName, payeeUpi, onManualConfirm }) {
  const [copied, setCopied] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [notes, setNotes] = useState('');

  const upiString = payeeUpi
    ? `upi://pay?pa=${payeeUpi}&pn=${encodeURIComponent(payeeName)}&am=${amount}&cu=INR&tn=SplitKar+Settlement`
    : `Pay ₹${amount} to ${payeeName} via UPI`;

  const copyUpi = () => {
    navigator.clipboard.writeText(payeeUpi || upiString);
    setCopied(true);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleConfirm = () => {
    onManualConfirm?.(notes);
    setConfirmed(true);
    setTimeout(() => { onClose(); setConfirmed(false); }, 1500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative card p-6 w-full max-w-sm animate-slide-up">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <QrCode size={20} className="text-brand-400" />
            <h2 className="section-title">Pay via QR / UPI</h2>
          </div>
          <button onClick={onClose} className="btn-ghost p-1.5"><X size={18} /></button>
        </div>

        {/* Amount */}
        <div className="text-center mb-5">
          <p className="text-slate-400 text-sm">Amount to pay</p>
          <p className="font-display text-4xl font-bold text-brand-400 mt-1">₹{parseFloat(amount).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</p>
          <p className="text-slate-500 text-sm mt-1">to <span className="text-white font-medium">{payeeName}</span></p>
        </div>

        {/* QR Code */}
        <div className="flex justify-center mb-4">
          <div className="p-3 rounded-2xl bg-white">
            <img
              src={QR_API(upiString)}
              alt="UPI QR Code"
              width={160}
              height={160}
              className="rounded-lg"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          </div>
        </div>

        {/* UPI ID copy */}
        {payeeUpi && (
          <div className="flex items-center gap-2 p-3 bg-white/5 rounded-xl border border-white/10 mb-4">
            <Smartphone size={15} className="text-brand-400 shrink-0" />
            <span className="text-sm text-slate-300 flex-1 font-mono truncate">{payeeUpi}</span>
            <button onClick={copyUpi} className={`shrink-0 transition-all ${copied ? 'text-brand-400' : 'text-slate-500 hover:text-white'}`}>
              {copied ? <CheckCircle size={16} /> : <Copy size={16} />}
            </button>
          </div>
        )}

        <p className="text-xs text-slate-500 text-center mb-4">
          Scan the QR code with any UPI app (GPay, PhonePe, Paytm, etc.)
        </p>

        {/* Confirm manual */}
        <div className="space-y-3 border-t border-white/[0.06] pt-4">
          <p className="text-xs text-slate-400">After paying, confirm so we can update the balance:</p>
          <input
            className="input text-sm py-2"
            placeholder="Optional note (e.g. GPay transfer)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          <button
            onClick={handleConfirm}
            className={`btn-primary w-full flex items-center justify-center gap-2 ${confirmed ? 'bg-brand-600' : ''}`}
          >
            {confirmed ? <><CheckCircle size={16} /> Payment Confirmed!</> : 'I\'ve Paid — Mark as Settled'}
          </button>
        </div>
      </div>
    </div>
  );
}
