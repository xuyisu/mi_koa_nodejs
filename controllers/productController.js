// controllers/userController.js
const { DELETE_FLAG } = require('../config/constant');
const Product = require('../models/Product');
const formatDate = require('../utils/formatDate');
const { successResponse, errorResponse } = require('../utils/response');

// 获取商品列表
exports.getProducts = async (ctx) => {
    try {
        const { currrent = 1, size = 10,categoryId } = ctx.query;
        const products = await Product.findAll({
            where: {
                categoryId: categoryId,
                deleteFlag: DELETE_FLAG.NO
            },
            limit: parseInt(size),
            offset: (parseInt(currrent) - 1) * parseInt(size),
        });
        if(products.length === 0){
            return ctx.body = errorResponse('暂无商品');
        }
        products.forEach(item => {
            item.dataValues.createTime = formatDate(item.createTime);
            item.dataValues.updateTime = formatDate(item.updateTime);
        })
        ctx.body = successResponse(products);
    } catch (err) {
        ctx.body = errorResponse(err.message);
    }
};
// 获取商品列表
exports.detail = async (ctx) => {
    try {
        const productId = ctx.params.productId
        if (!productId) {
            return ctx.body = errorResponse('商品id不能为空');
        }
        const product = await Product.findOne({ where: { productId: productId, deleteFlag: DELETE_FLAG.NO } });
        if (!product) {
            return ctx.body = errorResponse('商品不存在');
        }
        product.dataValues.createTime = formatDate(product.createTime);
        product.dataValues.updateTime = formatDate(product.updateTime);
        ctx.body = successResponse(product);
    } catch (err) {
        ctx.body = errorResponse(err.message);
    }
}
