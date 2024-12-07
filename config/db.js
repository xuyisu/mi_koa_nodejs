// database.js
const { Sequelize } = require('sequelize');

// 创建 Sequelize 实例
const sequelize = new Sequelize('mi_mall', 'root', '123456', {
  host: 'localhost',
  dialect: 'mysql' // 或者 'postgres', 'sqlite', 'mariadb', 'mssql'
});

// 测试数据库连接
sequelize.authenticate()
  .then(() => {
    console.log('Connection has been established successfully.');
  })
  .catch(err => {
    console.error('Unable to connect to the database:', err);
  });

module.exports = sequelize;