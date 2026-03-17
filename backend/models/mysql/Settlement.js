const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/mysql');

const Settlement = sequelize.define(
  'Settlement',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    groupId: { type: DataTypes.INTEGER, allowNull: false },
    payerId: { type: DataTypes.INTEGER, allowNull: false },
    payeeId: { type: DataTypes.INTEGER, allowNull: false },
    amount: { type: DataTypes.DECIMAL(19, 4), allowNull: false },
    status: {
      type: DataTypes.ENUM('pending', 'initiated', 'completed', 'failed'),
      defaultValue: 'pending',
    },
    razorpayOrderId: { type: DataTypes.STRING(100), allowNull: true },
    razorpayPaymentId: { type: DataTypes.STRING(100), allowNull: true },
    notes: { type: DataTypes.STRING(255), allowNull: true },
    settledAt: { type: DataTypes.DATE, allowNull: true },
  },
  { tableName: 'settlements', timestamps: true }
);

module.exports = Settlement;
