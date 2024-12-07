// controllers/userController.js
const Order = require('../models/OrderInfo');
const OrderDetail = require('../models/OrderDetail');
const OrderStatusRecord = require('../models/OrderStatusRecord');
const Activity = require('../models/Activity');
const UserAddress = require('../models/UserAddress');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { successResponse, errorResponse } = require('../utils/response');
const formatDate = require('../utils/formatDate'); // 根据你的文件结构调整路径
const { NUMBER, SELECTED, DELETE_FLAG, PRODUCT_STATUS, ORDER_STATUS, PAY_TYPE } = require('../config/constant');
const sequelize = require('../config/db');

// 分页获取所有订单
exports.getOrders = async (ctx) => {
    const userId = ctx.user.id
    const { currrent = 1, size = 10 } = ctx.query;
    try {
        const users = await Order.findAndCountAll({
            where: {
                userId: userId,
                deleteFlag: DELETE_FLAG.NO
            },
            limit: parseInt(size),
            offset: (parseInt(currrent) - 1) * parseInt(size),
        });
        const result = {
            current: parseInt(currrent),
            size: parseInt(size),
            totalPages: Math.ceil(users.count / parseInt(size)),
            total: users.count,
            records: users.rows.map(item => {
                const newItem = {
                    ...item.dataValues,
                    createTime: formatDate(item.dataValues.createTime),
                    updateTime: formatDate(item.dataValues.updateTime),
                    paymentTime: formatDate(item.dataValues.paymentTime)
                }
                return newItem
            })
        }
        ctx.body = successResponse(result)
    } catch (error) {
        ctx.body = errorResponse(error.message)
    }
};

// 创建订单
exports.create = async (ctx) => {
    try {
        // 开始事务
        const t = await sequelize.transaction();
        const userId = ctx.user.id
        const { addressId } = ctx.request.body;
        if (!addressId) {
            return ctx.body = errorResponse('addressId is required')
        }
        //校验地址是否有效
        const address = await UserAddress.findOne({ where: { addressId: addressId, deleteFlag: DELETE_FLAG.NO } });
        if (!address) {
            return ctx.body = errorResponse('当前地址已不存在，请重新添加地址')
        }
        //从购物车获取商品
        const carts = await Cart.findAll({ where: { userId: userId, selected: SELECTED.YES, deleteFlag: DELETE_FLAG.NO } });
        if (!carts || carts.length === 0) {
            return ctx.body = errorResponse('恭喜您的购物车已经被清空了，再加一车吧')
        }
        //根据时间戳创建订单号
        const orderNo = Date.now();
        let totalOrderPrice = NUMBER.ZERO;
        carts.forEach(async (cart) => {
            //查看商品
            const product = await Product.findOne({ where: { productId: cart.productId, status: PRODUCT_STATUS.ENABLE, deleteFlag: DELETE_FLAG.NO } });
            if (!product || product.stock <= NUMBER.ZERO) {
                return ctx.body = errorResponse('商品库存不足,请选择其它产品')
            }
            //构建商品明细
            const orderDetail = {
                orderNo: orderNo,
                orderDetailNo: Date.now() + Math.floor(Math.random() * 10).toString().padStart(5, '0'),
                currentUnitPrice: product.price,
                productId: product.productId,
                productMainImage: product.mainImage,
                productName: product.name,
                productPrice: product.price,
                quantity: cart.quantity,
                totalPrice: cart.productTotalPrice,
                status: ORDER_STATUS.UN_PAY,
                statusDesc: '待支付',
                userId: userId,
                createUser: userId,
                deleteFlag: DELETE_FLAG.NO
            }
            //获取活动信息
            const activity = await Activity.findOne({ where: { activityId: product.activityId, deleteFlag: DELETE_FLAG.NO } });
            if (activity) {
                orderDetail.activityId = activity.activityId;
                orderDetail.activityName = activity.name;
                orderDetail.mainImage = activity.mainImage;
            }
            totalOrderPrice += cart.productTotalPrice
            //订单状态记录
            const orderStatusRecord = {
                orderNo: orderNo,
                orderDetailNo: orderDetail.orderDetailNo,
                status: ORDER_STATUS.UN_PAY,
                statusDesc: '待支付',
                productId: product.productId,
                productName: product.name,
                deleteFlag: DELETE_FLAG.NO
            }
            await OrderDetail.create(orderDetail);
            await OrderStatusRecord.create(orderStatusRecord);
            //删除购物车
            await Cart.update({ deleteFlag: DELETE_FLAG.YES }, { where: { id: cart.id } });
        })
        //创建订单主信息
        const orderInfo = await Order.create({
            orderNo: orderNo,
            totalPrice: totalOrderPrice,
            userId: userId,
            addressId: addressId,
            province: address.province,
            city: address.city,
            area: address.area,
            street: address.street,
            postCode: address.postCode,
            receiveName: address.receiveName,
            receivePhone: address.receivePhone,
            payment: totalOrderPrice,
            paymentType: PAY_TYPE.ONLINE,
            paymengTypeDesc: '在线支付',
            status: ORDER_STATUS.UN_PAY,
            statusDesc: '待支付',
            userId: userId,
            createUser: userId,
            deleteFlag: DELETE_FLAG.NO
        })
        // 提交事务
        await t.commit();
        ctx.body = successResponse(orderInfo)
    } catch (error) {
        // 回滚事务
        if (error.transaction) {
            await error.transaction.rollback();
        }
        ctx.body = errorResponse(error.message);
    }
}

