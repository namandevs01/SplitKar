import { useState, useCallback } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import useAuthStore from '../context/authStore';

export const useSettlement = (onSuccess) => {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);

  const initiateRazorpay = useCallback(async ({ groupId, payeeId, payeeName, amount }) => {
    setLoading(true);
    try {
      const res = await api.post('/settlements/initiate', { groupId, payeeId, amount });
      const { razorpayOrder, settlement } = res.data;

      const options = {
        key: razorpayOrder.key,
        amount: razorpayOrder.amount,
        currency: 'INR',
        name: 'SplitKar',
        description: `Pay ₹${amount} to ${payeeName}`,
        order_id: razorpayOrder.id,
        image: '',
        handler: async (response) => {
          try {
            await api.post('/settlements/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              settlementId: settlement.id,
            });
            toast.success(`✅ ₹${amount} paid to ${payeeName}!`);
            onSuccess?.();
          } catch {
            toast.error('Payment verification failed. Contact support.');
          }
        },
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
        },
        notes: { groupId: String(groupId) },
        theme: { color: '#22c55e' },
        modal: {
          ondismiss: () => {
            toast('Payment cancelled', { icon: 'ℹ️' });
          },
        },
      };

      if (!window.Razorpay) {
        toast.error('Razorpay SDK not loaded. Please refresh the page.');
        return;
      }

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (response) => {
        toast.error(`Payment failed: ${response.error.description}`);
      });
      rzp.open();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to initiate payment');
    } finally {
      setLoading(false);
    }
  }, [user, onSuccess]);

  const recordManual = useCallback(async ({ groupId, payeeId, amount, notes }) => {
    setLoading(true);
    try {
      await api.post('/settlements/manual', { groupId, payeeId, amount, notes });
      toast.success('Manual payment recorded');
      onSuccess?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to record payment');
    } finally {
      setLoading(false);
    }
  }, [onSuccess]);

  return { initiateRazorpay, recordManual, loading };
};
