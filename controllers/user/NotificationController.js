const { baseResponse, logger, defaultStartLimit } = require("../../utils/helper");
const { NOTIFICATION_TYPE } = require('../../utils/constant');
const Notification = require("../../models/Notification");

const getList = async (req, res, next) => {
    try{
        const {start, limit} = defaultStartLimit(req);
        const queryUser = Notification.find({userId: req.user._id}).skip(start).limit(limit);
        const queryTotal = Notification.countDocuments({userId: req.user._id});
        const [notifications, total] = await Promise.all([queryUser, queryTotal]);
        baseResponse.success(res, 200, 'Thành công', notifications, {
            total
        });
    }catch(e){
        logger.error(e);
        baseResponse.error(res);
    }
}

const createNotification = async (notificationType = NOTIFICATION_TYPE.DEFAULT, data = {}) => {
    switch(notificationType){
        case NOTIFICATION_TYPE.POST:
            break;
        case NOTIFICATION_TYPE.COMMENT:
            break;
        case NOTIFICATION_TYPE.REPLY:
            break;
        default:
            break;
    }
}

module.exports = {
    getList,
    createNotification
}