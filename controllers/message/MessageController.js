const { Types } = require("mongoose");
const { validationResult } = require("express-validator");
const { logger, baseResponse, defaultStartLimit, projectUserField, htmlEntities } = require("../../utils/helper");
const Message = require("../../models/Message");
const MessageRead = require("../../models/MessageRead");
const ConversationUser = require("../../models/ConversationUser");
const Conversation = require("../../models/Conversation");
const User = require("../../models/User");
const {queue} = require("../../services/queue");

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


const createMessage = async (req, res, next) => {
    try{
        const {conversationId} = req.params;
        const {message} = req.body;
        const errors = validationResult(req);
        if(!errors.isEmpty()){
            baseResponse.error(res, 422, 'Vui lòng nhập đủ thông tin.', errors.array());
            return;
        }
        const [conversation, conversationUsers] = await Promise.all([Conversation.findById(conversationId), ConversationUser.find({conversationId: conversationId})]);
        if(!conversation){
            baseResponse.json(res, 404, "Cuộc hội thoại không tồn tại.");
            return;
        }
        const uniqueUsers = conversationUsers.filter((obj) => obj.userId != req.user.id).map((obj) => obj.userId);
        const queryMessage = Message.create({
            conversationId: conversationId,
            from: req.user.id,
            to: uniqueUsers,
            message: htmlEntities(message)
        });
        const queryListUser = User.find({_id: {$in: conversationUsers.filter((obj) => obj.userId != req.user.id).map((obj) => obj.userId)}}, {...projectUserField()});
        const [createdMessage, listUsers] = await Promise.all([queryMessage, queryListUser]);
        queue.create('message', {
            to: uniqueUsers,
            conversation: {
                ...conversation.toJSON(),
                users: conversationUsers,
                userInfos: listUsers,
                lastMessage: message
            },
            message: createdMessage
        }).save();
        baseResponse.json(res, 200, 'Thành công', {
            item: createdMessage
        });
    }catch(e){
        logger.error(e);
        baseResponse.error(res);
    }
}

const deleteMessage = async (req, res, next) => {
    try{
        const {messageId} = req.params;
        const message = await Message.findById(messageId);
        if(!message){
            baseResponse.json(res, 404, "Tin nhắn không tồn tại.");
            return;
        }
        if(message.from != req.user.id){
            baseResponse.json(res, 403, "Bạn không có quyền thực hiện thao tác này.");
            return;
        }
        await Promise.all([
            message.delete(),
            MessageRead.deleteMany({messageId})
        ]);
        baseResponse.json(res, 200, "Thành công", {
            item: message
        });
    }catch(e){
        logger.error(e);
        baseResponse.error(res);
    }
}

const readMessage = async (req, res, next) => {
    try{
        const {messageId, conversationId} = req.params;
        const [message, readingExist] = await Promise.all([Message.findById(messageId), MessageRead.findOne({conversationId, userId: req.user.id})]);
        if(!message){
            baseResponse.json(res, 404, "Tin nhắn không tồn tại.");
            return;
        }
        if(readingExist){
            readingExist.messageId = messageId;
            await readingExist.save();
            baseResponse.json(res, 200, "Thành công", {
                reading: readingExist
            });
            queue.create("reading", {reading: readingExist, conversationId, messageId, userId: req.user.id}).save();
            return;
        }
        const reading = await MessageRead.create({
            userId: req.user.id,
            conversationId: message.conversationId,
            messageId
        });
        queue.create("reading", {reading, conversationId, messageId, userId: req.user.id}).save();
        baseResponse.json(res, 200, "Thành công", {
            reading
        });
    }catch(e){
        logger.error(e);
        baseResponse.error(res);
    }
}

module.exports = {
    getList,
    createMessage,
    readMessage,
    deleteMessage
}