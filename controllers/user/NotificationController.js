const { baseResponse, logger, defaultStartLimit } = require("../../utils/helper");
const Notification = require('../../models/Notification');

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

module.exports = {
    getList
}