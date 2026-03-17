const cron = require('node-cron');
const { Settlement, User, Group } = require('../models/mysql/index');
const Notification = require('../models/mongo/Notification');
const { emitToUser } = require('../socket/emitter');
const { Op } = require('sequelize');

const setupCronJobs = () => {
  // Every day at 9 AM IST — remind users of pending settlements
  cron.schedule('0 9 * * *', async () => {
    try {
      console.log('⏰ Running daily payment reminder cron...');

      const pendingSettlements = await Settlement.findAll({
        where: {
          status: 'pending',
          createdAt: { [Op.lt]: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // older than 1 day
        },
        include: [
          { model: User, as: 'payer', attributes: ['id', 'name'] },
          { model: User, as: 'payee', attributes: ['id', 'name'] },
          { model: Group, attributes: ['name'] },
        ],
      });

      for (const s of pendingSettlements) {
        await Notification.create({
          userId: s.payerId,
          type: 'payment_reminder',
          title: '💸 Pending payment reminder',
          message: `You owe ₹${s.amount} to ${s.payee.name} in "${s.Group.name}"`,
          data: { settlementId: s.id, groupId: s.groupId },
        });
        emitToUser(s.payerId, 'notification', { type: 'payment_reminder', amount: s.amount });
      }

      console.log(`✅ Sent ${pendingSettlements.length} payment reminders`);
    } catch (error) {
      console.error('❌ Cron job error:', error.message);
    }
  }, { timezone: 'Asia/Kolkata' });

  console.log('✅ Cron jobs initialized');
};

module.exports = setupCronJobs;
