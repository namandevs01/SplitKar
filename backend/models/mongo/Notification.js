const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    userId: { type: Number, required: true, index: true },
    type: {
      type: String,
      enum: [
        'expense_added', 'expense_updated', 'expense_deleted',
        'settlement_requested', 'settlement_completed', 'settlement_failed',
        'group_invite', 'group_joined', 'group_left',
        'payment_reminder', 'balance_update', 'general',
      ],
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    data: { type: mongoose.Schema.Types.Mixed, default: {} },
    isRead: { type: Boolean, default: false },
    readAt: { type: Date, default: null },
  },
  { timestamps: true }
);

notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, isRead: 1 });

module.exports = mongoose.model('Notification', notificationSchema);
