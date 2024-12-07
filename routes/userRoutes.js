// routes/userRoutes.js
const Router = require('koa-router');
const router = new Router({ prefix: '/user' });
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');
const { validateRegister, validateLogin } = require('../middleware/validate');


// router.get('/', userController.getUsers);
router.post('/register', validateRegister, userController.register);
router.post('/login', validateLogin, userController.login);
router.get('/getUser', authMiddleware, userController.getUser);
router.post('/logout', userController.logout);

module.exports = router;