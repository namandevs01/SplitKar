const { validationResult } = require('express-validator');
const { User } = require('../models/mysql/index');
const MongoUser = require('../models/mongo/UserProfile');
const Notification = require('../models/mongo/Notification');
const { generateToken } = require('../middleware/auth');

const register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { name, email, password, phone } = req.body;

    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Email already registered' });
    }

    const user = await User.create({ name, email, password, phone, authProvider: 'local' });

    await MongoUser.create({
      userId: user.id,
      preferences: { currency: 'INR', language: 'en' },
    });

    await Notification.create({
      userId: user.id,
      type: 'general',
      title: 'Welcome to SplitKar! 🎉',
      message: `Hey ${name}, start by creating a group and adding expenses.`,
    });

    const token = generateToken(user.id);

    res.status(201).json({
      success: true,
      message: 'Registered successfully',
      token,
      user: user.toSafeObject(),
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user || !user.password) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account deactivated' });
    }

    const token = generateToken(user.id);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: user.toSafeObject(),
    });
  } catch (error) {
    next(error);
  }
};

const googleCallback = async (req, res) => {
  try {
    const token = generateToken(req.user.id);
    res.redirect(`${process.env.CLIENT_URL}/auth/callback?token=${token}`);
  } catch (error) {
    res.redirect(`${process.env.CLIENT_URL}/login?error=oauth_failed`);
  }
};

const sendOtp = async (req, res, next) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ success: false, message: 'Phone is required' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 10 * 60 * 1000);

    let user = await User.findOne({ where: { phone } });
    if (!user) {
      user = await User.create({
        name: `User${phone.slice(-4)}`,
        phone,
        authProvider: 'phone',
        isVerified: false,
        otpCode: otp,
        otpExpiry: expiry,
      });
      await MongoUser.create({ userId: user.id, preferences: { currency: 'INR' } });
    } else {
      await user.update({ otpCode: otp, otpExpiry: expiry });
    }

    console.log(`📱 OTP for ${phone}: ${otp}`);

    res.json({ success: true, message: 'OTP sent successfully', ...(process.env.NODE_ENV === 'development' && { otp }) });
  } catch (error) {
    next(error);
  }
};

const verifyOtp = async (req, res, next) => {
  try {
    const { phone, otp } = req.body;
    if (!phone || !otp) return res.status(400).json({ success: false, message: 'Phone and OTP are required' });

    const user = await User.findOne({ where: { phone } });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (user.otpCode !== otp) return res.status(400).json({ success: false, message: 'Invalid OTP' });
    if (new Date() > new Date(user.otpExpiry)) return res.status(400).json({ success: false, message: 'OTP expired' });

    await user.update({ isVerified: true, otpCode: null, otpExpiry: null });
    const token = generateToken(user.id);

    res.json({ success: true, message: 'Phone verified', token, user: user.toSafeObject() });
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    const mongoProfile = await MongoUser.findOne({ userId: req.user.id });
    res.json({ success: true, user: { ...req.user.toJSON(), profile: mongoProfile } });
  } catch (error) {
    next(error);
  }
};

const updateMe = async (req, res, next) => {
  try {
    const { name, phone, bio, upiId, avatar } = req.body;
    await req.user.update({ name, phone });
    const profile = await MongoUser.findOneAndUpdate(
      { userId: req.user.id },
      { bio, upiId, avatar },
      { new: true, upsert: true }
    );
    res.json({ success: true, user: { ...req.user.toJSON(), profile } });
  } catch (error) {
    next(error);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findByPk(req.user.id);
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    await user.update({ password: newPassword });
    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, googleCallback, sendOtp, verifyOtp, getMe, updateMe, changePassword };
