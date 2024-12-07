// app.js
const Koa = require('koa');
const bodyParser = require('koa-bodyparser');
const userRoutes = require('./routes/userRoutes');
const activityRoutes = require('./routes/activityRoutes');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');
const productRoutes = require('./routes/productRoutes');
const categoryRoutes = require('./routes//categoryRoutes');
const userAddressRoutes = require('./routes/userAddressRoutes');

const sequelize = require('./config/db');

const app = new Koa();

app.use(bodyParser());

// Routes
const routes = [
    userRoutes,
    activityRoutes,
    cartRoutes,
    orderRoutes,
    productRoutes,
    userAddressRoutes,
    categoryRoutes
];

routes.forEach(route => {
    try {
        app.use(route.routes()).use(route.allowedMethods());
    } catch (error) {
        console.error(`Failed to register routes for ${route.name}:`, error);
    }
});



const PORT = process.env.PORT || 8081;

// 数据库同步（在实际应用中，通常不会在生产环境中这样做）
sequelize.sync({ force: false }) // force: true 会删除并重新创建表，仅在开发时使用
  .then(() => {
    console.log('Database & tables synchronized!');
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch(error => {
    console.error('Unable to connect to the database:', error);
  });