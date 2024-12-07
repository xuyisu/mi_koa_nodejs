// routes/userRoutes.js
const Router = require('koa-router');
const activityController = require('../controllers/activityController');
const router = new Router({ prefix: '/activity' });


router.get('/', activityController.getActivitys);
router.post('/', activityController.createActivity);
router.get('/:id', activityController.getActivityById);
router.put('/:id', activityController.updateActivityById);
router.delete('/:id', activityController.deleteActivityById);

module.exports = router;