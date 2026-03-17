const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/mysql');

const ExpenseShare = sequelize.define(
  'ExpenseShare',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    expenseId: { type: DataTypes.INTEGER, allowNull: false },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    shareValue: {
      type: DataTypes.DECIMAL(19, 4),
      allowNull: false,
      comment: 'percentage | exact amount | shares count depending on splitType',
    },
    amountOwed: { type: DataTypes.DECIMAL(19, 4), allowNull: false },
    isPaid: { type: DataTypes.BOOLEAN, defaultValue: false },
  },
  { tableName: 'expense_shares', timestamps: true }
);

module.exports = ExpenseShare;
