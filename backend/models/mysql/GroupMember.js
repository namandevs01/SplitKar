const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/mysql');

const GroupMember = sequelize.define(
  'GroupMember',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    groupId: { type: DataTypes.INTEGER, allowNull: false },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    role: {
      type: DataTypes.ENUM('admin', 'member'),
      defaultValue: 'member',
    },
    joinedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  },
  { tableName: 'group_members', timestamps: true }
);

module.exports = GroupMember;
