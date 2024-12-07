// controllers/userController.js
const Category = require('../models/Category');
const { successResponse, errorResponse } = require('../utils/response');
const formatDate = require('../utils/formatDate'); // 根据你的文件结构调整路径

exports.getCategorys = async (ctx) => {
    try {
        const categorys = await Category.findAll();
        categorys.forEach(category => {
            category.dataValues.createTime = formatDate(category.createTime);
            category.dataValues.updateTime = formatDate(category.updateTime);
        })
        ctx.body = successResponse(categorys);
    } catch (err) {
        ctx.body = errorResponse(err.message);
    }
};