//根据订单编号查询明细
exports.detail = async (ctx) => {
    const userId = ctx.user.id
    const orderNo = ctx.params.orderNo;
    if (!orderNo) {
        return ctx.body = errorResponse('订单编号不能为空')
    }
    try {

        let orderDto = await Order.findOne({
            where: {
                orderNo: orderNo,
                userId: userId,
                deleteFlag: DELETE_FLAG.NO
            }
        })
        if (!orderDto) {
            return ctx.body = errorResponse('订单不存在')
        }
        orderDto.dataValues.createTime = formatDate(orderDto.createTime);
        orderDto.dataValues.updateTime = formatDate(orderDto.updateTime);
        //查询并返回订单明细
        const orderDetailsDto = await OrderDetail.findAll({
            where: {
                orderNo: orderNo,
                deleteFlag: DELETE_FLAG.NO
            }
        });
        if (orderDetailsDto || orderDetailsDto.length != 0) {
            orderDto.dataValues.details = orderDetailsDto
            orderDetailsDto.forEach(item => {
                item.dataValues.createTime = formatDate(item.createTime);
                item.dataValues.updateTime = formatDate(item.updateTime);
            })
        }


        ctx.body = successResponse(orderDto)
    } catch (error) {
        ctx.body = errorResponse(error.message)
    }

}

//付款
exports.pay = async (ctx) => {
    try {
        // 开始事务
        const t = await sequelize.transaction();
        const userId = ctx.user.id
        const { orderNo } = ctx.request.body;
        //校验订单信息
        const order = await Order.findOne({ where: { orderNo: orderNo, deleteFlag: DELETE_FLAG.NO } });
        if (!order) {
            return ctx.body = errorResponse('订单不存在')
        }
        if (order.userId != userId) {
            return ctx.body = errorResponse('订单不属于当前用户')
        }
        //校验订单状态
        if (order.status != ORDER_STATUS.UN_PAY) {
            return ctx.body = errorResponse('订单状态异常')
        }
        //更新订单状态
        await Order.update({ status: ORDER_STATUS.PAY, statusDesc: '已付款', paymentTime: new Date(), updateTime: new Date() }, { where: { id: order.id } });
        //查询并更新订单明细
        const orderDetails = await OrderDetail.findAll({ where: { orderNo: orderNo, deleteFlag: DELETE_FLAG.NO } });
        orderDetails.forEach(async (orderDetail) => {
            await OrderDetail.update({ status: ORDER_STATUS.PAY, statusDesc: '已付款' }, { where: { id: orderDetail.id } });
        })
        //查询并更新订单记录
        const orderStatusRecords = await OrderStatusRecord.findAll({ where: { orderNo: orderNo } });
        orderStatusRecords.forEach(async (orderStatusRecord) => {
            await OrderStatusRecord.update({ status: ORDER_STATUS.PAY, statusDesc: '已付款' }, { where: { id: orderStatusRecord.id } });
        })
        // 提交事务
        await t.commit();
        ctx.body = successResponse('支付成功')
    } catch (error) {
        // 回滚事务
        if (error.transaction) {
            await error.transaction.rollback();
        }
        ctx.body = errorResponse(error.message);
    }
}

//取消
exports.cancel = async (ctx) => {
    try {
        // 开始事务 
        const t = await sequelize.transaction();
        const userId = ctx.user.id
        const orderNo = ctx.params.orderNo;
        //查询订单是否存在
        const order = await Order.findOne({ where: { orderNo: orderNo, deleteFlag: DELETE_FLAG.NO } });
        if (!order) {
            return ctx.body = errorResponse('订单不存在')
        }
        if (order.userId != userId) {
            return ctx.body = errorResponse('订单不属于当前用户')
        }
        //校验订单状态
        if (order.status != ORDER_STATUS.UN_PAY) {
            return ctx.body = errorResponse('当前订单状态不能取消')
        }
        await Order.update({ status: ORDER_STATUS.CANCEL, statusDesc: '已取消', cancelTime: new Date(), updateTime: new Date() }, { where: { id: order.id } });
        const orderDetails = await OrderDetail.findAll({ where: { orderNo: orderNo, deleteFlag: DELETE_FLAG.NO } });
        orderDetails.forEach(async (orderDetail) => {
            await OrderDetail.update({ status: ORDER_STATUS.CANCEL, statusDesc: '已取消' }, { where: { id: orderDetail.id } });
        })
        const orderStatusRecords = await OrderStatusRecord.findAll({ where: { orderNo: orderNo } });
        orderStatusRecords.forEach(async (orderStatusRecord) => {
            await OrderStatusRecord.update({ status: ORDER_STATUS.CANCEL, statusDesc: '已取消' }, { where: { id: orderStatusRecord.id } });
        })
        // 提交事务
        await t.commit();
        ctx.body = successResponse('取消成功')
    } catch (error) {
        // 回滚事务
        if (error.transaction) {
            await error.transaction.rollback();
        }
        ctx.body = errorResponse(error.message)
    }

}