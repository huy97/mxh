const { logger, baseResponse, isEmpty, projectUserField, defaultStartLimit, htmlEntities } = require("../../utils/helper");
const { validationResult } = require("express-validator");
const ConversationUser = require("../../models/ConversationUser");
const Conversation = require("../../models/Conversation");
const User = require("../../models/User");
const Message = require("../../models/Message");
const {queue} = require("../../services/queue");
const { Types } = require("mongoose");
const MessageRead = require("../../models/MessageRead");

const getList = async (req, res, next) => {
    try{
        const {start, limit} = defaultStartLimit(req);
        const conversationQuery = Conversation.aggregate([
            {
                $lookup: {
                    from: "conversation_users",
                    localField: "_id",
                    foreignField: "conversationId",
                    as: "users"
                }
            },
            {
                $project: {
                    _id: 1,
                    isGroup: 1,
                    title: 1,
                    color: 1,
                    createdAt: 1,
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
                $lookup: {
                    from: "message_reads",
                    localField: "lastMessage._id",
                    foreignField: "messageId",
                    as: "lastMessage.reads"
                }
            },
            {
                $project: {
                    ...projectUserField('userInfos.')
                }
            }
        ]);
        const totalQuery = ConversationUser.countDocuments({userId: req.user._id});
        const [conversations, total] = await Promise.all([conversationQuery, totalQuery]);
        conversations.map((conversation) => {
            conversation.userInfos = conversation.userInfos.filter((obj) => obj._id != req.user.id);
        });
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
        const errors = validationResult(req);
        if(!errors.isEmpty()){
            baseResponse.error(res, 422, 'Vui lòng nhập đủ thông tin.', errors.array());
            return;
        }
        const uniqueUsers = Array.from(new Set(users));
        uniqueUsers.push(req.user.id);
        const isGroup = uniqueUsers.length > 2;
        const conversation = await Conversation.create({
            title,
            isGroup 
        });
        const conversationUsers = uniqueUsers.map((userId) => {
            return {
                conversationId: conversation.id,
                userId,
                isManager: userId === req.user.id
            }
        });
        uniqueUsers.pop();
        const queryList = [User.find({_id: {$in: uniqueUsers}}, {...projectUserField()}), ConversationUser.create(conversationUsers)];
        if(!isEmpty(message)){
            queryList.push(Message.create({
                conversationId: conversation.id,
                from: req.user.id,
                to: uniqueUsers,
                message: htmlEntities(message)
            }));
        }
        const [listUsers, userManagers, lastMessage] = await Promise.all(queryList);
        const projectUserManagers = userManagers.map((obj) => {
            return {
                _id: obj._id,
                isManager: obj.isManager,
                userId: obj.userId
            }
        });
        queue.create('conversation', {to: uniqueUsers, conversation: {
            ...conversation.toJSON(),
            users: projectUserManagers,
            userInfos: listUsers,
            lastMessage
        }}).save();
        baseResponse.json(res, 200, 'Thành công', {
            conversation: {
                ...conversation.toJSON(),
                users: projectUserManagers,
                userInfos: listUsers,
                lastMessage
            }
        });
    }catch(e){
        logger.error(e),
        baseResponse.error(res);
    }
}

const checkExist = async (req, res, next) => {
    try{
        const {userId} = req.params;
        const conversations = await Conversation.aggregate([
            {
                $lookup: {
                    from: "conversation_users",
                    localField: "_id",
                    foreignField: "conversationId",
                    as: "users"
                }
            },
            {
                $project: {
                    _id: 1,
                    isGroup: 1,
                    title: 1,
                    color: 1,
                    createdAt: 1,
                    "users.userId": 1,
                    "users.isManager": 1
                }
            },
            {
                $match: {"users.userId": req.user._id, "users.userId": Types.ObjectId(userId)}
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
                $project: {
                    ...projectUserField('userInfos.')
                }
            }
        ]);
        conversations.map((conversation) => {
            conversation.userInfos = conversation.userInfos.filter((obj) => obj._id != req.user.id);
        });
        baseResponse.success(res, 200, "Thành công", conversations);
    }catch(e){
        logger(e);
        baseResponse.error(res);
    }
}

const deleteConversation = async (req, res, next) => {
    try{
        const {conversationId} = req.params;
        const conversationUser = await ConversationUser.findOne({conversationId, userId: req.user._id});
        if(!conversationUser){
            baseResponse.json(res, 404, "Cuộc hội thoại của tài khoản này không tồn tại.");
            return;
        }
        if(!conversationUser.isManager){
            baseResponse.json(res, 403, "Bạn không có quyền xoá cuộc hội thoại này.");
            return;
        }
        const stackQuery = [
            ConversationUser.deleteMany({conversationId}),
            Message.deleteMany({conversationId}),
            MessageRead.deleteMany({conversationId}),
            Conversation.deleteOne({conversationId})
        ];
        await Promise.all(stackQuery);
        baseResponse.json(res, 200, 'Thành công');
    }catch(e){
        logger.error(e);
        baseResponse.error(res);
    }
}

module.exports = {
    getList,
    createConversation,
    checkExist,
    deleteConversation
}