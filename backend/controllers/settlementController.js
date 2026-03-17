const Razorpay = require('razorpay');
const crypto = require('crypto');
const { Settlement, User, Group, GroupMember } = require('../models/mysql/index');
const Notification = require('../models/mongo/Notification');
const ActivityLog = require('../models/mongo/ActivityLog');
const { emitToUser, emitToGroup } = require('../socket/emitter');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// @desc    Initiate settlement (create Razorpay order)
// POST /api/settlements/initiate
const initiateSettlement = async (req, res, next) => {
  try {
    const { groupId, payeeId, amount, notes } = req.body;

    const group = await Group.findByPk(groupId);
    if (!group) return res.status(404).json({ success: false, message: 'Group not found' });

    const payee = await User.findByPk(payeeId);
    if (!payee) return res.status(404).json({ success: false, message: 'Payee not found' });

    const amountPaise = Math.round(parseFloat(amount) * 100); // Razorpay uses paise

    // Create Razorpay order
    const order = await razorpay.orders.create({
      amount: amountPaise,
      currency: 'INR',
      receipt: `sk_${Date.now()}`,
      notes: { groupId: groupId.toString(), payerId: req.user.id.toString(), payeeId: payeeId.toString() },
    });

    // Create settlement record
    const settlement = await Settlement.create({
      groupId, payerId: req.user.id, payeeId, amount,
      status: 'initiated', razorpayOrderId: order.id, notes,
    });

    res.json({
      success: true,
      settlement,
      razorpayOrder: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
        key: process.env.RAZORPAY_KEY_ID,
      },
      payee: { name: payee.name, email: payee.email },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify Razorpay payment & complete settlement
// POST /api/settlements/verify
const verifySettlement = async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, settlementId } = req.body;

    // Verify signature
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      await Settlement.update({ status: 'failed' }, { where: { id: settlementId } });
      return res.status(400).json({ success: false, message: 'Payment verification failed' });
    }

    // Update settlement
    const settlement = await Settlement.update(
      { status: 'completed', razorpayPaymentId: razorpay_payment_id, settledAt: new Date() },
      { where: { id: settlementId }, returning: true }
    );

    const updatedSettlement = await Settlement.findByPk(settlementId, {
      include: [
        { model: User, as: 'payer', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'payee', attributes: ['id', 'name', 'email'] },
      ],
    });

    // Notify payee
    await Notification.create({
      userId: updatedSettlement.payeeId, type: 'settlement_completed',
      title: 'Payment received! 💰',
      message: `${updatedSettlement.payer.name} paid you ₹${updatedSettlement.amount}`,
      data: { settlementId, groupId: updatedSettlement.groupId },
    });

    await ActivityLog.create({
      groupId: updatedSettlement.groupId, userId: req.user.id,
      userName: updatedSettlement.payer.name, action: 'settlement_completed',
      description: `${updatedSettlement.payer.name} paid ₹${updatedSettlement.amount} to ${updatedSettlement.payee.name}`,
      metadata: { settlementId, amount: updatedSettlement.amount },
    });

    emitToUser(updatedSettlement.payeeId, 'settlement_completed', { settlement: updatedSettlement });
    emitToGroup(updatedSettlement.groupId, 'balance_updated', { groupId: updatedSettlement.groupId });

    res.json({ success: true, message: 'Payment verified successfully', settlement: updatedSettlement });
  } catch (error) {
    next(error);
  }
};

// @desc    Get settlements for a group
// GET /api/groups/:groupId/settlements
const getGroupSettlements = async (req, res, next) => {
  try {
    const settlements = await Settlement.findAll({
      where: { groupId: req.params.groupId },
      include: [
        { model: User, as: 'payer', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'payee', attributes: ['id', 'name', 'email'] },
      ],
      order: [['createdAt', 'DESC']],
    });
    res.json({ success: true, settlements });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all settlements for current user
// GET /api/settlements/my
const getMySettlements = async (req, res, next) => {
  try {
    const { Op } = require('sequelize');
    const settlements = await Settlement.findAll({
      where: { [Op.or]: [{ payerId: req.user.id }, { payeeId: req.user.id }] },
      include: [
        { model: User, as: 'payer', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'payee', attributes: ['id', 'name', 'email'] },
        { model: Group, attributes: ['id', 'name'] },
      ],
      order: [['createdAt', 'DESC']],
    });
    res.json({ success: true, settlements });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark settlement as paid (manual/offline)
// POST /api/settlements/manual
const manualSettlement = async (req, res, next) => {
  try {
    const { groupId, payeeId, amount, notes } = req.body;

    const settlement = await Settlement.create({
      groupId, payerId: req.user.id, payeeId, amount,
      status: 'completed', settledAt: new Date(), notes: notes || 'Manual settlement',
    });

    const payee = await User.findByPk(payeeId);
    await Notification.create({
      userId: payeeId, type: 'settlement_completed',
      title: 'Manual payment recorded',
      message: `${req.user.name} marked ₹${amount} as paid to you`,
      data: { settlementId: settlement.id, groupId },
    });

    await ActivityLog.create({
      groupId, userId: req.user.id, userName: req.user.name,
      action: 'settlement_completed',
      description: `${req.user.name} manually recorded ₹${amount} payment to ${payee.name}`,
    });

    emitToUser(payeeId, 'settlement_completed', { settlement });
    emitToGroup(groupId, 'balance_updated', { groupId });

    res.status(201).json({ success: true, settlement });
  } catch (error) {
    next(error);
  }
};

module.exports = { initiateSettlement, verifySettlement, getGroupSettlements, getMySettlements, manualSettlement };
