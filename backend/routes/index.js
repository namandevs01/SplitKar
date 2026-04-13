const express = require('express');
const { body } = require('express-validator');
const passport = require('../config/passport');
const { protect } = require('../middleware/auth');

const { register, login, googleCallback, sendOtp, verifyOtp, getMe, updateMe, changePassword,} = require('../controllers/authController');
const {createGroup, getMyGroups, getGroup, updateGroup,addMember, removeMember, deleteGroup, getActivity,} = require('../controllers/groupController');
const {addExpense, getExpenses, getExpense,updateExpense, deleteExpense, getAnalytics,} = require('../controllers/expenseController');
const { initiateSettlement, verifySettlement,getGroupSettlements, getMySettlements, manualSettlement} = require('../controllers/settlementController');
const { getNotifications, markRead, markAllRead, deleteNotification } = require('../controllers/notificationController');
const { searchUsers, getUserProfile } = require('../controllers/userController');

const router = express.Router();

router.post('/auth/register', [
  body('name').notEmpty().trim(),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
], register);

router.post('/auth/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
], login);

router.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/auth/google/callback', passport.authenticate('google', { session: false }), googleCallback);

router.post('/auth/send-otp', sendOtp);
router.post('/auth/verify-otp', verifyOtp);

router.get('/auth/me', protect, getMe);
router.put('/auth/me', protect, updateMe);
router.put('/auth/change-password', protect, changePassword);

router.post('/groups', protect, createGroup);
router.get('/groups', protect, getMyGroups);
router.get('/groups/:id', protect, getGroup);
router.put('/groups/:id', protect, updateGroup);
router.delete('/groups/:id', protect, deleteGroup);
router.post('/groups/:id/members', protect, addMember);
router.delete('/groups/:id/members/:userId', protect, removeMember);
router.get('/groups/:id/activity', protect, getActivity);

router.post('/groups/:groupId/expenses', protect, addExpense);
router.get('/groups/:groupId/expenses', protect, getExpenses);
router.get('/groups/:groupId/expenses/:id', protect, getExpense);
router.put('/groups/:groupId/expenses/:id', protect, updateExpense);
router.delete('/groups/:groupId/expenses/:id', protect, deleteExpense);
router.get('/groups/:groupId/analytics', protect, getAnalytics);

router.post('/settlements/initiate', protect, initiateSettlement);
router.post('/settlements/verify', protect, verifySettlement);
router.post('/settlements/manual', protect, manualSettlement);
router.get('/settlements/my', protect, getMySettlements);
router.get('/groups/:groupId/settlements', protect, getGroupSettlements);

router.get('/users/search', protect, searchUsers);
router.get('/users/:id/profile', protect, getUserProfile);

router.get('/notifications', protect, getNotifications);
router.put('/notifications/read-all', protect, markAllRead);
router.put('/notifications/:id/read', protect, markRead);
router.delete('/notifications/:id', protect, deleteNotification);

module.exports = router;
