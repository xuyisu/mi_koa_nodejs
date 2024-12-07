// routes/userRoutes.js
const Router = require('koa-router');
const router = new Router({ prefix: '/category' });
const categoryController = require('../controllers/categoryController');

router.get('/list', categoryController.getCategorys);

module.exports = router;