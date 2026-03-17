const { Expense, ExpenseShare, GroupMember, User, Group } = require('../models/mysql/index');
const ActivityLog = require('../models/mongo/ActivityLog');
const Notification = require('../models/mongo/Notification');
const { emitToGroup } = require('../socket/emitter');
const { sequelize } = require('../config/mysql');

// Split calculation helpers
const calculateShares = (totalAmount, splitType, members, splitData) => {
  const shares = [];
  const total = parseFloat(totalAmount);

  switch (splitType) {
    case 'equal': {
      const each = parseFloat((total / members.length).toFixed(4));
      members.forEach((m) => shares.push({ userId: m.userId, shareValue: 1, amountOwed: each }));
      break;
    }
    case 'percentage': {
      // splitData: [{ userId, percentage }]
      let totalPct = splitData.reduce((s, d) => s + parseFloat(d.percentage), 0);
      if (Math.abs(totalPct - 100) > 0.01) throw new Error('Percentages must sum to 100');
      splitData.forEach((d) => {
        shares.push({ userId: d.userId, shareValue: parseFloat(d.percentage), amountOwed: parseFloat(((d.percentage / 100) * total).toFixed(4)) });
      });
      break;
    }
    case 'exact': {
      // splitData: [{ userId, amount }]
      const sumExact = splitData.reduce((s, d) => s + parseFloat(d.amount), 0);
      if (Math.abs(sumExact - total) > 0.01) throw new Error('Exact amounts must sum to total');
      splitData.forEach((d) => {
        shares.push({ userId: d.userId, shareValue: parseFloat(d.amount), amountOwed: parseFloat(d.amount) });
      });
      break;
    }
    case 'share': {
      // splitData: [{ userId, shares }]
      const totalShares = splitData.reduce((s, d) => s + parseFloat(d.shares), 0);
      splitData.forEach((d) => {
        const owed = parseFloat(((d.shares / totalShares) * total).toFixed(4));
        shares.push({ userId: d.userId, shareValue: parseFloat(d.shares), amountOwed: owed });
      });
      break;
    }
    default:
      throw new Error('Invalid split type');
  }
  return shares;
};

