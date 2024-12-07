// controllers/userController.js
const { PRODUCT_STATUS, DELETE_FLAG } = require('../config/constant');
const User = require('../models/User');
const { generateToken } = require('../utils/jwtUtils');
const { md5Encrypt } = require('../utils/md5');
const { successResponse, errorResponse } = require('../utils/response');

// 注册
exports.register = async (ctx) => {
    const newUser = new User(ctx.request.body);
    try {
        newUser.status = PRODUCT_STATUS.ENABLE
        await newUser.save();
        ctx.body = successResponse(newUser);
    } catch (err) {
        ctx.body = errorResponse(err.message);
    }
};

// 登录
exports.login = async (ctx) => {
    try {
        //获取用户名密码
        const { userName, password } = ctx.request.body
        const user = await User.findOne({ where: { userName: userName, deleteFlag: DELETE_FLAG.NO, status: PRODUCT_STATUS.ENABLE } })
        if (!user) {
            return ctx.body = errorResponse('用不存在')
        }

        if (user.password !== md5Encrypt(password)) {
            return ctx.body = errorResponse('密码错误')
        }
        //生成jwt信息
        const userResp = {
            id: user.id,
            userName: user.userName,
            email: user.email,
            phone: user.phone
         }
        const token = generateToken(userResp)
        userResp.token = token;
        ctx.body = successResponse(userResp)
    } catch (err) {
        ctx.body = errorResponse(err.message)
    }
};

// 获取用户信息
exports.getUser = async (ctx) => {
    try {
        ctx.body = successResponse(ctx.user)
    } catch (err) {
        ctx.body = errorResponse(err.message)
    }
};

// 退出登录
exports.logout = async (ctx) => {
    try {
        console.log('logout 请求');
        ctx.body = successResponse();
    } catch (err) {
        ctx.body = errorResponse(err.message);
    }
};