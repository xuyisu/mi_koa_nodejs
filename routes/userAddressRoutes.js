// routes/userRoutes.js
const Router = require('koa-router');
const router = new Router({ prefix: '/address' });
const userAddressController = require('../controllers/userAddressController');
const { validateCreateUserAddress } = require('../middleware/validate');
const authMiddleware = require('../middleware/authMiddleware');



router.get('/pages', authMiddleware, userAddressController.pages);
router.post('/add', authMiddleware, validateCreateUserAddress, userAddressController.add);
router.get('/:addressId', authMiddleware, userAddressController.detail);
router.put('/:addressId', authMiddleware, validateCreateUserAddress, userAddressController.updateUserById);
router.delete('/:addressId', authMiddleware, userAddressController.deleteUserById);

module.exports = router;