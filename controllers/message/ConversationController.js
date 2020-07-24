const { logger, baseResponse, isEmpty, projectUserField, defaultStartLimit } = require("../../utils/helper");
const { validationResult } = require("express-validator");
const ConversationUser = require("../../models/ConversationUser");
const Conversation = require("../../models/Conversation");
const User = require("../../models/User");
const Message = require("../../models/Message");

const getList = async (req, res, next) =>{
    try{
        const {start, limit} = defaultStartLimit(req);
        const conversationQuery = Conversation.aggregate([
            {
                $lookup: {
                    from: "conversationusers",
                    localField: "_id",
                    foreignField: "conversationId",
                    as: "users"
                }
            },
            {
                $project: {
                    _id: 1,
                    "users.userId": 1,
                    "users.isManager": 1
                }
            },
            {
                $match: { users: { $elemMatch: { userId: req.user._id } } }
            },
            {
                $sort: {
                    _id: -1
                }
            },
            {
                $skip: start
            },
            {
                $limit: limit
            },
            {
                $lookup: {
                    from: "users",
                    localField: "users.userId",
                    foreignField: "_id",
                    as: "userInfos"
                }
            },
            {
                $lookup: {
                    from: "messages",
                    let: {
                        conversationId: "$_id"
                    },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: [ "$conversationId",  "$$conversationId" ] },
                                    ]
                                }
                            }
                        },
                        {
                            $sort: {_id: -1}
                        },
                        {
                            $limit: 1
                        }
                    ],
                    as: "lastMessage"
                }
            },
            {
                $unwind: "$lastMessage"
            },
            {
                $project: {
                    ...projectUserField('userInfos.')
                }
            }
        ]);
        const totalQuery = ConversationUser.countDocuments({userId: req.user._id});
        const [conversations, total] = await Promise.all([conversationQuery, totalQuery]);
        baseResponse.success(res, 200, 'Thành công', conversations, {
            total
        });
    }catch(e){
        logger.error(e);
        baseResponse.error(res);
    }
}

const createConversation = async (req, res, next) => {
    try{
        const {users, title, message = ""} = req.body;
        const erorrs = validationResult(req);
        if(!erorrs.isEmpty()){
            baseResponse.error(res, 422, 'Vui lòng nhập đủ thông tin.', erorrs.array());
            return;
        }
        const uniqueUsers = Array.from(new Set(users));
        uniqueUsers.push(req.user.id);
        const conversation = await Conversation.create({
            title,
            isGroup: uniqueUsers.length > 2
        });
        const conversationUsers = uniqueUsers.map((userId) => {
            return {
                conversationId: conversation.id,
                userId,
                isManager: userId === req.user.id
            }
        });
        const queryQueue = [User.find({_id: {$in: uniqueUsers}}, {...projectUserField()}), ConversationUser.create(conversationUsers)];
        uniqueUsers.pop();
        if(!isEmpty(message)){
            queryQueue.push(Message.create({
                conversationId: conversation.id,
                from: req.user.id,
                to: uniqueUsers,
                message
            }))
        }
        const [listUsers, userManagers, lastMessage] = await Promise.all(queryQueue);
        baseResponse.json(res, 200, 'Thành công', {
            conversation: {
                ...conversation.toJSON(),
                users: userManagers,
                userInfos: listUsers,
                lastMessage
            }
        });
    }catch(e){
        logger.error(e),
        baseResponse.error(res);
    }
}

module.exports = {
    getList,
    createConversation
}