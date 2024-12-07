// controllers/userController.js
const { DELETE_FLAG } = require('../config/constant');
const UserAddress = require('../models/UserAddress');
const formatDate = require('../utils/formatDate');
const { successResponse, errorResponse } = require('../utils/response');

exports.pages = async (ctx) => {
    try {
        const userId = ctx.user.id;
        const { currrent = 1, size = 10 } = ctx.query;
        const userAddressList = await UserAddress.findAll({
            where: {
                createUser: userId,
                deleteFlag: DELETE_FLAG.NO
            },
            limit: parseInt(size),
            offset: (parseInt(currrent) - 1) * parseInt(size),
        });
        if (userAddressList.length === 0) {
            return ctx.body = successResponse();
        }
        userAddressList.forEach(item => {
            item.dataValues.createTime = formatDate(item.createTime);
            item.dataValues.updateTime = formatDate(item.updateTime);
        })
        ctx.body = successResponse(userAddressList);
    } catch (err) {
        ctx.body = errorResponse(err.message);
    }
};

// 新增
exports.add = async (ctx) => {
    try {
        const userId = ctx.user.id;
        const newUserAddress = new UserAddress(ctx.request.body);
        newUserAddress.createUser = userId;
        newUserAddress.updateUser = userId;
        newUserAddress.addressId = Date.now();
        await newUserAddress.save();
        ctx.body = successResponse(newUserAddress);
    } catch (err) {
        ctx.body = errorResponse(err.message);
    }
};

// 详情
exports.detail = async (ctx) => {
    try {
        const addressId = ctx.params.addressId;
        //根据地址id  查询地址信息
        const userAddress = await UserAddress.findOne({ where: { addressId: addressId, deleteFlag: DELETE_FLAG.NO } });
        if (!userAddress) {
            return ctx.body = errorResponse('地址不存在');
        }
        userAddress.dataValues.createTime = formatDate(userAddress.createTime);
        userAddress.dataValues.updateTime = formatDate(userAddress.updateTime);
        ctx.body = successResponse(userAddress);
    } catch (err) {
        ctx.body = errorResponse(err.message);
    }
};

// 修改
exports.updateUserById = async (ctx) => {
    try {
        const userId = ctx.user.id;
        const addressId = ctx.params.addressId
        if (!addressId) {
            return ctx.body = errorResponse('地址id不能为空');
        }
        const userAddress = await UserAddress.findOne({ where: { addressId: addressId, deleteFlag: DELETE_FLAG.NO } });
        if (!userAddress) {
            return ctx.body = errorResponse('地址不存在');
        }
        const userAddressNew = ctx.request.body;
        userAddressNew.updateUser = userId;
        userAddressNew.updateTime = new Date();
        await UserAddress.update(userAddressNew, { where: { id: userAddress.id } });
        ctx.body = successResponse();
    } catch (err) {
        ctx.body = errorResponse(err.message);
    }
};

// 删除
exports.deleteUserById = async (ctx) => {
    try {
        const userId = ctx.user.id;
        const addressId = ctx.params.addressId
        if (!addressId) {
            return ctx.body = errorResponse('地址id不能为空');
        }
        const userAddress = await UserAddress.findOne({ where: { addressId: addressId, deleteFlag: DELETE_FLAG.NO } });
        if (!userAddress) {
            return ctx.body = errorResponse('地址不存在');
        }
        userAddress.deleteFlag = DELETE_FLAG.YES;
        userAddress.updateUser = userId;
        userAddress.updateTime = new Date();
        await userAddress.save();
        ctx.body = successResponse();
    } catch (err) {
        ctx.body = errorResponse(err.message);
    }
};