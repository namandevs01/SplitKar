const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/mysql');

const Group = sequelize.define(
  'Group',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING(120), allowNull: false },
    description: { type: DataTypes.STRING(255), allowNull: true },
    category: {
      type: DataTypes.ENUM('home', 'trip', 'food', 'event', 'project', 'other'),
      defaultValue: 'other',
    },
    currency: { type: DataTypes.STRING(3), defaultValue: 'INR' },
    createdBy: { type: DataTypes.INTEGER, allowNull: false },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
    coverImage: { type: DataTypes.STRING(255), allowNull: true },
  },
  { tableName: 'groups', timestamps: true }
);

module.exports = Group;
