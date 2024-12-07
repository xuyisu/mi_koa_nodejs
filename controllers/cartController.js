// controllers/userController.js
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const Activity = require('../models/Activity');
const { successResponse, errorResponse } = require('../utils/response');
const { NUMBER, SELECTED, DELETE_FLAG, PRODUCT_STATUS, CART_UPDATE_TYPE } = require('../config/constant');

// 获取购物车列表
exports.getCarts = async (ctx) => {
    try {
        const userId = ctx.user.id
        const carts = await Cart.findAll({ where: { userId: userId } });
        if (carts.length === 0) {
            return ctx.body = successResponse([]);
        }
        //统计总金额
        let cartTotalPrice = carts.reduce((acc, cur) => {
            return (acc * NUMBER.ONE_HUNDRED + cur.productTotalPrice * NUMBER.ONE_HUNDRED) / NUMBER.ONE_HUNDRED;
        }, NUMBER.ZERO);
        //计算总数量
        let cartTotalQuantity = carts.reduce((acc, cur) => acc + cur.quantity, NUMBER.ZERO);
        let selectedAll = true
        carts.forEach(item => {
            if (item.selected < SELECTED.YES) {
                selectedAll = false
            }
        })

        //构建返回的新对象
        const result = {
            cartTotalPrice: cartTotalPrice,
            cartTotalQuantity: cartTotalQuantity,
            selectedAll: selectedAll,
            cartProductList: carts
        }
        ctx.body = successResponse(result);
    } catch (err) {
        ctx.body = errorResponse(err.message);
    }
};

//添加商品到购物车
exports.addCart = async (ctx) => {
    //获取商品id
    const productId = ctx.request.body.productId
    if (!productId) {
        return ctx.body = errorResponse('商品id不能为空');
    }
    //查询商品是否已存在
    const product = await Product.findOne({ where: { productId: productId, status: PRODUCT_STATUS.ENABLE, deleteFlag: DELETE_FLAG.NO } });
    if (!product) {
        return ctx.body = errorResponse('当前商品已下架或删除');
    }
    //查询当前商品是否已添加购物车 TODO 用户id 待完善
    const userId = ctx.user.id
    let cart = await Cart.findOne({ where: { productId: productId, userId: userId, deleteFlag: DELETE_FLAG.NO } });

    if (!cart) {
        //新增，记录价格和数量
        cart = new Cart({
            activityId: product.activityId,
            userId: userId,
            createUser: userId,
            productId: productId,
            productSubtitle: product.subtitle,
            productUnitPrice: product.price,
            productMainImage: product.mainImage,
            productTotalPrice: product.price,
            productName: product.name,
            quantity: 1,
            selected: 1,
            productTotalPrice: product.price,
        });
        //检查活动信息
        if (product.activityId) {
            const activity = await Activity.findOne({ where: { activityId: product.activityId, deleteFlag: DELETE_FLAG.NO } });
            if (activity) {
                //存在，记录活动名称
                cart.activityName = activity.name
            }
        }
        await cart.save()
    } else {
        cart.updateTime = new Date()
        cart.quantity = cart.quantity + NUMBER.ONE
        cart.productTotalPrice = cart.quantity * cart.productUnitPrice
        await cart.save()
    }
    this.sum(req, res);
}

//统计购物车数量
exports.sum = async (ctx) => {
    const userId = ctx.user.id
    //统计当前用户购物车商品数量
    const countCart = await Cart.count({ where: { userId: userId, deleteFlag: DELETE_FLAG.NO } });
    ctx.body = successResponse(countCart);
}

//更新购物车数量
exports.updateCount = async (ctx) => {
    const productId = ctx.params.productId
    const cartCountChangeReq = ctx.request.body
    const userId = ctx.user.id
    if (!productId) {
        return ctx.body =errorResponse('商品id不能为空');
    }
    if (!cartCountChangeReq) {
        return ctx.body = errorResponse('参数错误');
    }
    //校验商品是否已存在
    const product = await Product.findOne({ where: { productId: productId, status: PRODUCT_STATUS.ENABLE, deleteFlag: DELETE_FLAG.NO } });
    if (!product) {
        return ctx.body = errorResponse('当前商品已下架或删除');
    }
    //查询商品是否已添加
    const cart = await Cart.findOne({ where: { productId: productId, userId: userId, deleteFlag: DELETE_FLAG.NO } });
    if (!cart) {
        return ctx.body = errorResponse('购物车已不存在该商品');
    }
    cart.updateTime = new Date()
    if (CART_UPDATE_TYPE.ADD === cartCountChangeReq.type) {
        cart.quantity = cart.quantity + NUMBER.ONE
    } else {
        if (cart.quantity <= NUMBER.ONE) {
            return ctx.body = errorResponse('不能再减了,要减没了');
        }
        cart.quantity = cart.quantity - NUMBER.ONE
    }
    cart.productTotalPrice = cart.quantity * cart.productUnitPrice
    cart.selected = cartCountChangeReq.selected
    cart.updateUser = userId
    await cart.save()
    ctx.body = successResponse();
}


//根据商品id删除购物车
exports.deleteCart = async (ctx) => {
    const productId = ctx.params.productId
    const userId = ctx.user.id
    if (!productId) {
        return ctx.body =errorResponse('商品id不能为空');
    }
    //查询商品是否已添加
    const cart = await Cart.findOne({ where: { productId: productId, userId: userId, deleteFlag: DELETE_FLAG.NO } });
    if (!cart) {
        return ctx.body =errorResponse('购物车已不存在该商品');
    }
    cart.deleteFlag = DELETE_FLAG.YES
    cart.deleteUser = userId
    cart.updateTime = new Date()
    await cart.save()
    ctx.body = successResponse();
}

//购物车全选
exports.selectAll = async (ctx) => {
    const userId = ctx.user.id
    //查询当前用户购物车商品未选择的，设置未选择
    const cartList = await Cart.findAll({ where: { userId: userId, deleteFlag: DELETE_FLAG.NO, selected: SELECTED.NO } });
    if (cartList.length === NUMBER.ZERO) {
        return ctx.body = successResponse();
    }
    cartList.forEach(item => {
        item.selected = SELECTED.YES
        item.updateTime = new Date()
        item.updateUser = userId
        item.save()
    })
    ctx.body = successResponse();
}

//购物车全不选
exports.unSelectAll = async (ctx) => {
    const userId = ctx.user.id
    //查询当前用户购物车商品未选择的，设置未选择
    const cartList = await Cart.findAll({ where: { userId: userId, deleteFlag: 0, selected: 1 } });
    if (cartList.length === 0) {
        return ctx.body =successResponse();
    }
    cartList.forEach(item => {
        item.selected = 0
        item.updateTime = new Date()
        item.updateUser = userId
        item.save()
    })
    ctx.body = successResponse();
}