// @desc    Add expense
// POST /api/groups/:groupId/expenses
const addExpense = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { groupId } = req.params;
    const { description, totalAmount, category, splitType, splitData, date, notes } = req.body;

    // Verify membership
    const membership = await GroupMember.findOne({ where: { groupId, userId: req.user.id, isActive: true } });
    if (!membership) return res.status(403).json({ success: false, message: 'Not a group member' });

    const group = await Group.findByPk(groupId);
    if (!group) return res.status(404).json({ success: false, message: 'Group not found' });

    // Get all active members
    const members = await GroupMember.findAll({ where: { groupId, isActive: true } });

    // Calculate shares
    const shares = calculateShares(totalAmount, splitType, members, splitData);

    // Create expense
    const expense = await Expense.create({
      groupId, paidBy: req.user.id, description, totalAmount, category,
      splitType, date: date || new Date(), notes,
    }, { transaction: t });

    // Create expense shares
    await ExpenseShare.bulkCreate(
      shares.map((s) => ({ ...s, expenseId: expense.id })),
      { transaction: t }
    );

    await t.commit();

    // Notify all group members
    for (const member of members) {
      if (member.userId !== req.user.id) {
        await Notification.create({
          userId: member.userId, type: 'expense_added',
          title: `New expense in "${group.name}"`,
          message: `${req.user.name} added "${description}" - ₹${totalAmount}`,
          data: { groupId, expenseId: expense.id },
        });
      }
    }

    await ActivityLog.create({
      groupId: parseInt(groupId), userId: req.user.id, userName: req.user.name,
      action: 'expense_added',
      description: `${req.user.name} added "${description}" ₹${totalAmount}`,
      metadata: { expenseId: expense.id, amount: totalAmount, splitType },
    });

    const fullExpense = await Expense.findByPk(expense.id, {
      include: [
        { model: ExpenseShare, as: 'shares', include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email'] }] },
        { model: User, as: 'payer', attributes: ['id', 'name', 'email'] },
      ],
    });

    emitToGroup(parseInt(groupId), 'expense_added', { expense: fullExpense });
    res.status(201).json({ success: true, expense: fullExpense });
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

// @desc    Get expenses for group
// GET /api/groups/:groupId/expenses
const getExpenses = async (req, res, next) => {
  try {
    const { groupId } = req.params;
    const { page = 1, limit = 20, category } = req.query;

    const where = { groupId };
    if (category) where.category = category;

    const { count, rows: expenses } = await Expense.findAndCountAll({
      where,
      include: [
        { model: ExpenseShare, as: 'shares', include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email'] }] },
        { model: User, as: 'payer', attributes: ['id', 'name', 'email'] },
      ],
      order: [['date', 'DESC'], ['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
    });

    res.json({ success: true, expenses, pagination: { total: count, page: parseInt(page), pages: Math.ceil(count / limit) } });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single expense
// GET /api/groups/:groupId/expenses/:id
const getExpense = async (req, res, next) => {
  try {
    const expense = await Expense.findByPk(req.params.id, {
      include: [
        { model: ExpenseShare, as: 'shares', include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email'] }] },
        { model: User, as: 'payer', attributes: ['id', 'name', 'email'] },
      ],
    });
    if (!expense) return res.status(404).json({ success: false, message: 'Expense not found' });
    res.json({ success: true, expense });
  } catch (error) {
    next(error);
  }
};

// @desc    Update expense
// PUT /api/groups/:groupId/expenses/:id
const updateExpense = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const expense = await Expense.findByPk(req.params.id);
    if (!expense) return res.status(404).json({ success: false, message: 'Expense not found' });
    if (expense.paidBy !== req.user.id) return res.status(403).json({ success: false, message: 'Only the payer can edit this expense' });

    const { description, totalAmount, category, splitType, splitData, date, notes } = req.body;

    // Recalculate shares
    const members = await GroupMember.findAll({ where: { groupId: expense.groupId, isActive: true } });
    const shares = calculateShares(totalAmount, splitType, members, splitData);

    await expense.update({ description, totalAmount, category, splitType, date, notes }, { transaction: t });
    await ExpenseShare.destroy({ where: { expenseId: expense.id }, transaction: t });
    await ExpenseShare.bulkCreate(shares.map((s) => ({ ...s, expenseId: expense.id })), { transaction: t });

    await t.commit();

    const updatedExpense = await Expense.findByPk(expense.id, {
      include: [
        { model: ExpenseShare, as: 'shares', include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email'] }] },
        { model: User, as: 'payer', attributes: ['id', 'name', 'email'] },
      ],
    });

    await ActivityLog.create({
      groupId: expense.groupId, userId: req.user.id, userName: req.user.name,
      action: 'expense_updated', description: `${req.user.name} updated expense "${description}"`,
    });

    emitToGroup(expense.groupId, 'expense_updated', { expense: updatedExpense });
    res.json({ success: true, expense: updatedExpense });
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

// @desc    Delete expense
// DELETE /api/groups/:groupId/expenses/:id
const deleteExpense = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const expense = await Expense.findByPk(req.params.id);
    if (!expense) return res.status(404).json({ success: false, message: 'Expense not found' });

    const isAdmin = await GroupMember.findOne({ where: { groupId: expense.groupId, userId: req.user.id, role: 'admin' } });
    if (expense.paidBy !== req.user.id && !isAdmin) return res.status(403).json({ success: false, message: 'Not authorized' });

    await ExpenseShare.destroy({ where: { expenseId: expense.id }, transaction: t });
    await expense.destroy({ transaction: t });
    await t.commit();

    await ActivityLog.create({
      groupId: expense.groupId, userId: req.user.id, userName: req.user.name,
      action: 'expense_deleted', description: `${req.user.name} deleted expense "${expense.description}"`,
    });

    emitToGroup(expense.groupId, 'expense_deleted', { expenseId: expense.id });
    res.json({ success: true, message: 'Expense deleted' });
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

// @desc    Get expense analytics for group
// GET /api/groups/:groupId/analytics
const getAnalytics = async (req, res, next) => {
  try {
    const { groupId } = req.params;
    const expenses = await Expense.findAll({ where: { groupId }, include: [{ model: ExpenseShare, as: 'shares' }] });

    const totalSpend = expenses.reduce((s, e) => s + parseFloat(e.totalAmount), 0);
    const byCategory = {};
    const byMonth = {};

    expenses.forEach((e) => {
      byCategory[e.category] = (byCategory[e.category] || 0) + parseFloat(e.totalAmount);
      const month = new Date(e.date).toISOString().slice(0, 7);
      byMonth[month] = (byMonth[month] || 0) + parseFloat(e.totalAmount);
    });

    res.json({ success: true, analytics: { totalSpend, byCategory, byMonth, expenseCount: expenses.length } });
  } catch (error) {
    next(error);
  }
};

module.exports = { addExpense, getExpenses, getExpense, updateExpense, deleteExpense, getAnalytics };
