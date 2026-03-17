const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/mysql');

const Expense = sequelize.define(
  'Expense',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    groupId: { type: DataTypes.INTEGER, allowNull: false },
    paidBy: { type: DataTypes.INTEGER, allowNull: false },
    description: { type: DataTypes.STRING(255), allowNull: false },
    totalAmount: { type: DataTypes.DECIMAL(19, 4), allowNull: false },
    category: {
      type: DataTypes.ENUM(
        'food', 'transport', 'accommodation', 'entertainment',
        'utilities', 'shopping', 'health', 'other'
      ),
      defaultValue: 'other',
    },
    splitType: {
      type: DataTypes.ENUM('equal', 'percentage', 'exact', 'share'),
      defaultValue: 'equal',
    },
    receiptUrl: { type: DataTypes.STRING(255), allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
    date: { type: DataTypes.DATEONLY, defaultValue: DataTypes.NOW },
    isSettled: { type: DataTypes.BOOLEAN, defaultValue: false },
  },
  { tableName: 'expenses', timestamps: true }
);

module.exports = Expense;
