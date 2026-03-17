const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema(
  {
    groupId: { type: Number, required: true, index: true },
    userId: { type: Number, required: true },
    userName: { type: String, required: true },
    action: {
      type: String,
      enum: [
        'expense_added', 'expense_updated', 'expense_deleted',
        'settlement_initiated', 'settlement_completed',
        'member_added', 'member_removed', 'group_created', 'group_updated',
      ],
      required: true,
    },
    description: { type: String, required: true },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

activityLogSchema.index({ groupId: 1, createdAt: -1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
