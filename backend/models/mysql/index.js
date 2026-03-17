const User = require('./User');
const Group = require('./Group');
const GroupMember = require('./GroupMember');
const Expense = require('./Expense');
const ExpenseShare = require('./ExpenseShare');
const Settlement = require('./Settlement');

// User <-> Group (many-to-many through GroupMember)
User.belongsToMany(Group, { through: GroupMember, foreignKey: 'userId', as: 'groups' });
Group.belongsToMany(User, { through: GroupMember, foreignKey: 'groupId', as: 'members' });

Group.hasMany(GroupMember, { foreignKey: 'groupId', as: 'groupMembers' });
GroupMember.belongsTo(Group, { foreignKey: 'groupId' });

User.hasMany(GroupMember, { foreignKey: 'userId' });
GroupMember.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Group -> Expenses
Group.hasMany(Expense, { foreignKey: 'groupId', as: 'expenses' });
Expense.belongsTo(Group, { foreignKey: 'groupId' });

// User -> Expenses (paid by)
User.hasMany(Expense, { foreignKey: 'paidBy', as: 'paidExpenses' });
Expense.belongsTo(User, { foreignKey: 'paidBy', as: 'payer' });

// Expense -> ExpenseShares
Expense.hasMany(ExpenseShare, { foreignKey: 'expenseId', as: 'shares' });
ExpenseShare.belongsTo(Expense, { foreignKey: 'expenseId' });

User.hasMany(ExpenseShare, { foreignKey: 'userId', as: 'expenseShares' });
ExpenseShare.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Settlements
Group.hasMany(Settlement, { foreignKey: 'groupId', as: 'settlements' });
Settlement.belongsTo(Group, { foreignKey: 'groupId' });

User.hasMany(Settlement, { foreignKey: 'payerId', as: 'paymentsMade' });
User.hasMany(Settlement, { foreignKey: 'payeeId', as: 'paymentsReceived' });
Settlement.belongsTo(User, { foreignKey: 'payerId', as: 'payer' });
Settlement.belongsTo(User, { foreignKey: 'payeeId', as: 'payee' });

module.exports = { User, Group, GroupMember, Expense, ExpenseShare, Settlement };
