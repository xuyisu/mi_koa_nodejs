// routes/userRoutes.js
const Router = require('koa-router');
const router = new Router({ prefix: '/product' });
const productController = require('../controllers/productController');

router.get('/pages', productController.getProducts);
router.get('/:productId', productController.detail);


module.exports = router;