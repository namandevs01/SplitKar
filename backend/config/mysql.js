const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.MYSQL_DATABASE,
  process.env.MYSQL_USER,
  process.env.MYSQL_PASSWORD,
  {
    host: process.env.MYSQL_HOST || 'localhost',
    port: process.env.MYSQL_PORT || 3306,
    dialect: 'mysql',
    // Keep terminal output high-signal by default.
    // Opt-in to SQL logging via MYSQL_LOG_SQL=true.
    logging: process.env.MYSQL_LOG_SQL === 'true' ? console.log : false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  }
);

const connectMySQL = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ MySQL connected successfully');
    const shouldAlter = process.env.MYSQL_SYNC_ALTER === 'true';
    await sequelize.sync({ alter: shouldAlter });
    console.log('✅ MySQL models synced');
  } catch (error) {
    console.error('❌ MySQL connection failed:', error.message);
    process.exit(1);
  }
};

module.exports = { sequelize, connectMySQL };
