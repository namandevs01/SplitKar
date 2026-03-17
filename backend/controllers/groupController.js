const { User, Group, GroupMember, Expense, Settlement } = require('../models/mysql/index');
const ActivityLog = require('../models/mongo/ActivityLog');
const Notification = require('../models/mongo/Notification');
const { emitToGroup, emitToUser } = require('../socket/emitter');

// @desc    Create group
// POST /api/groups
const createGroup = async (req, res, next) => {
  try {
    const { name, description, category, memberEmails } = req.body;

    const group = await Group.create({
      name, description, category: category || 'other',
      currency: 'INR', createdBy: req.user.id,
    });

    // Add creator as admin
    await GroupMember.create({ groupId: group.id, userId: req.user.id, role: 'admin' });

    // Invite members by email
    const invitedUsers = [];
    if (memberEmails?.length) {
      for (const email of memberEmails) {
        const member = await User.findOne({ where: { email } });
        if (member && member.id !== req.user.id) {
          await GroupMember.create({ groupId: group.id, userId: member.id, role: 'member' });
          invitedUsers.push(member);

          await Notification.create({
            userId: member.id,
            type: 'group_invite',
            title: `Added to "${name}"`,
            message: `${req.user.name} added you to the group "${name}"`,
            data: { groupId: group.id },
          });
          emitToUser(member.id, 'notification', { type: 'group_invite', groupId: group.id, groupName: name });
        }
      }
    }

    await ActivityLog.create({
      groupId: group.id,
      userId: req.user.id,
      userName: req.user.name,
      action: 'group_created',
      description: `${req.user.name} created the group "${name}"`,
      metadata: { memberCount: invitedUsers.length + 1 },
    });

    const fullGroup = await Group.findByPk(group.id, {
      include: [{ model: User, as: 'members', attributes: ['id', 'name', 'email'], through: { attributes: ['role'] } }],
    });

    res.status(201).json({ success: true, group: fullGroup });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all groups for user
// GET /api/groups
const getMyGroups = async (req, res, next) => {
  try {
    const groups = await Group.findAll({
      include: [
        {
          model: User, as: 'members', attributes: ['id', 'name', 'email'],
          through: { attributes: ['role'] },
          where: {}, required: false,
        },
        { model: GroupMember, as: 'groupMembers', where: { userId: req.user.id, isActive: true }, attributes: [] },
      ],
      where: { isActive: true },
    });

    res.json({ success: true, groups });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single group with balances
// GET /api/groups/:id
const getGroup = async (req, res, next) => {
  try {
    const group = await Group.findByPk(req.params.id, {
      include: [
        { model: User, as: 'members', attributes: ['id', 'name', 'email'], through: { attributes: ['role', 'joinedAt'] } },
      ],
    });

    if (!group) return res.status(404).json({ success: false, message: 'Group not found' });

    // Check membership
    const isMember = group.members.some((m) => m.id === req.user.id);
    if (!isMember) return res.status(403).json({ success: false, message: 'Not a member of this group' });

    // Calculate balances using graph algorithm
    const balances = await calculateGroupBalances(group.id, group.members);

    res.json({ success: true, group, balances });
  } catch (error) {
    next(error);
  }
};

// @desc    Update group
// PUT /api/groups/:id
const updateGroup = async (req, res, next) => {
  try {
    const group = await Group.findByPk(req.params.id);
    if (!group) return res.status(404).json({ success: false, message: 'Group not found' });

    const membership = await GroupMember.findOne({ where: { groupId: group.id, userId: req.user.id, role: 'admin' } });
    if (!membership) return res.status(403).json({ success: false, message: 'Admin access required' });

    const { name, description, category } = req.body;
    await group.update({ name, description, category });

    await ActivityLog.create({
      groupId: group.id, userId: req.user.id, userName: req.user.name,
      action: 'group_updated', description: `${req.user.name} updated group settings`,
    });

    emitToGroup(group.id, 'group_updated', { groupId: group.id });
    res.json({ success: true, group });
  } catch (error) {
    next(error);
  }
};

// @desc    Add member to group
// POST /api/groups/:id/members
const addMember = async (req, res, next) => {
  try {
    const { email } = req.body;
    const group = await Group.findByPk(req.params.id);
    if (!group) return res.status(404).json({ success: false, message: 'Group not found' });

    const isAdmin = await GroupMember.findOne({ where: { groupId: group.id, userId: req.user.id, role: 'admin' } });
    if (!isAdmin) return res.status(403).json({ success: false, message: 'Admin access required' });

    const newMember = await User.findOne({ where: { email } });
    if (!newMember) return res.status(404).json({ success: false, message: 'User not found with this email' });

    const existing = await GroupMember.findOne({ where: { groupId: group.id, userId: newMember.id } });
    if (existing) return res.status(409).json({ success: false, message: 'User already in group' });

    await GroupMember.create({ groupId: group.id, userId: newMember.id, role: 'member' });

    await Notification.create({
      userId: newMember.id, type: 'group_invite',
      title: `Added to "${group.name}"`,
      message: `${req.user.name} added you to the group "${group.name}"`,
      data: { groupId: group.id },
    });

    emitToUser(newMember.id, 'notification', { type: 'group_invite', groupId: group.id });
    emitToGroup(group.id, 'member_added', { userId: newMember.id, name: newMember.name });

    await ActivityLog.create({
      groupId: group.id, userId: req.user.id, userName: req.user.name,
      action: 'member_added', description: `${req.user.name} added ${newMember.name} to the group`,
    });

    res.json({ success: true, message: 'Member added successfully', member: newMember.toSafeObject() });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove member from group
// DELETE /api/groups/:id/members/:userId
const removeMember = async (req, res, next) => {
  try {
    const group = await Group.findByPk(req.params.id);
    if (!group) return res.status(404).json({ success: false, message: 'Group not found' });

    const isAdmin = await GroupMember.findOne({ where: { groupId: group.id, userId: req.user.id, role: 'admin' } });
    const isSelf = req.user.id === parseInt(req.params.userId);
    if (!isAdmin && !isSelf) return res.status(403).json({ success: false, message: 'Not authorized' });

    await GroupMember.destroy({ where: { groupId: group.id, userId: req.params.userId } });
    emitToGroup(group.id, 'member_removed', { userId: req.params.userId });

    res.json({ success: true, message: 'Member removed' });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete group
// DELETE /api/groups/:id
const deleteGroup = async (req, res, next) => {
  try {
    const group = await Group.findByPk(req.params.id);
    if (!group) return res.status(404).json({ success: false, message: 'Group not found' });

    const isAdmin = await GroupMember.findOne({ where: { groupId: group.id, userId: req.user.id, role: 'admin' } });
    if (!isAdmin) return res.status(403).json({ success: false, message: 'Admin access required' });

    await group.update({ isActive: false });
    emitToGroup(group.id, 'group_deleted', { groupId: group.id });

    res.json({ success: true, message: 'Group deleted' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get group activity log
// GET /api/groups/:id/activity
const getActivity = async (req, res, next) => {
  try {
    const logs = await ActivityLog.find({ groupId: parseInt(req.params.id) })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json({ success: true, logs });
  } catch (error) {
    next(error);
  }
};

// Helper: Graph-based balance minimization algorithm
const calculateGroupBalances = async (groupId, members) => {
  const { ExpenseShare, Expense } = require('../models/mysql/index');
  const balanceMap = {};
  members.forEach((m) => (balanceMap[m.id] = { userId: m.id, name: m.name, email: m.email, balance: 0 }));

  const expenses = await Expense.findAll({
    where: { groupId },
    include: [{ model: ExpenseShare, as: 'shares' }],
  });

  for (const expense of expenses) {
    if (balanceMap[expense.paidBy]) balanceMap[expense.paidBy].balance += parseFloat(expense.totalAmount);
    for (const share of expense.shares) {
      if (balanceMap[share.userId]) balanceMap[share.userId].balance -= parseFloat(share.amountOwed);
    }
  }

  // Minimized debt settlement using greedy algorithm
  const balances = Object.values(balanceMap);
  const creditors = balances.filter((b) => b.balance > 0.01).sort((a, b) => b.balance - a.balance);
  const debtors = balances.filter((b) => b.balance < -0.01).sort((a, b) => a.balance - b.balance);

  const transactions = [];
  let i = 0, j = 0;
  while (i < creditors.length && j < debtors.length) {
    const amount = Math.min(creditors[i].balance, Math.abs(debtors[j].balance));
    transactions.push({
      from: debtors[j],
      to: creditors[i],
      amount: parseFloat(amount.toFixed(2)),
    });
    creditors[i].balance -= amount;
    debtors[j].balance += amount;
    if (Math.abs(creditors[i].balance) < 0.01) i++;
    if (Math.abs(debtors[j].balance) < 0.01) j++;
  }

  return { memberBalances: Object.values(balanceMap), suggestedTransactions: transactions };
};

module.exports = { createGroup, getMyGroups, getGroup, updateGroup, addMember, removeMember, deleteGroup, getActivity };
