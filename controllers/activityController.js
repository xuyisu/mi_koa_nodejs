// controllers/userController.js
const Activity = require('../models/Activity');
const { successResponse, errorResponse } = require('../utils/response');

exports.getActivitys = async (ctx) => {
    try {
        const activitys = await Activity.findAll();
        ctx.body = successResponse(activitys);
    } catch (err) {
        ctx.body = errorResponse(err.message);
    }
};

exports.createActivity = async (ctx) => {
    const newActivity = new Activity(ctx.request.body);
    try {
        await newActivity.save();
        ctx.body = successResponse(newActivity);
    } catch (err) {
        ctx.body = errorResponse(err.message);
    }
};

exports.getActivityById = async (ctx) => {
    try {
        const activity = await Activity.findById(ctx.params.id);
        if (!activity) {
            return ctx.body = errorResponse('Activity not found');
        }
        ctx.body = successResponse(activity);
    } catch (err) {
        ctx.body = errorResponse(err.message);
    }
};

exports.updateActivityById = async (ctx) => {
    try {
        const updatedActivity = await Activity.findByIdAndUpdate(
            ctx.params.id,
            ctx.request.body,
            { new: true, runValidators: true }
        );
        if (!updatedActivity) {
            return ctx.body = errorResponse('Activity not found');
        }
        ctx.body = successResponse(updatedActivity);
    } catch (err) {
        ctx.body = errorResponse(err.message);
    }
};

exports.deleteActivityById = async (ctx) => {
    try {
        const deletedActivity = await Activity.findByIdAndDelete(ctx.params.id);
        if (!deletedActivity) {
            return ctx.body = errorResponse('Activity not found');
        }
        ctx.body = successResponse();
    } catch (err) {
        ctx.body = errorResponse(err.message);
    }
};