const { Op } = require('sequelize');
const { User } = require('../models/mysql/index');
const MongoUser = require('../models/mongo/UserProfile');

// GET /api/users/search?q=email_or_name
const searchUsers = async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) {
      return res.json({ success: true, users: [] });
    }

    const users = await User.findAll({
      where: {
        isActive: true,
        id: { [Op.ne]: req.user.id }, // exclude self
        [Op.or]: [
          { email: { [Op.like]: `%${q}%` } },
          { name: { [Op.like]: `%${q}%` } },
        ],
      },
      attributes: ['id', 'name', 'email', 'phone'],
      limit: 10,
    });

    res.json({ success: true, users });
  } catch (error) {
    next(error);
  }
};

// GET /api/users/:id/profile
const getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: ['id', 'name', 'email', 'phone', 'createdAt'],
    });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const profile = await MongoUser.findOne({ userId: user.id });
    res.json({ success: true, user: { ...user.toJSON(), profile } });
  } catch (error) {
    next(error);
  }
};

module.exports = { searchUsers, getUserProfile };
