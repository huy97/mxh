const { logger, baseResponse, defaultStartLimit } = require("../../utils/helper");
const Message = require("../../models/Message");
const MessageRead = require("../../models/MessageRead");
const { Types } = require("mongoose");

const getList = async (req, res, next) => {
    try{
        const {conversationId} = req.params;
        const {start, limit} = defaultStartLimit(req);
        const messageQuery = Message.aggregate([
            {
                $match: {conversationId: Types.ObjectId(conversationId)}
            },
            {
                $sort: {_id: -1}
            },
            {
                $skip: start
            },
            {
                $limit: limit
            },
            {
                $lookup: {
                    from: "messagereads",
                    localField: "_id",
                    foreignField: "messageId",
                    as: "reads"
                }
            }
        ]);
        const totalQuery = Message.countDocuments({conversationId});
        const [messages, total] = await Promise.all([messageQuery, totalQuery]);
        baseResponse.success(res, 200, 'Thành công', messages, {
            total
        });
    }catch(e){
        logger.error(e);
        baseResponse.error(res)
    }
}

module.exports = {
    getList
}