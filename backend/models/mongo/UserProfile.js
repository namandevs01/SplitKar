const mongoose = require('mongoose');

const userProfileSchema = new mongoose.Schema(
  {
    userId: { type: Number, required: true, unique: true, index: true },
    avatar: { type: String, default: '' },
    bio: { type: String, default: '' },
    upiId: { type: String, default: '' },
    preferences: {
      currency: { type: String, default: 'INR' },
      language: { type: String, default: 'en' },
      notificationsEnabled: { type: Boolean, default: true },
      theme: { type: String, enum: ['light', 'dark'], default: 'light' },
    },
    friends: [{ type: Number }], // MySQL user IDs
    totalOwed: { type: Number, default: 0 },
    totalOwes: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('UserProfile', userProfileSchema);
